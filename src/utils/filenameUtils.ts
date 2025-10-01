// filenameUtils.ts - Dateiname-Utility-Funktionen

import { formatDate, createTimestamp } from './dateUtils.js';
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

/**
 * Erstellt die Ordnerstruktur basierend auf den Einstellungen
 */
function createFolderStructure(
  filename: string,
  profileName: string,
  _postDate: Date,
  _settings: ExtensionSettings,
  mediaType: 'image' | 'video' | 'thumbnail' = 'image'
): string {
  // Neue Ordnerstruktur: profilname/images|videos|video_thumbnails/filename
  const baseFolder = profileName;
  let subFolder: string;
  
  switch (mediaType) {
    case 'image':
      subFolder = 'images';
      break;
    case 'video':
      subFolder = 'videos';
      break;
    case 'thumbnail':
      subFolder = 'video_thumbnails';
      break;
    default:
      subFolder = 'images';
  }
  
  return `${baseFolder}/${subFolder}/${filename}`;
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
