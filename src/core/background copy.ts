// background.ts - Service Worker für Chrome Extension
import type { DownloadMessage } from '../types/index.js';

console.log('[Background] Instagram Post Grabber Service Worker gestartet');

// Message Listener für Download-Anfragen
chrome.runtime.onMessage.addListener((message: DownloadMessage, _sender, sendResponse) => {
    if (message.action === "download") {
        console.log("[Background] Download-Anfrage erhalten:", message.filename);

        chrome.downloads.download({
            url: message.url,
            filename: message.filename,
            conflictAction: "uniquify"
        }, (downloadId?: number) => {
            if (chrome.runtime.lastError) {
                console.error("[Background] Download-Fehler:", chrome.runtime.lastError.message);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                console.log("[Background] Download gestartet, ID:", downloadId);
                sendResponse({ success: true, downloadId });
            }
        });

        // Return true to indicate we will send a response asynchronously
        return true;
    }
});

// Installation Event
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[Background] Extension installiert/aktualisiert:', details.reason);
    
    // Set default settings
    chrome.storage.sync.set({
        autoDownload: false,
        downloadVideos: true,
        downloadThumbnails: true,
        folderStructure: 'profile',
        maxPosts: 50
    });
});

// Download Event Listener
chrome.downloads.onChanged.addListener((downloadDelta) => {
    if (downloadDelta.state?.current === 'complete') {
        console.log('[Background] Download abgeschlossen:', downloadDelta.id);
    }
});
