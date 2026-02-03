export type DataSource = 'xml' | 'mp4' | 'txt';

export type ErrorType = 'gap' | 'flash' | 'audio' | 'spell';

export type ErrorSeverity = 'error' | 'warning';

export interface CheckError {
  source: DataSource;
  type: ErrorType;
  message: string;
  timecode: string; // HH:MM:SS:FF形式
  severity?: ErrorSeverity;
}

export interface ClipInfo {
  startTimecode: string;
  endTimecode: string;
  name?: string;
}

export interface TimelineInfo {
  clips: ClipInfo[];
  duration: string;
}

export interface AudioLevel {
  timecode: string;
  level: number; // 0-1の範囲
  channel?: 'bgm' | 'voice' | 'se';
}

export interface TextEntry {
  timecode: string;
  text: string;
}
