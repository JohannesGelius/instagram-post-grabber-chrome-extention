// videoDownloadUtils.ts - Alternative Video-Download-Methoden

/**
 * Alternative Methode: Lädt Video über Canvas und MediaRecorder
 */
export async function downloadVideoViaCanvas(
  videoElement: HTMLVideoElement, 
  filename: string
): Promise<boolean> {
  try {
    console.log('[Video] Starte Canvas-Download für:', filename);
    
    // Warte bis Video geladen ist
    if (videoElement.readyState < 2) {
      await new Promise((resolve) => {
        videoElement.addEventListener('loadeddata', resolve, { once: true });
        videoElement.addEventListener('error', resolve, { once: true });
      });
    }
    
    // Erstelle Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[Video] Canvas-Kontext nicht verfügbar');
      return false;
    }
    
    // Setze Canvas-Größe
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    
    // Zeichne Video-Frame auf Canvas
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Konvertiere zu Blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('[Video] Canvas-Blob-Erstellung fehlgeschlagen');
          resolve(false);
          return;
        }
        
        // Download Blob
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        console.log('[Video] Canvas-Download erfolgreich:', filename);
        resolve(true);
      }, 'image/png');
    });
  } catch (error) {
    console.error('[Video] Canvas-Download fehlgeschlagen:', error);
    return false;
  }
}

/**
 * Methode: Lädt Video über fetch und Blob
 */
export async function downloadVideoViaFetch(
  videoUrl: string, 
  filename: string
): Promise<boolean> {
  try {
    console.log('[Video] Starte Fetch-Download für:', videoUrl);
    
    // Für Blob-URLs verwende XMLHttpRequest statt fetch
    if (videoUrl.startsWith('blob:')) {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', videoUrl, true);
        xhr.responseType = 'blob';
        
        xhr.onload = function() {
          if (xhr.status === 200) {
            const blob = xhr.response;
            console.log('[Video] Blob erhalten, Größe:', blob.size, 'bytes, Typ:', blob.type);
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            console.log('[Video] XMLHttpRequest-Download erfolgreich:', filename);
            resolve(true);
          } else {
            console.error('[Video] XMLHttpRequest-Fehler:', xhr.status);
            resolve(false);
          }
        };
        
        xhr.onerror = function() {
          console.error('[Video] XMLHttpRequest-Fehler beim Laden');
          resolve(false);
        };
        
        xhr.send();
      });
    }
    
    // Für normale URLs verwende fetch
    const response = await fetch(videoUrl);
    if (!response.ok) {
      console.error('[Video] Fetch-Fehler:', response.status);
      return false;
    }
    
    const blob = await response.blob();
    console.log('[Video] Blob erhalten, Größe:', blob.size, 'bytes');
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    console.log('[Video] Fetch-Download erfolgreich:', filename);
    return true;
  } catch (error) {
    console.error('[Video] Fetch-Download fehlgeschlagen:', error);
    return false;
  }
}

/**
 * Methode: Lädt Video über Chrome Downloads API
 */
