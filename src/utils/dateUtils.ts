// dateUtils.ts - Datum-Utility-Funktionen

/**
 * Formatiert ein Datum im Format DD-MM-YYYY
 */
export function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Erstellt einen Zeitstempel für Dateinamen
 */
export function createTimestamp(): number {
  return Date.now();
}

/**
 * Formatiert ein Datum für die Anzeige
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Berechnet die Zeit seit einem Datum
 */
export function getTimeSince(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'vor einem Moment';
  if (diffInSeconds < 3600) return `vor ${Math.floor(diffInSeconds / 60)} Min`;
  if (diffInSeconds < 86400) return `vor ${Math.floor(diffInSeconds / 3600)} Std`;
  return `vor ${Math.floor(diffInSeconds / 86400)} Tagen`;
}
