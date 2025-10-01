// blobUtils.ts - Blob-URL Utility-Funktionen

/**
 * Konvertiert eine Blob-URL zu einem Download-fähigen Blob
 */
export async function blobUrlToBlob(blobUrl: string): Promise<Blob | null> {
  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      console.error('[Blob] Fehler beim Laden der Blob-URL:', response.status);
      return null;
    }
    return await response.blob();
  } catch (error) {
    console.error('[Blob] Fehler beim Konvertieren der Blob-URL:', error);
    return null;
  }
}

/**
 * Erstellt eine Download-URL aus einem Blob
 */
export function createBlobDownloadUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Bestimmt die Dateiendung basierend auf dem Blob-Typ
 */
export function getBlobFileExtension(blob: Blob): string {
  const mimeType = blob.type;
  
  if (mimeType.includes('video/mp4')) return 'mp4';
  if (mimeType.includes('video/webm')) return 'webm';
  if (mimeType.includes('video/ogg')) return 'ogv';
  if (mimeType.includes('image/jpeg')) return 'jpg';
  if (mimeType.includes('image/png')) return 'png';
  if (mimeType.includes('image/webp')) return 'webp';
  
  // Fallback für Videos
  if (mimeType.startsWith('video/')) return 'mp4';
  if (mimeType.startsWith('image/')) return 'jpg';
  
  return 'bin';
}

/**
 * Lädt eine Blob-URL herunter
 */
export async function downloadBlobUrl(
  blobUrl: string, 
  filename: string
): Promise<boolean> {
  try {
    console.log('[Blob] Starte Download für:', blobUrl);
    
    const blob = await blobUrlToBlob(blobUrl);
    if (!blob) {
      console.error('[Blob] Konnte Blob nicht laden');
      return false;
    }

    console.log('[Blob] Blob geladen, Größe:', blob.size, 'bytes, Typ:', blob.type);
    
    const downloadUrl = createBlobDownloadUrl(blob);
    
    // Erstelle einen temporären Download-Link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    
    // Trigger Download
    link.click();
    
    // Cleanup nach kurzer Verzögerung
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }, 100);
    
    console.log('[Blob] Download erfolgreich gestartet:', filename);
    return true;
  } catch (error) {
    console.error('[Blob] Download fehlgeschlagen:', error);
    return false;
  }
}

/**
 * Prüft ob eine URL eine Blob-URL ist
 */
export function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:');
}

/**
 * Extrahiert die Blob-ID aus einer Blob-URL
 */
export function extractBlobId(blobUrl: string): string {
  const match = blobUrl.match(/blob:https:\/\/www\.instagram\.com\/(.+)/);
  return match ? match[1] : 'unknown';
}
