// storageUtils.ts - Chrome Storage Utility-Funktionen

import type { ExtensionSettings, DownloadStats, StorageData } from '../types/index.js';
import { STORAGE_KEYS } from '../config/constants.js';

/**
 * Lädt die Extension-Einstellungen aus dem Storage
 */
export async function loadSettings(): Promise<ExtensionSettings> {
  const defaultSettings: ExtensionSettings = {
    autoDownload: false,
    downloadVideos: true,
    downloadThumbnails: true,
    folderStructure: 'profile',
    maxPosts: 50
  };

  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
    return { ...defaultSettings, ...result[STORAGE_KEYS.SETTINGS] };
  } catch (error) {
    console.error('Fehler beim Laden der Einstellungen:', error);
    return defaultSettings;
  }
}

/**
 * Speichert die Extension-Einstellungen im Storage
 */
export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: settings });
  } catch (error) {
    console.error('Fehler beim Speichern der Einstellungen:', error);
  }
}

/**
 * Lädt die Download-Statistiken aus dem Storage
 */
export async function loadStats(): Promise<DownloadStats> {
  const defaultStats: DownloadStats = {
    totalPosts: 0,
    totalMedia: 0,
    currentPost: 0,
    isRunning: false
  };

  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.DOWNLOAD_STATS);
    return { ...defaultStats, ...result[STORAGE_KEYS.DOWNLOAD_STATS] };
  } catch (error) {
    console.error('Fehler beim Laden der Statistiken:', error);
    return defaultStats;
  }
}

/**
 * Speichert die Download-Statistiken im Storage
 */
export async function saveStats(stats: DownloadStats): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.DOWNLOAD_STATS]: stats });
  } catch (error) {
    console.error('Fehler beim Speichern der Statistiken:', error);
  }
}

/**
 * Lädt alle Storage-Daten
 */
export async function loadAllData(): Promise<StorageData> {
  const [settings, stats] = await Promise.all([
    loadSettings(),
    loadStats()
  ]);

  return {
    settings,
    stats,
    lastDownload: new Date()
  };
}

/**
 * Speichert alle Storage-Daten
 */
export async function saveAllData(data: StorageData): Promise<void> {
  await Promise.all([
    saveSettings(data.settings),
    saveStats(data.stats)
  ]);
}

/**
 * Löscht alle Storage-Daten
 */
export async function clearAllData(): Promise<void> {
  try {
    await Promise.all([
      chrome.storage.sync.clear(),
      chrome.storage.local.clear()
    ]);
  } catch (error) {
    console.error('Fehler beim Löschen der Daten:', error);
  }
}
