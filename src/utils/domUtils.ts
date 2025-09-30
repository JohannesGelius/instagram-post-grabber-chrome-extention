// domUtils.ts - DOM-Utility-Funktionen

import { INSTAGRAM_SELECTORS } from '../config/constants.js';

/**
 * Extrahiert den Profilnamen aus einem Post-Element
 */
export function getProfileName(post: HTMLElement): string {
  const el = post.querySelector(INSTAGRAM_SELECTORS.PROFILE_NAME);
  return el ? el.textContent?.trim().replace(/\W+/g, "_") || "instagram" : "instagram";
}

/**
 * Extrahiert das Post-Datum aus einem Post-Element
 */
export function getPostDate(post: HTMLElement): Date {
  const timeEl = post.querySelector(INSTAGRAM_SELECTORS.POST_DATE);
  if (timeEl && timeEl.getAttribute('datetime')) {
    return new Date(timeEl.getAttribute('datetime')!);
  }
  return new Date();
}

/**
 * Findet alle relevanten Bilder in einem Post
 */
export function getPostImages(post: HTMLElement): HTMLImageElement[] {
  return [...post.querySelectorAll(INSTAGRAM_SELECTORS.IMAGES)]
    .filter(img => (img as HTMLImageElement).src && (img as HTMLImageElement).src.includes('cdninstagram')) as HTMLImageElement[];
}

/**
 * Findet alle relevanten Videos in einem Post
 */
export function getPostVideos(post: HTMLElement): HTMLVideoElement[] {
  return [...post.querySelectorAll(INSTAGRAM_SELECTORS.VIDEOS)]
    .filter(vid => (vid as HTMLVideoElement).poster && (vid as HTMLVideoElement).poster.includes('cdninstagram')) as HTMLVideoElement[];
}

/**
 * Findet den nächsten Button in einem Carousel
 */
export function getNextButton(post: HTMLElement): HTMLElement | null {
  const nextBtn = post.querySelector(INSTAGRAM_SELECTORS.NEXT_BUTTON);
  return nextBtn && (nextBtn as HTMLElement).offsetParent !== null ? nextBtn as HTMLElement : null;
}

/**
 * Prüft ob ein Element sichtbar ist
 */
export function isElementVisible(element: HTMLElement): boolean {
  return element.offsetParent !== null;
}

/**
 * Erstellt ein neues Element mit Attributen
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attributes: Partial<HTMLElementTagNameMap[K]> = {},
  textContent?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  
  Object.assign(element, attributes);
  
  if (textContent) {
    element.textContent = textContent;
  }
  
  return element;
}

/**
 * Fügt Event Listener mit automatischer Cleanup-Funktion hinzu
 */
export function addEventListenerWithCleanup(
  element: HTMLElement,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): () => void {
  element.addEventListener(event, handler, options);
  
  return () => {
    element.removeEventListener(event, handler, options);
  };
}
