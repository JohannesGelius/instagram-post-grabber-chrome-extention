// popup.ts - Popup Interface für die Chrome Extension
import type { ExtensionSettings } from '../types/index.js';

class PopupManager {
    private settings: ExtensionSettings = {
        autoDownload: false,
        downloadVideos: true,
        downloadThumbnails: true,
        folderStructure: 'profile',
        maxPosts: 50
    };

    constructor() {
        this.initializePopup();
    }

    private async initializePopup(): Promise<void> {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
    }

    private async loadSettings(): Promise<void> {
        try {
            const result = await chrome.storage.sync.get(this.settings);
            this.settings = { ...this.settings, ...result };
        } catch (error) {
            console.error('Fehler beim Laden der Einstellungen:', error);
        }
    }

    private async saveSettings(): Promise<void> {
        try {
            await chrome.storage.sync.set(this.settings);
        } catch (error) {
            console.error('Fehler beim Speichern der Einstellungen:', error);
        }
    }

    private setupEventListeners(): void {
        // Auto-Download Toggle
        const autoDownloadToggle = document.getElementById('autoDownload') as HTMLInputElement;
        autoDownloadToggle.addEventListener('change', (e) => {
            this.settings.autoDownload = (e.target as HTMLInputElement).checked;
            this.saveSettings();
        });

        // Download Videos Toggle
        const downloadVideosToggle = document.getElementById('downloadVideos') as HTMLInputElement;
        downloadVideosToggle.addEventListener('change', (e) => {
            this.settings.downloadVideos = (e.target as HTMLInputElement).checked;
            this.saveSettings();
        });

        // Download Thumbnails Toggle
        const downloadThumbnailsToggle = document.getElementById('downloadThumbnails') as HTMLInputElement;
        downloadThumbnailsToggle.addEventListener('change', (e) => {
            this.settings.downloadThumbnails = (e.target as HTMLInputElement).checked;
            this.saveSettings();
        });

        // Folder Structure Select
        const folderStructureSelect = document.getElementById('folderStructure') as HTMLSelectElement;
        folderStructureSelect.addEventListener('change', (e) => {
            this.settings.folderStructure = (e.target as HTMLSelectElement).value as 'profile' | 'date' | 'flat';
            this.saveSettings();
        });

        // Max Posts Input
        const maxPostsInput = document.getElementById('maxPosts') as HTMLInputElement;
        maxPostsInput.addEventListener('change', (e) => {
            const value = parseInt((e.target as HTMLInputElement).value);
            this.settings.maxPosts = Math.max(1, Math.min(100, value));
            this.saveSettings();
        });

        // Start Download Button
        const startDownloadBtn = document.getElementById('startDownload') as HTMLButtonElement;
        startDownloadBtn.addEventListener('click', () => {
            this.startDownload();
        });

        // Stop Download Button
        const stopDownloadBtn = document.getElementById('stopDownload') as HTMLButtonElement;
        stopDownloadBtn.addEventListener('click', () => {
            this.stopDownload();
        });

        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
            if (message.type === 'downloadStats') {
                this.updateDownloadStats(message.stats);
            }
        });
    }

    private updateUI(): void {
        // Set toggle states
        (document.getElementById('autoDownload') as HTMLInputElement).checked = this.settings.autoDownload;
        (document.getElementById('downloadVideos') as HTMLInputElement).checked = this.settings.downloadVideos;
        (document.getElementById('downloadThumbnails') as HTMLInputElement).checked = this.settings.downloadThumbnails;
        
        // Set select value
        (document.getElementById('folderStructure') as HTMLSelectElement).value = this.settings.folderStructure;
        
        // Set input value
        (document.getElementById('maxPosts') as HTMLInputElement).value = this.settings.maxPosts.toString();
    }

    private async startDownload(): Promise<void> {
        try {
            // Send message to content script to start download
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab.id) {
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'startDownload',
                    settings: this.settings
                });
                
                this.updateStatus('Downloading...', 'downloading');
                this.toggleButtons(true);
            }
        } catch (error) {
            console.error('Fehler beim Starten des Downloads:', error);
            this.updateStatus('Fehler beim Starten', 'error');
        }
    }

    private async stopDownload(): Promise<void> {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab.id) {
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'stopDownload'
                });
                
                this.updateStatus('Gestoppt', 'ready');
                this.toggleButtons(false);
            }
        } catch (error) {
            console.error('Fehler beim Stoppen des Downloads:', error);
        }
    }

    private updateStatus(text: string, type: 'ready' | 'downloading' | 'error'): void {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = text;
            statusElement.className = `text-sm font-medium status-${type}`;
        }
    }

    private updateDownloadStats(stats: any): void {
        const downloadCountElement = document.getElementById('downloadCount');
        if (downloadCountElement) {
            downloadCountElement.textContent = stats.totalMedia?.toString() || '0';
        }
    }

    private toggleButtons(isDownloading: boolean): void {
        const startBtn = document.getElementById('startDownload') as HTMLButtonElement;
        const stopBtn = document.getElementById('stopDownload') as HTMLButtonElement;
        
        if (isDownloading) {
            startBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
        } else {
            startBtn.classList.remove('hidden');
            stopBtn.classList.add('hidden');
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
