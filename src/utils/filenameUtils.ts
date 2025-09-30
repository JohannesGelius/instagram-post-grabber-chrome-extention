// filenameUtils.ts - Dateiname-Utility-Funktionen

import { formatDate, createTimestamp } from './dateUtils.js';
import { FOLDER_STRUCTURES } from '../config/constants.js';
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
  isVideoThumbnail = false
): string {
  const timestamp = createTimestamp();
  const formattedDate = formatDate(postDate);
  const extension = getFileExtension(url);

  let baseFilename: string;
  if (isVideoThumbnail) {
    baseFilename = `${profileName}_${timestamp}_${index}_${formattedDate}_thumbnail.${extension}`;
  } else {
    baseFilename = `${profileName}_${timestamp}_${index}_${formattedDate}.${extension}`;
  }

  return createFolderStructure(baseFilename, profileName, postDate, settings);
}

/**
 * Erstellt die Ordnerstruktur basierend auf den Einstellungen
 */
function createFolderStructure(
  filename: string,
  profileName: string,
  postDate: Date,
  settings: ExtensionSettings
): string {
  switch (settings.folderStructure) {
    case FOLDER_STRUCTURES.PROFILE:
      return `${profileName}/${filename}`;
    
    case FOLDER_STRUCTURES.DATE:
      const dateFolder = formatDate(postDate);
      return `${dateFolder}/${filename}`;
    
    case FOLDER_STRUCTURES.FLAT:
    default:
      return filename;
  }
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
