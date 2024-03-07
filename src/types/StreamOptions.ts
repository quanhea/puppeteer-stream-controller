export interface StreamOptions extends MediaRecorderOptions {
  timeslice?: number;
  delay?: number;
  audio?: boolean;
  video?: boolean;
  wsUrl?: string;
}
