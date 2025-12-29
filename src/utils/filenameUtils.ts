// filenameUtils.ts - Dateiname-Utility-Funktionen

import { formatDate, createTimestamp, formatDateTimeForFolder } from './dateUtils.js';
// import { FOLDER_STRUCTURES } from '../config/constants.js';
import type { ExtensionSettings } from '../types/index.js';

/**
 * Generiert einen Dateinamen basierend auf den Einstellungen
 */
export function generateFilename(
  url: string,
  index: number,
  profileName: string,
  postDate: Date,
  settings: ExtensionSettings,
  isVideoThumbnail = false,
  isVideo = false
): string {
  const timestamp = createTimestamp();
  const formattedDate = formatDate(postDate);
  const extension = getFileExtension(url);

  let baseFilename: string;
  let mediaType: 'image' | 'video' | 'thumbnail';
  
  if (isVideoThumbnail) {
    baseFilename = `${profileName}_${timestamp}_${index}_${formattedDate}_thumbnail.${extension}`;
    mediaType = 'thumbnail';
  } else if (isVideo) {
    baseFilename = `${profileName}_${timestamp}_${index}_${formattedDate}_video.${extension}`;
    mediaType = 'video';
  } else {
    baseFilename = `${profileName}_${timestamp}_${index}_${formattedDate}.${extension}`;
    mediaType = 'image';
  }

  return createFolderStructure(baseFilename, profileName, postDate, settings, mediaType);
}

// Speichere den Ordnernamen beim ersten Aufruf, damit alle Downloads im selben Ordner landen
let folderName: string | null = null;

/**
 * Erstellt die Ordnerstruktur basierend auf den Einstellungen
 * Ein Ordner mit aktuellem Datum und Uhrzeit im deutschen Format
 */
function createFolderStructure(
  filename: string,
  _profileName: string,
  _postDate: Date,
  _settings: ExtensionSettings,
  _mediaType: 'image' | 'video' | 'thumbnail' = 'image'
): string {
  // Erstelle Ordnername beim ersten Aufruf (aktuelles Datum und Uhrzeit)
  if (!folderName) {
    folderName = formatDateTimeForFolder();
  }
  
  // Alle Dateien in einem Ordner: DD-MM-YYYY_HH-MM-SS/filename
  return `${folderName}/${filename}`;
}

/**
 * Extrahiert die Dateiendung aus einer URL
 */
function getFileExtension(url: string): string {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  const extension = pathname.split('.').pop();
  
  // Fallback für Instagram URLs
  if (!extension || extension.length > 4) {
    return 'jpg';
  }
  
  return extension.toLowerCase();
}

/**
 * Sanitisiert einen Dateinamen für das Dateisystem
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')  // Ersetze ungültige Zeichen
    .replace(/\s+/g, '_')           // Ersetze Leerzeichen
    .replace(/_+/g, '_')            // Entferne mehrfache Unterstriche
    .replace(/^_|_$/g, '');         // Entferne führende/nachfolgende Unterstriche
}

/**
 * Erstellt einen Hash aus einer URL für eindeutige Dateinamen
 */
function createUrlHash(url: string): string {
  // Entferne Query-Parameter für bessere Eindeutigkeit
  const cleanUrl = url.split('?')[0];
  let hash = 0;
  for (let i = 0; i < cleanUrl.length; i++) {
    const char = cleanUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

/**
 * Erstellt einen eindeutigen Dateinamen basierend auf URL-Hash
 */
export function generateUniqueFilename(
  url: string,
  profileName: string,
  postDate: Date,
  settings: ExtensionSettings,
  isVideoThumbnail = false,
  isVideo = false
): string {
  const urlHash = createUrlHash(url);
  const formattedDate = formatDate(postDate);
  const extension = getFileExtension(url);
  
  let baseFilename: string;
  
  if (isVideoThumbnail) {
    baseFilename = `${profileName}_${urlHash}_${formattedDate}_thumbnail.${extension}`;
  } else if (isVideo) {
    baseFilename = `${profileName}_${urlHash}_${formattedDate}_video.${extension}`;
  } else {
    baseFilename = `${profileName}_${urlHash}_${formattedDate}.${extension}`;
  }
  
  return createFolderStructure(baseFilename, profileName, postDate, settings, isVideoThumbnail ? 'thumbnail' : (isVideo ? 'video' : 'image'));
}

/**
 * Erstellt einen eindeutigen Dateinamen falls bereits vorhanden
 */
export function createUniqueFilename(baseFilename: string, existingFilenames: Set<string>): string {
  let filename = baseFilename;
  let counter = 1;
  
  while (existingFilenames.has(filename)) {
    const lastDotIndex = baseFilename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      filename = `${baseFilename}_${counter}`;
    } else {
      const nameWithoutExt = baseFilename.substring(0, lastDotIndex);
      const extension = baseFilename.substring(lastDotIndex);
      filename = `${nameWithoutExt}_${counter}${extension}`;
    }
    counter++;
  }
  
  return filename;
}
