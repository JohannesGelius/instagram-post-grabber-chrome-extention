// content.ts - Content Script für Instagram
import type { DownloadMessage, DownloadControl, DownloadStats } from '../types/index.js';
import { getPostImages, getVideoSources, getPostVideos } from '../utils/domUtils.js';
import { downloadBlobUrl, isBlobUrl } from '../utils/blobUtils.js';
import { downloadVideoWithFallback } from '../utils/videoDownloadUtils.js';
// import { generateFilename } from '../utils/filenameUtils.js';

console.log('[Extension] Instagram Multi-Post Full-Res Downloader geladen');

class InstagramDownloader {
    private activeDownloads = new Map<HTMLElement, DownloadControl>();
    private downloadStats: DownloadStats = {
        totalPosts: 0,
        totalMedia: 0,
        currentPost: 0,
        isRunning: false
    };

    constructor() {
        this.initializeDownloader();
    }

    private initializeDownloader(): void {
        // Initialisierung alle 200ms
        setInterval(() => this.addButtons(), 200);
        
        // Observer für neue Posts
        this.setupPostObserver();
    }

    private setupPostObserver(): void {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as HTMLElement;
                            if (element.querySelector('article')) {
                                this.addButtons();
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    private addButtons(): void {
        const posts = document.querySelectorAll('article');
        posts.forEach(post => {
            if (!post.querySelector('.instagram-downloader-container')) {
                this.createDownloadButton(post as HTMLElement);
            }
        });
    }

    private createDownloadButton(post: HTMLElement): void {
        const container = document.createElement('div');
        container.className = 'instagram-downloader-container';
        
        // Tailwind CSS Klassen für modernes Design
        Object.assign(container.style, {
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: '99999',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            pointerEvents: 'auto'
        });

        const button = document.createElement('button');
        button.className = 'instagram-download-btn ready';
        button.title = 'Download starten';
        button.innerHTML = '<span class="icon">▶</span>';
        
        // Button ist bereits durch CSS gestylt

        container.appendChild(button);
        post.style.position = 'relative';
        post.appendChild(container);

        this.setupButtonEvents(button, post);
    }

    private setupButtonEvents(button: HTMLButtonElement, post: HTMLElement): void {
        let animationInterval: NodeJS.Timeout | null = null;
        const control: DownloadControl = { shouldStop: false };

        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();

            const isRunning = this.activeDownloads.has(post);

            if (isRunning) {
                await this.stopDownload(button, post, control, animationInterval);
            } else {
                await this.startDownload(button, post, control, animationInterval);
            }
        });
    }

    private async stopDownload(
        button: HTMLButtonElement, 
        post: HTMLElement, 
        control: DownloadControl, 
        animationInterval: NodeJS.Timeout | null
    ): Promise<void> {
        console.log('[Button] Stoppe Download...');
        control.shouldStop = true;
        this.activeDownloads.delete(post);
        this.downloadStats.isRunning = false;
        
        button.className = 'instagram-download-btn ready';
        button.innerHTML = '<span class="icon">▶</span>';
        button.title = 'Download starten';
        
        if (animationInterval) {
            clearInterval(animationInterval);
        }
    }

    private async startDownload(
        button: HTMLButtonElement, 
        post: HTMLElement, 
        control: DownloadControl, 
        animationInterval: NodeJS.Timeout | null
    ): Promise<void> {
        console.log('[Button] Starte Download...');
        control.shouldStop = false;
        this.activeDownloads.set(post, control);
        this.downloadStats.isRunning = true;
        
        button.className = 'instagram-download-btn downloading';
        button.innerHTML = '<span class="icon">⏸</span>';
        button.title = 'Download pausieren';
        
        animationInterval = this.startPulseAnimation(button);
        
        try {
            await this.downloadAllPosts(post, control);
        } finally {
            // Nach Abschluss zurücksetzen
            if (this.activeDownloads.has(post)) {
                await this.stopDownload(button, post, control, animationInterval);
            }
        }
    }

