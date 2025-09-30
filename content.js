// content.js
console.log('[Extension] Instagram Multi-Post Full-Res Downloader geladen');

const activeDownloads = new Map();

function addButtons() {
    const posts = document.querySelectorAll('article');
    posts.forEach(post => {
        if (!post.querySelector('.fullres-btn-container')) {
            const container = document.createElement('div');
            container.className = 'fullres-btn-container';
            Object.assign(container.style, {
                position: 'absolute',
                top: '5px',
                right: '5px',
                zIndex: 99999,
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                pointerEvents: 'auto'
            });

            // Download Button
            const btn = document.createElement('div');
            btn.className = 'fullres-btn';
            btn.title = 'Download starten';
            btn.textContent = '▶'; // Startsymbol
            Object.assign(btn.style, {
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                backgroundColor: 'green',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'background-color 0.3s ease'
            });

            container.appendChild(btn);
            post.style.position = 'relative';
            post.appendChild(container);

            let animationInterval = null;
            const control = { shouldStop: false };

            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();

                const isRunning = activeDownloads.has(post);

                if (isRunning) {
                    // Stoppen
                    console.log('[Button] Stoppe Download...');
                    control.shouldStop = true;
                    activeDownloads.delete(post);
                    btn.style.backgroundColor = 'green';
                    btn.textContent = '▶';
                    btn.title = 'Download starten';
                    if (animationInterval) {
                        clearInterval(animationInterval);
                        animationInterval = null;
                    }
                    btn.style.boxShadow = 'none';
                } else {
                    // Starten
                    console.log('[Button] Starte Download...');
                    control.shouldStop = false;
                    activeDownloads.set(post, control);
                    btn.style.backgroundColor = 'red';
                    btn.textContent = '⏸';
                    btn.title = 'Download pausieren';
                    animationInterval = pulseAnimation(btn);
                    
                    await downloadAllPosts(post, control);
                    
                    // Nach Abschluss zurücksetzen
                    if (activeDownloads.has(post)) {
                        activeDownloads.delete(post);
                        btn.style.backgroundColor = 'green';
                        btn.textContent = '▶';
                        btn.title = 'Download starten';
                        if (animationInterval) {
                            clearInterval(animationInterval);
                            animationInterval = null;
                        }
                        btn.style.boxShadow = 'none';
                    }
                }
            });
        }
    });
}

function pulseAnimation(element) {
    let grow = true;
    let shadowSize = 0;
    const interval = setInterval(() => {
        if (!element || !element.style) {
            clearInterval(interval);
            return;
        }
        shadowSize = grow ? shadowSize + 2 : shadowSize - 2;
        if (shadowSize >= 20) grow = false;
        if (shadowSize <= 0) grow = true;
        element.style.boxShadow = `0 0 ${shadowSize}px ${shadowSize/2}px rgba(255,0,0,0.7)`;
    }, 100);
    return interval;
}

function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function getProfileName(post) {
    const el = post.querySelector('header a span') || post.querySelector('a[role="link"] span');
    return el ? el.textContent.trim().replace(/\W+/g, "_") : "instagram";
}

function getPostDate(post) {
    const timeEl = post.querySelector('time');
    if (timeEl && timeEl.getAttribute('datetime')) {
        return new Date(timeEl.getAttribute('datetime'));
    }
    return new Date();
}

async function downloadMedia(url, index, profileName, postDate, isVideoThumbnail = false) {
    const timestamp = Date.now();
    const formattedDate = formatDate(postDate);
    const extension = 'jpg';

    let filename;
    if (isVideoThumbnail) {
        filename = `${profileName}/${profileName}_${timestamp}_${index}_${formattedDate}_thumbnail.${extension}`;
    } else {
        filename = `${profileName}/${profileName}_${timestamp}_${index}_${formattedDate}.${extension}`;
    }

    try {
        chrome.runtime.sendMessage({
            action: "download",
            url,
            filename
        });
        console.log(`[Download] Erfolgreich angefragt: ${filename}`);
    } catch (error) {
        console.error('[Download] Fehlgeschlagen:', error);
    }
}

