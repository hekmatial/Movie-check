/**
 * タイムコード変換ユーティリティ
 * Premiere Pro形式（HH:MM:SS:FF）と秒数との変換
 */

export interface TimecodeParts {
  hours: number;
  minutes: number;
  seconds: number;
  frames: number;
}

/**
 * タイムコード文字列をパース
 * @param timecode HH:MM:SS:FF形式の文字列
 * @param fps フレームレート（デフォルト: 30）
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parseTimecode(timecode: string, _fps: number = 30): TimecodeParts | null {
  const parts = timecode.split(':');
  if (parts.length !== 4) return null;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const frames = parseInt(parts[3], 10);

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(frames)) {
    return null;
  }

  return { hours, minutes, seconds, frames };
}

/**
 * タイムコードを秒数に変換
 */
export function timecodeToSeconds(timecode: string, fps: number = 30): number {
  const parts = parseTimecode(timecode, fps);
  if (!parts) return 0;

  return parts.hours * 3600 + parts.minutes * 60 + parts.seconds + parts.frames / fps;
}

/**
 * 秒数をタイムコードに変換
 */
export function secondsToTimecode(seconds: number, fps: number = 30): string {
  const totalFrames = Math.floor(seconds * fps);
  const hours = Math.floor(totalFrames / (fps * 3600));
  const minutes = Math.floor((totalFrames % (fps * 3600)) / (fps * 60));
  const secs = Math.floor((totalFrames % (fps * 60)) / fps);
  const frames = totalFrames % fps;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

/**
 * タイムコードの差分を計算（秒数）
 */
export function timecodeDiff(start: string, end: string, fps: number = 30): number {
  return timecodeToSeconds(end, fps) - timecodeToSeconds(start, fps);
}
