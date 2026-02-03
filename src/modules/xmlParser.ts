import { parseString } from 'xml2js';
import { ClipInfo, TimelineInfo, CheckError } from '../types';
import { timecodeDiff, timecodeToSeconds } from '../utils/timecode';

/**
 * Premiere Pro XMLファイルを解析
 */
export async function parsePremiereXML(xmlContent: string): Promise<TimelineInfo> {
  return new Promise((resolve, reject) => {
    parseString(xmlContent, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const clips: ClipInfo[] = [];
        const project = result.xmeml?.project?.[0];
        const sequence = project?.sequence?.[0];
        const media = sequence?.media?.[0];
        const video = media?.video?.[0];
        const track = video?.track?.[0];

        if (track?.clipitem) {
          interface ClipItem {
            start?: string[];
            end?: string[];
            name?: string[];
            file?: Array<{ name?: string[] }>;
          }
          (track.clipitem as ClipItem[]).forEach((clip: ClipItem) => {
            const start = clip.start?.[0];
            const end = clip.end?.[0];
            const name = clip.name?.[0] || clip.file?.[0]?.name?.[0] || 'Unknown';

            if (start && end) {
              clips.push({
                startTimecode: formatTimecode(start),
                endTimecode: formatTimecode(end),
                name,
              });
            }
          });
        }

        // タイムラインの長さを取得
        const duration = sequence?.duration?.[0] || '00:00:00:00';

        resolve({
          clips: clips.sort((a, b) => 
            timecodeToSeconds(a.startTimecode) - timecodeToSeconds(b.startTimecode)
          ),
          duration: formatTimecode(duration),
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Premiere Proのタイムコード形式を変換
 * フレーム数ベースからHH:MM:SS:FF形式へ
 */
function formatTimecode(frameOrTimecode: string | number, fps: number = 30): string {
  if (typeof frameOrTimecode === 'string' && frameOrTimecode.includes(':')) {
    // 既にタイムコード形式
    return frameOrTimecode;
  }

  const frames = typeof frameOrTimecode === 'number' 
    ? frameOrTimecode 
    : parseInt(frameOrTimecode, 10);

  const hours = Math.floor(frames / (fps * 3600));
  const minutes = Math.floor((frames % (fps * 3600)) / (fps * 60));
  const seconds = Math.floor((frames % (fps * 60)) / fps);
  const frame = frames % fps;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frame.toString().padStart(2, '0')}`;
}

/**
 * クリップ間のギャップを検出
 */
export function detectGaps(timeline: TimelineInfo, thresholdSeconds: number = 0.1): CheckError[] {
  const errors: CheckError[] = [];
  const clips = timeline.clips;

  for (let i = 0; i < clips.length - 1; i++) {
    const currentClip = clips[i];
    const nextClip = clips[i + 1];

    const gap = timecodeDiff(currentClip.endTimecode, nextClip.startTimecode);

    if (gap > thresholdSeconds) {
      errors.push({
        source: 'xml',
        type: 'gap',
        message: `クリップ間にギャップが検出されました（${gap.toFixed(3)}秒）`,
        timecode: currentClip.endTimecode,
        severity: 'warning',
      });
    }
  }

  return errors;
}
