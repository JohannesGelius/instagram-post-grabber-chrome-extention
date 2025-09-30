// Type definitions for the Instagram Post Grabber extension

export interface DownloadMessage {
  action: 'download';
  url: string;
  filename: string;
}

export interface DownloadControl {
  shouldStop: boolean;
}

export interface PostData {
  profileName: string;
  postDate: Date;
  mediaUrls: Set<string>;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  index: number;
  isThumbnail?: boolean;
}

export interface DownloadStats {
  totalPosts: number;
  totalMedia: number;
  currentPost: number;
  isRunning: boolean;
}

export interface ExtensionSettings {
  autoDownload: boolean;
  downloadVideos: boolean;
  downloadThumbnails: boolean;
  folderStructure: 'profile' | 'date' | 'flat';
  maxPosts: number;
}

export interface StorageData {
  settings: ExtensionSettings;
  stats: DownloadStats;
  lastDownload: Date;
}