export async function downloadVideoViaChrome(
  videoUrl: string, 
  filename: string
): Promise<boolean> {
  try {
    console.log('[Video] Starte Chrome-Download für:', videoUrl);
    
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: "download",
        url: videoUrl,
        filename: filename
      }, (response) => {
        if (response?.success) {
          console.log('[Video] Chrome-Download erfolgreich:', filename);
          resolve(true);
        } else {
          console.error('[Video] Chrome-Download fehlgeschlagen:', response?.error);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('[Video] Chrome-Download fehlgeschlagen:', error);
    return false;
  }
}

/**
 * Methode: Lädt Video direkt über das Video-Element
 */
export async function downloadVideoDirect(
  videoElement: HTMLVideoElement,
  filename: string
): Promise<boolean> {
  try {
    console.log('[Video] Starte direkten Video-Download...');
    
    // Warte bis Video geladen ist
    if (videoElement.readyState < 2) {
      await new Promise((resolve, reject) => {
        videoElement.addEventListener('loadeddata', resolve, { once: true });
        videoElement.addEventListener('error', reject, { once: true });
        setTimeout(() => reject(new Error('Video-Load-Timeout')), 5000);
      });
    }
    
    // Erstelle einen temporären Link mit der Blob-URL
    const link = document.createElement('a');
    link.href = videoElement.src;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('[Video] Direkter Download erfolgreich:', filename);
    return true;
  } catch (error) {
    console.error('[Video] Direkter Download fehlgeschlagen:', error);
    return false;
  }
}

/**
 * Methode: Lädt Video über MediaRecorder (für Blob-URLs)
 */
export async function downloadVideoViaMediaRecorder(
  videoElement: HTMLVideoElement,
  filename: string
): Promise<boolean> {
  try {
    console.log('[Video] Starte MediaRecorder-Download...');
    
    // Warte bis Video geladen ist
    if (videoElement.readyState < 2) {
      await new Promise((resolve, reject) => {
        videoElement.addEventListener('loadeddata', resolve, { once: true });
        videoElement.addEventListener('error', reject, { once: true });
        setTimeout(() => reject(new Error('Video-Load-Timeout')), 5000);
      });
    }
    
    // Erstelle MediaRecorder
    const stream = (videoElement as any).captureStream ? (videoElement as any).captureStream() : null;
    if (!stream) {
      console.error('[Video] captureStream nicht unterstützt');
      return false;
    }
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });
    
    const chunks: BlobPart[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log('[Video] MediaRecorder Blob erstellt, Größe:', blob.size, 'bytes');
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename.replace('.mp4', '.webm');
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        console.log('[Video] MediaRecorder-Download erfolgreich:', filename);
        resolve(true);
      };
      
      mediaRecorder.onerror = (error) => {
        console.error('[Video] MediaRecorder-Fehler:', error);
        resolve(false);
      };
      
      // Starte Aufnahme für kurze Zeit
      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
      }, 1000);
    });
  } catch (error) {
    console.error('[Video] MediaRecorder-Download fehlgeschlagen:', error);
    return false;
  }
}

/**
 * Versucht verschiedene Download-Methoden für Videos
 */
export async function downloadVideoWithFallback(
  videoElement: HTMLVideoElement | null,
  videoUrl: string,
  filename: string
): Promise<boolean> {
  console.log('[Video] Starte Video-Download mit Fallback-Methoden');
  
  // Methode 1: Direkter Download über Video-Element (für Blob-URLs)
  if (videoElement && videoUrl.startsWith('blob:')) {
    console.log('[Video] Versuche direkten Video-Download...');
    const directSuccess = await downloadVideoDirect(videoElement, filename);
    if (directSuccess) return true;
  }
  
  // Methode 2: MediaRecorder (für Blob-URLs)
  if (videoElement && videoUrl.startsWith('blob:')) {
    console.log('[Video] Versuche MediaRecorder-Download...');
    const mediaRecorderSuccess = await downloadVideoViaMediaRecorder(videoElement, filename);
    if (mediaRecorderSuccess) return true;
  }
  
  // Methode 3: Blob-URL über XMLHttpRequest
  if (videoUrl.startsWith('blob:')) {
    console.log('[Video] Versuche Blob-URL-Download...');
    const success = await downloadVideoViaFetch(videoUrl, filename);
    if (success) return true;
  }
  
  // Methode 4: Canvas (nur wenn Video-Element verfügbar)
  if (videoElement) {
    console.log('[Video] Versuche Canvas-Download...');
    const canvasSuccess = await downloadVideoViaCanvas(videoElement, filename);
    if (canvasSuccess) return true;
  }
  
  console.error('[Video] Alle Download-Methoden fehlgeschlagen');
  return false;
}
