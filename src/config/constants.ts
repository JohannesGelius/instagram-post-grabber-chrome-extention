// constants.ts - Zentrale Konstanten für die Extension

export const EXTENSION_CONFIG = {
  NAME: 'Instagram Post Grabber',
  VERSION: '1.2.0',
  DESCRIPTION: 'Download Instagram posts with high resolution images and videos',
  AUTHOR: 'Johannes Gelius',
  LICENSE: 'MIT'
} as const;

export const DOWNLOAD_CONFIG = {
  MAX_POSTS: 50,
  MIN_IMAGE_HEIGHT: 400,
  DOWNLOAD_DELAY: 300,
  CAROUSEL_DELAY: 150,
  BUTTON_CHECK_INTERVAL: 200,
  MAX_NO_NEW_COUNT: 2
} as const;

export const UI_CONFIG = {
  BUTTON_SIZE: 40,
  BUTTON_ANIMATION_DURATION: 100,
  PULSE_SHADOW_MAX: 20,
  PULSE_SHADOW_STEP: 2
} as const;

export const STORAGE_KEYS = {
  SETTINGS: 'extensionSettings',
  DOWNLOAD_STATS: 'downloadStats',
  LAST_DOWNLOAD: 'lastDownload'
} as const;

export const MESSAGE_TYPES = {
  DOWNLOAD: 'download',
  START_DOWNLOAD: 'startDownload',
  STOP_DOWNLOAD: 'stopDownload',
  DOWNLOAD_STATS: 'downloadStats',
  SETTINGS_UPDATE: 'settingsUpdate'
} as const;

export const INSTAGRAM_SELECTORS = {
  POSTS: 'article',
  PROFILE_NAME: 'header a span, a[role="link"] span',
  POST_DATE: 'time',
  IMAGES: 'img[src*="cdninstagram"]',
  VIDEOS: 'video[poster*="cdninstagram"], video[src*="blob:"]',
  VIDEO_SOURCES: 'video[src*="blob:"], video[poster*="cdninstagram"]',
  NEXT_BUTTON: 'button[aria-label="Weiter"], button[aria-label="Next"]'
} as const;

export const FOLDER_STRUCTURES = {
  PROFILE: 'profile',
  DATE: 'date',
  FLAT: 'flat'
} as const;
