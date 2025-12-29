// content.ts - Content Script für Instagram
import type { DownloadMessage, DownloadControl, DownloadStats, ExtensionSettings } from '../types/index.js';
import { getPostImages, getVideoSources, getPostVideos } from '../utils/domUtils.js';
import { downloadBlobUrl, isBlobUrl } from '../utils/blobUtils.js';
import { downloadVideoWithFallback } from '../utils/videoDownloadUtils.js';
import { generateUniqueFilename } from '../utils/filenameUtils.js';
import { loadSettings } from '../utils/storageUtils.js';
import { DOWNLOAD_CONFIG } from '../config/constants.js';

console.log('[Extension] Instagram Multi-Post Full-Res Downloader geladen');

class InstagramDownloader {
    private activeDownloads = new Map<HTMLElement, DownloadControl>();
    private downloadStats: DownloadStats = {
        totalPosts: 0,
        totalMedia: 0,
        currentPost: 0,
        isRunning: false
    };
    private settings: ExtensionSettings = {
        autoDownload: false,
        downloadVideos: true,
        downloadThumbnails: true,
        folderStructure: 'profile',
        maxPosts: 1000 // Erhöhtes Standard-Limit
    };
    private downloadedUrls = new Set<string>(); // Verhindert doppelte Downloads

    constructor() {
        this.loadSettings();
        this.initializeDownloader();
    }

    private async loadSettings(): Promise<void> {
        this.settings = await loadSettings();
    }

    private initializeDownloader(): void {
        // Initialisierung alle 200ms
        setInterval(() => this.addButtons(), DOWNLOAD_CONFIG.BUTTON_CHECK_INTERVAL);
        
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
        _index: number, 
        profileName: string, 
        postDate: Date, 
        isVideoThumbnail = false,
        isVideo = false
    ): Promise<boolean> {
        // Prüfe ob URL bereits heruntergeladen wurde
        if (this.downloadedUrls.has(url)) {
            console.log('[Download] URL bereits heruntergeladen, überspringe:', url);
            return false;
        }

        // Verwende generateUniqueFilename für eindeutige Dateinamen basierend auf URL-Hash
        const filename = generateUniqueFilename(
            url,
            profileName,
            postDate,
            this.settings,
            isVideoThumbnail,
            isVideo
        );

        // Retry-Mechanismus bei Fehlern
        let retries = 0;
        const maxRetries = DOWNLOAD_CONFIG.MAX_RETRIES;

        while (retries <= maxRetries) {
            try {
                let success = false;

                // Für Blob-URLs verwende die spezielle Download-Funktion
                if (isBlobUrl(url)) {
                    success = await downloadBlobUrl(url, filename);
                    if (success) {
                        console.log(`[Blob Download] Erfolgreich: ${filename}`);
                        this.downloadedUrls.add(url);
                        this.downloadStats.totalMedia++;
                        return true;
                    } else {
                        console.warn(`[Blob Download] Fehlgeschlagen (Versuch ${retries + 1}/${maxRetries + 1}): ${filename}`);
                    }
                } else {
                    // Für normale URLs verwende die Chrome Download API
                    success = await new Promise<boolean>((resolve) => {
                        const message: DownloadMessage = {
                            action: "download",
                            url,
                            filename
                        };

                        chrome.runtime.sendMessage(message, (response) => {
                            if (chrome.runtime.lastError) {
                                console.warn(`[Download] Fehler (Versuch ${retries + 1}/${maxRetries + 1}):`, chrome.runtime.lastError.message);
                                resolve(false);
                            } else if (response?.success) {
                                console.log(`[Download] Erfolgreich angefragt: ${filename}`);
                                this.downloadedUrls.add(url);
                                this.downloadStats.totalMedia++;
                                resolve(true);
                            } else {
                                console.warn(`[Download] Fehlgeschlagen (Versuch ${retries + 1}/${maxRetries + 1}):`, response?.error);
                                resolve(false);
                            }
                        });
                    });

                    if (success) {
                        return true;
                    }
                }

                // Wenn fehlgeschlagen und noch Versuche übrig
                if (!success && retries < maxRetries) {
                    retries++;
                    await new Promise(r => setTimeout(r, DOWNLOAD_CONFIG.RETRY_DELAY));
                    continue;
                }

                // Wenn alle Versuche fehlgeschlagen sind, trotzdem weitermachen
                console.error('[Download] Alle Versuche fehlgeschlagen, überspringe:', url);
                return false;

            } catch (error) {
                console.error(`[Download] Exception (Versuch ${retries + 1}/${maxRetries + 1}):`, error);
                if (retries < maxRetries) {
                    retries++;
                    await new Promise(r => setTimeout(r, DOWNLOAD_CONFIG.RETRY_DELAY));
                } else {
                    console.error('[Download] Alle Versuche fehlgeschlagen nach Exception, überspringe:', url);
                    return false;
                }
            }
        }

        return false;
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
            try {
                if (img.naturalHeight < DOWNLOAD_CONFIG.MIN_IMAGE_HEIGHT) continue; // kleine Avatare ignorieren
                if (!seenUrls.has(img.src)) {
                    console.log("[DEBUG] Ein Bild → wird geladen:", img.src);
                    seenUrls.add(img.src);
                    await this.downloadMedia(img.src, seenUrls.size, profileName, postDate, false, false);
                    console.log("[DEBUG] Bild wurde geladen.");
                    foundNew = true;
                    await new Promise(r => setTimeout(r, DOWNLOAD_CONFIG.DOWNLOAD_DELAY));
                }
            } catch (error) {
                console.error('[Download] Fehler beim Bild-Download, überspringe:', error);
                // Weiter mit nächstem Bild
            }
        }