    private startPulseAnimation(element: HTMLButtonElement): NodeJS.Timeout {
        let grow = true;
        let shadowSize = 0;
        
        return setInterval(() => {
            if (!element || !element.style) {
                return;
            }
            
            shadowSize = grow ? shadowSize + 2 : shadowSize - 2;
            if (shadowSize >= 20) grow = false;
            if (shadowSize <= 0) grow = true;
            
            element.style.boxShadow = `0 0 ${shadowSize}px ${shadowSize/2}px rgba(220, 38, 38, 0.7)`;
        }, 100);
    }

    private formatDate(date: Date): string {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    }

    private getProfileName(post: HTMLElement): string {
        const el = post.querySelector('header a span') || post.querySelector('a[role="link"] span');
        return el ? el.textContent?.trim().replace(/\W+/g, "_") || "instagram" : "instagram";
    }

    private getPostDate(post: HTMLElement): Date {
        const timeEl = post.querySelector('time');
        if (timeEl && timeEl.getAttribute('datetime')) {
            return new Date(timeEl.getAttribute('datetime')!);
        }
        return new Date();
    }

    private async downloadMedia(
        url: string, 
        index: number, 
        profileName: string, 
        postDate: Date, 
        isVideoThumbnail = false,
        isVideo = false
    ): Promise<void> {
        const timestamp = Date.now();
        const formattedDate = this.formatDate(postDate);
        
        // Bestimme die Dateiendung basierend auf dem Typ
        let extension: string;
        if (isBlobUrl(url)) {
            extension = isVideo ? 'mp4' : 'jpg';
        } else {
            extension = isVideo ? 'mp4' : 'jpg';
        }

        let filename: string;
        if (isVideoThumbnail) {
            filename = `${profileName}_${timestamp}_${index}_${formattedDate}_thumbnail.${extension}`;
        } else if (isVideo) {
            filename = `${profileName}_${timestamp}_${index}_${formattedDate}_video.${extension}`;
        } else {
            filename = `${profileName}_${timestamp}_${index}_${formattedDate}.${extension}`;
        }

        try {
            // Für Blob-URLs verwende die spezielle Download-Funktion
            if (isBlobUrl(url)) {
                const success = await downloadBlobUrl(url, filename);
                if (success) {
                    console.log(`[Blob Download] Erfolgreich: ${filename}`);
                    this.downloadStats.totalMedia++;
                } else {
                    console.error('[Blob Download] Fehlgeschlagen:', filename);
                }
                return;
            }

            // Für normale URLs verwende die Chrome Download API
            const message: DownloadMessage = {
                action: "download",
                url,
                filename
            };

            chrome.runtime.sendMessage(message, (response) => {
                if (response?.success) {
                    console.log(`[Download] Erfolgreich angefragt: ${filename}`);
                    this.downloadStats.totalMedia++;
                } else {
                    console.error('[Download] Fehlgeschlagen:', response?.error);
                }
            });
        } catch (error) {
            console.error('[Download] Fehlgeschlagen:', error);
        }
    }

