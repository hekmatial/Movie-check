import { CheckError, TimelineInfo } from '../types';
import { secondsToTimecode } from '../utils/timecode';

/**
 * 動画解析モジュール
 * フラッシュフレーム（一瞬の黒画面）を検知
 */

// ffmpeg.wasmは動的に読み込む（将来的に使用）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function initFFmpeg(): Promise<void> {
  // 将来的にffmpeg.wasmを使用する場合の実装
  // 現在はブラウザのVideo APIを使用
}

/**
 * 動画ファイルからフレームを抽出して解析
 * ブラウザのVideo APIを使用（ffmpeg.wasmは将来的に使用可能）
 */
async function extractFrames(videoFile: File, interval: number = 0.1): Promise<ImageData[]> {
  const frames: ImageData[] = [];
  const video = document.createElement('video');
  video.src = URL.createObjectURL(videoFile);
  video.muted = true;
  video.playsInline = true;
  
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(video.src);
        reject(new Error('Canvas contextを取得できませんでした'));
        return;
      }

      let currentTime = 0;
      const duration = video.duration;

      const extractFrame = () => {
        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(imageData);

        currentTime += interval;
        if (currentTime < duration) {
          extractFrame();
        } else {
          URL.revokeObjectURL(video.src);
          resolve();
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('動画の読み込みに失敗しました'));
      };

      // 最初のフレームを読み込むために再生を開始
      video.load();
      extractFrame();
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('動画の読み込みに失敗しました'));
    };
  });

  return frames;
}

/**
 * 画像データの平均輝度を計算
 */
function calculateBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let sum = 0;
  let count = 0;

  // RGB値から輝度を計算（Y = 0.299*R + 0.587*G + 0.114*B）
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    sum += brightness;
    count++;
  }

  return sum / count / 255; // 0-1の範囲に正規化
}

/**
 * フラッシュフレーム（黒画面）を検知
 */
export async function detectFlashFrames(
  videoFile: File,
  timeline: TimelineInfo,
  threshold: number = 0.1 // 輝度の閾値（0.1以下を黒と判定）
): Promise<CheckError[]> {
  const errors: CheckError[] = [];

  try {
    const frames = await extractFrames(videoFile, 0.1); // 0.1秒ごとにフレーム抽出
    const fps = 30; // デフォルトFPS

    let consecutiveDarkFrames = 0;
    let lastDarkTimecode: string | null = null;

    for (let i = 0; i < frames.length; i++) {
      const brightness = calculateBrightness(frames[i]);
      const timecode = secondsToTimecode(i * 0.1, fps);

      if (brightness < threshold) {
        consecutiveDarkFrames++;
        if (lastDarkTimecode === null) {
          lastDarkTimecode = timecode;
        }
      } else {
        // 連続する黒フレームが検出された場合（0.1秒以上）
        if (consecutiveDarkFrames > 0 && lastDarkTimecode) {
          errors.push({
            source: 'mp4',
            type: 'flash',
            message: `フラッシュフレーム（黒画面）が検出されました（${(consecutiveDarkFrames * 0.1).toFixed(2)}秒）`,
            timecode: lastDarkTimecode,
            severity: 'error',
          });
        }
        consecutiveDarkFrames = 0;
        lastDarkTimecode = null;
      }
    }

    // 最後のフレームが黒の場合
    if (consecutiveDarkFrames > 0 && lastDarkTimecode) {
      errors.push({
        source: 'mp4',
        type: 'flash',
        message: `フラッシュフレーム（黒画面）が検出されました（${(consecutiveDarkFrames * 0.1).toFixed(2)}秒）`,
        timecode: lastDarkTimecode,
        severity: 'error',
      });
    }
  } catch (error) {
    console.error('フラッシュフレーム検知エラー:', error);
    // エラーが発生しても処理を続行
  }

  return errors;
}

/**
 * クリップ間のギャップを動画から検証
 */
export async function verifyGapsFromVideo(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _videoFile: File,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _timeline: TimelineInfo
): Promise<CheckError[]> {
  // XMLパーサーで検出したギャップを動画データで検証する機能
  // 実装は必要に応じて追加
  return [];
}