        // 2. Videos im Post - sowohl Blob-URLs als auch Thumbnails
        const videoSources = getVideoSources(post);
        const videoElements = getPostVideos(post);
        console.log(`[DEBUG] Gefundene Video-Quellen: ${videoSources.length}`);
        console.log(`[DEBUG] Gefundene Video-Elemente: ${videoElements.length}`);
        
        for (const source of videoSources) {
            try {
                console.log(`[DEBUG] Video-Quelle: ${source.url} (${source.type})`);
                
                if (!seenUrls.has(source.url)) {
                    console.log(`[DEBUG] Video-Quelle → wird geladen: ${source.url} (${source.type})`);
                    seenUrls.add(source.url);
                    
                    if (source.type === 'blob') {
                        // Blob-URL = echtes Video - verwende Fallback-Methoden
                        console.log("[DEBUG] Starte Video-Download mit Fallback-Methoden...");
                        
                        // Verwende generateUniqueFilename für eindeutige Dateinamen
                        const filename = generateUniqueFilename(
                            source.url,
                            profileName,
                            postDate,
                            this.settings,
                            false,
                            true
                        );
                        
                        // Prüfe ob bereits heruntergeladen
                        if (this.downloadedUrls.has(source.url)) {
                            console.log('[Download] Video-URL bereits heruntergeladen, überspringe:', source.url);
                            continue;
                        }
                        
                        // Finde das entsprechende Video-Element
                        const videoElement = videoElements.find(vid => vid.src === source.url);
                        
                        // Retry-Mechanismus für Videos
                        let retries = 0;
                        let success = false;
                        while (retries <= DOWNLOAD_CONFIG.MAX_RETRIES && !success) {
                            try {
                                success = await downloadVideoWithFallback(videoElement || null, source.url, filename);
                                if (success) {
                                    console.log("[DEBUG] Video wurde erfolgreich geladen.");
                                    this.downloadedUrls.add(source.url);
                                    this.downloadStats.totalMedia++;
                                    foundNew = true;
                                } else {
                                    console.warn(`[DEBUG] Video-Download fehlgeschlagen (Versuch ${retries + 1}/${DOWNLOAD_CONFIG.MAX_RETRIES + 1}).`);
                                    retries++;
                                    if (retries <= DOWNLOAD_CONFIG.MAX_RETRIES) {
                                        await new Promise(r => setTimeout(r, DOWNLOAD_CONFIG.RETRY_DELAY));
                                    }
                                }
                            } catch (error) {
                                console.error(`[DEBUG] Video-Download Exception (Versuch ${retries + 1}/${DOWNLOAD_CONFIG.MAX_RETRIES + 1}):`, error);
                                retries++;
                                if (retries <= DOWNLOAD_CONFIG.MAX_RETRIES) {
                                    await new Promise(r => setTimeout(r, DOWNLOAD_CONFIG.RETRY_DELAY));
                                }
                            }
                        }
                        
                        if (!success) {
                            console.error("[DEBUG] Video-Download nach allen Versuchen fehlgeschlagen, überspringe.");
                        }
                    } else {
                        // CDN-URL = Thumbnail
                        console.log("[DEBUG] Starte Thumbnail-Download...");
                        const success = await this.downloadMedia(source.url, seenUrls.size, profileName, postDate, true, false);
                        if (success) {
                            console.log("[DEBUG] Video-Thumbnail wurde geladen.");
                            foundNew = true;
                        }
                    }
                    
                    await new Promise(r => setTimeout(r, DOWNLOAD_CONFIG.VIDEO_DELAY)); // Pause für Videos
                } else {
                    console.log(`[DEBUG] Video-Quelle bereits gesehen: ${source.url}`);
                }
            } catch (error) {
                console.error('[Download] Fehler beim Video-Download, überspringe:', error);
                // Weiter mit nächstem Video
            }
        }