    private async downloadCurrentCarouselItem(
        post: HTMLElement, 
        seenUrls: Set<string>, 
        profileName: string, 
        postDate: Date
    ): Promise<boolean> {
        let foundNew = false;

        // 1. Bilder im Post
        const imgs = getPostImages(post);
        for (const img of imgs) {
            if (img.naturalHeight < 400) continue; // kleine Avatare ignorieren
            if (!seenUrls.has(img.src)) {
                console.log("[DEBUG] Ein Bild → wird geladen:", img.src);
                seenUrls.add(img.src);
                await this.downloadMedia(img.src, seenUrls.size, profileName, postDate, false, false);
                console.log("[DEBUG] Bild wurde geladen.");
                foundNew = true;
                await new Promise(r => setTimeout(r, 300));
            }
        }

        // 2. Videos im Post - sowohl Blob-URLs als auch Thumbnails
        const videoSources = getVideoSources(post);
        const videoElements = getPostVideos(post);
        console.log(`[DEBUG] Gefundene Video-Quellen: ${videoSources.length}`);
        console.log(`[DEBUG] Gefundene Video-Elemente: ${videoElements.length}`);
        
        for (const source of videoSources) {
            console.log(`[DEBUG] Video-Quelle: ${source.url} (${source.type})`);
            
            if (!seenUrls.has(source.url)) {
                console.log(`[DEBUG] Video-Quelle → wird geladen: ${source.url} (${source.type})`);
                seenUrls.add(source.url);
                
                if (source.type === 'blob') {
                    // Blob-URL = echtes Video - verwende Fallback-Methoden
                    console.log("[DEBUG] Starte Video-Download mit Fallback-Methoden...");
                    
                    const timestamp = Date.now();
                    const formattedDate = this.formatDate(postDate);
                    const filename = `${profileName}_${timestamp}_${seenUrls.size}_${formattedDate}_video.mp4`;
                    
                    // Finde das entsprechende Video-Element
                    const videoElement = videoElements.find(vid => vid.src === source.url);
                    
                    const success = await downloadVideoWithFallback(videoElement || null, source.url, filename);
                    if (success) {
                        console.log("[DEBUG] Video wurde erfolgreich geladen.");
                        this.downloadStats.totalMedia++;
                        foundNew = true;
                    } else {
                        console.error("[DEBUG] Video-Download fehlgeschlagen.");
                    }
                } else {
                    // CDN-URL = Thumbnail
                    console.log("[DEBUG] Starte Thumbnail-Download...");
                    await this.downloadMedia(source.url, seenUrls.size, profileName, postDate, true, false);
                    console.log("[DEBUG] Video-Thumbnail wurde geladen.");
                    foundNew = true;
                }
                
                await new Promise(r => setTimeout(r, 500)); // Längere Pause für Videos
            } else {
                console.log(`[DEBUG] Video-Quelle bereits gesehen: ${source.url}`);
            }
        }

        console.log("[DEBUG] Nächstes Carousel-Item...");
        return foundNew;
    }

    private async downloadSinglePost(post: HTMLElement, control: DownloadControl): Promise<number> {
        const seenUrls = new Set<string>();
        const profileName = this.getProfileName(post);
        const postDate = this.getPostDate(post);
        let noNewCount = 0;

        console.log('[Post] Starte Download für:', profileName);

        // Ersten Slide laden
        await this.downloadCurrentCarouselItem(post, seenUrls, profileName, postDate);
        await new Promise(r => setTimeout(r, 50));

        // Durch Carousel iterieren
        while (!control.shouldStop && noNewCount < 2) {
            const nextBtn = post.querySelector('button[aria-label="Weiter"]') || 
                           post.querySelector('button[aria-label="Next"]');
            
            if (!nextBtn || (nextBtn as HTMLElement).offsetParent === null) {
                console.log('[Carousel] Kein Weiter-Button → Ende');
                break;
            }

            const sizeBefore = seenUrls.size;
            console.log('[Carousel] Klicke Weiter...');
            (nextBtn as HTMLElement).click();
            await new Promise(r => setTimeout(r, 150));

            const foundNew = await this.downloadCurrentCarouselItem(post, seenUrls, profileName, postDate);
            
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

    private async downloadAllPosts(startPost: HTMLElement, control: DownloadControl): Promise<void> {
        let currentPost = startPost;
        let postCount = 0;

        while (!control.shouldStop && postCount < 50) {
            if (control.shouldStop) {
                console.log('[Posts] Download gestoppt');
                return;
            }

            await this.downloadSinglePost(currentPost, control);
            postCount++;
            this.downloadStats.currentPost = postCount;

            if (control.shouldStop) return;

            console.log(`[Posts] Post ${postCount} abgeschlossen, springe zum nächsten...`);
            
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
            await new Promise(r => setTimeout(r, 200));

            const newPost = document.querySelector('article[role="presentation"]') as HTMLElement;
            
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

        this.downloadStats.totalPosts = postCount;
        console.log(`[Posts] Alle Posts abgeschlossen! Insgesamt ${postCount} Posts verarbeitet`);
    }
}

// Initialisierung
new InstagramDownloader();