async function downloadCurrentCarouselItem(post, seenUrls, profileName, postDate) {
    let foundNew = false;

    // 1. Bilder im Post
    const imgs = [...post.querySelectorAll('img')]
        .filter(img => img.src && img.src.includes('cdninstagram'));

    for (const img of imgs) {
        if (img.naturalheight < 400) continue; // kleine Avatare ignorieren
        if (!seenUrls.has(img.src)) {
            console.log("[DEBUG] Ein Bild → wird geladen:", img.src);
            seenUrls.add(img.src);
            await downloadMedia(img.src, seenUrls.size, profileName, postDate, false);
            console.log("[DEBUG] Bild wurde geladen.");
            foundNew = true;
            await new Promise(r => setTimeout(r, 300));
        }
    }

    // 2. Videos im Post → nur Thumbnail (poster)
    const videos = [...post.querySelectorAll('video')]
        .filter(vid => vid.poster && vid.poster.includes('cdninstagram'));

    for (const vid of videos) {
        if (!seenUrls.has(vid.poster)) {
            console.log("[DEBUG] Ein Video → Thumbnail wird geladen:", vid.poster);
            seenUrls.add(vid.poster);
            await downloadMedia(vid.poster, seenUrls.size, profileName, postDate, false);
            console.log("[DEBUG] Thumbnail wurde geladen.");
            foundNew = true;
            await new Promise(r => setTimeout(r, 300));
        }
    }

    console.log("[DEBUG] Nächstes Carousel-Item...");
    return foundNew;
}

async function downloadSinglePost(post, control) {
    const seenUrls = new Set();
    const profileName = getProfileName(post);
    const postDate = getPostDate(post);
    let noNewCount = 0;

    console.log('[Post] Starte Download für:', profileName);

    // Ersten Slide laden
    await downloadCurrentCarouselItem(post, seenUrls, profileName, postDate);
    await new Promise(r => setTimeout(r, 50));

    // Durch Carousel iterieren
    while (!control.shouldStop && noNewCount < 2) {
        const nextBtn = post.querySelector('button[aria-label="Weiter"]') || 
                       post.querySelector('button[aria-label="Next"]');
        
        if (!nextBtn || nextBtn.offsetParent === null) {
            console.log('[Carousel] Kein Weiter-Button → Ende');
            break;
        }

        const sizeBefore = seenUrls.size;
        console.log('[Carousel] Klicke Weiter...');
        nextBtn.click();
        await new Promise(r => setTimeout(r, 150));

        const foundNew = await downloadCurrentCarouselItem(post, seenUrls, profileName, postDate);
        
        if (seenUrls.size === sizeBefore || !foundNew) {
            noNewCount++;
            console.log(`[Carousel] Keine neuen Medien (${noNewCount}/2)`);
        } else {
            noNewCount = 0;
        }
    }

    console.log(`[Post] Fertig! ${seenUrls.size} Medien heruntergeladen`);
    return seenUrls.size;
}

async function downloadAllPosts(startPost, control) {
    let currentPost = startPost;
    let postCount = 0;

    while (!control.shouldStop && postCount < 50) {
        if (control.shouldStop) {
            console.log('[Posts] Download gestoppt');
            return;
        }

        const mediaCount = await downloadSinglePost(currentPost, control);
        postCount++;

        if (control.shouldStop) return;

        console.log(`[Posts] Post ${postCount} abgeschlossen, springe zum nächsten...`);
        
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        await new Promise(r => setTimeout(r, 200));

        const newPost = document.querySelector('article[role="presentation"]');
        
        if (!newPost) {
            console.log('[Posts] Kein weiterer Post gefunden → Ende');
            break;
        }

        if (newPost === currentPost) {
            console.log('[Posts] Keine weiteren Posts mehr');
            break;
        }

        currentPost = newPost;
    }

    console.log(`[Posts] Alle Posts abgeschlossen! Insgesamt ${postCount} Posts verarbeitet`);
}

// Initialisierung
setInterval(addButtons, 200);