        console.log("[DEBUG] Nächstes Carousel-Item...");
        return foundNew;
    }

    private async downloadSinglePost(post: HTMLElement, control: DownloadControl): Promise<number> {
        const seenUrls = new Set<string>();
        let profileName = "instagram";
        let postDate = new Date();
        let noNewCount = 0;
        
        try {
            profileName = this.getProfileName(post);
            postDate = this.getPostDate(post);
        } catch (error) {
            console.error('[Post] Fehler beim Extrahieren von Profilname/Datum, verwende Standardwerte:', error);
        }

        console.log('[Post] Starte Download für:', profileName);

        try {
            // Ersten Slide laden
            await this.downloadCurrentCarouselItem(post, seenUrls, profileName, postDate);
            await new Promise(r => setTimeout(r, DOWNLOAD_CONFIG.CAROUSEL_DELAY));

            // Durch Carousel iterieren
            while (!control.shouldStop && noNewCount < DOWNLOAD_CONFIG.MAX_NO_NEW_COUNT) {
                try {
                    const nextBtn = post.querySelector('button[aria-label="Weiter"]') || 
                                   post.querySelector('button[aria-label="Next"]');
                    
                    if (!nextBtn || (nextBtn as HTMLElement).offsetParent === null) {
                        console.log('[Carousel] Kein Weiter-Button → Ende');
                        break;
                    }

                    const sizeBefore = seenUrls.size;
                    console.log('[Carousel] Klicke Weiter...');
                    (nextBtn as HTMLElement).click();
                    await new Promise(r => setTimeout(r, DOWNLOAD_CONFIG.CAROUSEL_DELAY));

                    const foundNew = await this.downloadCurrentCarouselItem(post, seenUrls, profileName, postDate);
                    
                    if (seenUrls.size === sizeBefore || !foundNew) {
                        noNewCount++;
                        console.log(`[Carousel] Keine neuen Medien (${noNewCount}/${DOWNLOAD_CONFIG.MAX_NO_NEW_COUNT})`);
                    } else {
                        noNewCount = 0;
                    }
                } catch (error) {
                    console.error('[Carousel] Fehler beim Navigieren, versuche weiter:', error);
                    noNewCount++;
                    if (noNewCount >= DOWNLOAD_CONFIG.MAX_NO_NEW_COUNT) {
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('[Post] Fehler beim Download, versuche trotzdem weiter:', error);
        }

        console.log(`[Post] Fertig! ${seenUrls.size} Medien heruntergeladen`);
        return seenUrls.size;
    }

    private async downloadAllPosts(startPost: HTMLElement, control: DownloadControl): Promise<void> {
        let currentPost = startPost;
        let postCount = 0;
        let consecutiveErrors = 0;
        const maxConsecutiveErrors = 5;
        let noNewPostCount = 0;
        const maxNoNewPostCount = 10; // Stoppe nach 10 Posts ohne neuen Post

        // Kein Limit mehr - lade alle Posts bis zum Ende
        while (!control.shouldStop) {
            try {
                if (control.shouldStop) {
                    console.log('[Posts] Download gestoppt');
                    return;
                }

                await this.downloadSinglePost(currentPost, control);
                postCount++;
                this.downloadStats.currentPost = postCount;
                consecutiveErrors = 0; // Reset error counter bei Erfolg

                if (control.shouldStop) return;

                console.log(`[Posts] Post ${postCount} abgeschlossen, springe zum nächsten...`);
                
                try {
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
                    await new Promise(r => setTimeout(r, DOWNLOAD_CONFIG.CAROUSEL_DELAY));

                    const newPost = document.querySelector('article[role="presentation"]') as HTMLElement;
                    
                    if (!newPost) {
                        console.log('[Posts] Kein weiterer Post gefunden → Ende');
                        noNewPostCount++;
                        if (noNewPostCount >= maxNoNewPostCount) {
                            console.log('[Posts] Zu viele Versuche ohne neuen Post → Ende');
                            break;
                        }
                        await new Promise(r => setTimeout(r, DOWNLOAD_CONFIG.CAROUSEL_DELAY));
                        continue;
                    }

                    if (newPost === currentPost) {
                        console.log('[Posts] Gleicher Post wie vorher');
                        noNewPostCount++;
                        if (noNewPostCount >= maxNoNewPostCount) {
                            console.log('[Posts] Zu viele Versuche ohne neuen Post → Ende');
                            break;
                        }
                        await new Promise(r => setTimeout(r, DOWNLOAD_CONFIG.CAROUSEL_DELAY));
                        continue;
                    }

                    // Neuer Post gefunden - reset counter
                    noNewPostCount = 0;
                    currentPost = newPost;
                } catch (error) {
                    console.error('[Posts] Fehler beim Navigieren zum nächsten Post:', error);
                    consecutiveErrors++;
                    if (consecutiveErrors >= maxConsecutiveErrors) {
                        console.error('[Posts] Zu viele aufeinanderfolgende Fehler, stoppe Download');
                        break;
                    }
                    // Versuche trotzdem weiter
                    await new Promise(r => setTimeout(r, DOWNLOAD_CONFIG.CAROUSEL_DELAY));
                }
            } catch (error) {
                console.error('[Posts] Fehler beim Download eines Posts, versuche weiter:', error);
                consecutiveErrors++;
                if (consecutiveErrors >= maxConsecutiveErrors) {
                    console.error('[Posts] Zu viele aufeinanderfolgende Fehler, stoppe Download');
                    break;
                }
                // Versuche trotzdem weiter
                await new Promise(r => setTimeout(r, DOWNLOAD_CONFIG.CAROUSEL_DELAY));
            }
        }

        this.downloadStats.totalPosts = postCount;
        console.log(`[Posts] Alle Posts abgeschlossen! Insgesamt ${postCount} Posts verarbeitet`);
    }
}

// Initialisierung
new InstagramDownloader();
