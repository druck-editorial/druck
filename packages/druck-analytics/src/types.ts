export interface ReadingEvent {
  type: 'chapter_enter' | 'chapter_read' | 'keypoint_view' | 'aside_view' | 'quote_view' | 'share_click' | 'depth_milestone';
  articleSlug: string;
  timestamp: number;
  element?: string;
  detail?: string;
  depthPercent?: number;
}

export interface ReadingSession {
  articleSlug: string;
  startedAt: number;
  activeReadingMs: number;
  maxDepthPercent: number;
  chaptersRead: string[];
  keypointsViewed: string[];
  asidesViewed: string[];
  quotesViewed: string[];
}

export interface AnalyticsConfig {
  endpoint?: string;
  sendOn?: 'pagehide' | 'interval' | 'manual';
  intervalMs?: number;
  depthMilestones?: number[];
  chapterReadThresholdMs?: number;
  debounceMs?: number;
  onDepth?: (depthPercent: number) => void;
  onActiveReading?: (activeSec: number) => void;
  onChapterRead?: (title: string) => void;
}