import type { CheckError, AudioLevel } from '../types';
import { secondsToTimecode, timecodeToSeconds } from '../utils/timecode';

/**
 * 音声解析モジュール
 * BGM/喋り音声/SEの音量をチェック
 */

// ffmpeg.wasmは動的に読み込む
let ffmpegLoaded = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ffmpeg: any = null;

/**
 * ffmpeg.wasmを初期化
 */
async function initFFmpeg(): Promise<void> {
  if (ffmpegLoaded) return;

  try {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }: { message: string }) => {
      console.log(message);
    });
    await ffmpeg.load();
    ffmpegLoaded = true;
  } catch (error) {
    console.error('ffmpeg.wasmの読み込みに失敗しました:', error);
    throw new Error('音声解析機能を使用するにはffmpeg.wasmが必要です');
  }
}

/**
 * 動画ファイルから音声を抽出（ffmpeg.wasm使用）
 */
async function extractAudioFromVideo(videoFile: File): Promise<AudioBuffer> {
  await initFFmpeg();
  const { fetchFile } = await import('@ffmpeg/util');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ffmpegAny = ffmpeg as any;

  const inputFileName = 'input.mp4';
  const outputFileName = 'output.wav';

  // 動画ファイルをメモリに読み込む
  await ffmpegAny.writeFile(inputFileName, await fetchFile(videoFile));

  // 音声を抽出
  await ffmpegAny.exec([
    '-i', inputFileName,
    '-vn', // ビデオストリームを無視
    '-acodec', 'pcm_s16le', // PCM形式で出力
    '-ar', '44100', // サンプリングレート
    '-ac', '1', // モノラル
    outputFileName,
  ]);

  // 抽出した音声ファイルを取得
  const data = await ffmpegAny.readFile(outputFileName);
  const audioBlob = new Blob([data], { type: 'audio/wav' });
  const arrayBuffer = await audioBlob.arrayBuffer();

  // AudioBufferに変換
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  return await audioContext.decodeAudioData(arrayBuffer);
}

/**
 * 音声ファイルから音量レベルを取得
 */
async function analyzeAudioLevels(
  audioBuffer: AudioBuffer,
  interval: number = 0.1
): Promise<AudioLevel[]> {
  const levels: AudioLevel[] = [];
  const channelData = audioBuffer.getChannelData(0); // モノラルまたは左チャンネル
  const sampleRate = audioBuffer.sampleRate;
  const samplesPerInterval = Math.floor(sampleRate * interval);

  for (let i = 0; i < channelData.length; i += samplesPerInterval) {
    const chunk = channelData.slice(i, i + samplesPerInterval);
    const rms = Math.sqrt(
      chunk.reduce((sum, sample) => sum + sample * sample, 0) / chunk.length
    );
    
    const timecode = secondsToTimecode(i / sampleRate);
    levels.push({
      timecode,
      level: rms,
    });
  }

  return levels;
}

/**
 * お手本動画と比較して音量異常を検出
 */
export async function checkAudioLevels(
  videoFile: File,
  referenceVideoFile: File | null,
  threshold: number = 0.3 // 音量レベルの閾値
): Promise<CheckError[]> {
  const errors: CheckError[] = [];

  try {
    // 動画から音声を抽出（ffmpeg.wasm使用）
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await extractAudioFromVideo(videoFile);
    } catch (ffmpegError) {
      // ffmpeg.wasmが使用できない場合、Video要素から音声を抽出
      console.warn('ffmpeg.wasmでの音声抽出に失敗、代替方法を試行:', ffmpegError);
      audioBuffer = await extractAudioFromVideoElement(videoFile);
    }
    
    const levels = await analyzeAudioLevels(audioBuffer);

    // お手本動画がある場合、比較
    let referenceLevels: AudioLevel[] = [];
    if (referenceVideoFile) {
      try {
        let refAudioBuffer: AudioBuffer;
        try {
          refAudioBuffer = await extractAudioFromVideo(referenceVideoFile);
        } catch (ffmpegError) {
          console.warn('ffmpeg.wasmでの音声抽出に失敗、代替方法を試行:', ffmpegError);
          refAudioBuffer = await extractAudioFromVideoElement(referenceVideoFile);
        }
        referenceLevels = await analyzeAudioLevels(refAudioBuffer);
      } catch (error) {
        console.warn('お手本動画の音声解析に失敗:', error);
      }
    }

    // 音量異常を検出
    for (const level of levels) {
      // 音量が低すぎる場合
      if (level.level < threshold * 0.3) {
        errors.push({
          source: 'mp4',
          type: 'audio',
          message: `音量が低すぎます（レベル: ${(level.level * 100).toFixed(1)}%）`,
          timecode: level.timecode,
          severity: 'warning',
        });
      }

      // お手本動画と比較
      if (referenceLevels.length > 0) {
        const refTime = timecodeToSeconds(level.timecode);
        const closestRef = referenceLevels.reduce((prev, curr) => {
          const prevDiff = Math.abs(timecodeToSeconds(prev.timecode) - refTime);
          const currDiff = Math.abs(timecodeToSeconds(curr.timecode) - refTime);
          return currDiff < prevDiff ? curr : prev;
        });

        const diff = Math.abs(level.level - closestRef.level);
        if (diff > threshold * 0.5) {
          errors.push({
            source: 'mp4',
            type: 'audio',
            message: `お手本動画と音量が大きく異なります（差分: ${(diff * 100).toFixed(1)}%）`,
            timecode: level.timecode,
            severity: 'warning',
          });
        }
      }
    }
  } catch (error) {
    console.error('音声解析エラー:', error);
    errors.push({
      source: 'mp4',
      type: 'audio',
      message: `音声解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
      timecode: '00:00:00:00',
      severity: 'warning',
    });
  }

  return errors;
}

/**
 * Video要素から音声を抽出（代替方法）
 * MediaRecorder APIを使用して音声を録音
 */
async function extractAudioFromVideoElement(videoFile: File): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = false;
    video.volume = 1.0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaElementSource(video);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    // 音声データを収集
    const bufferSize = 4096;
    const dataArray = new Float32Array(bufferSize);

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const sampleRate = audioContext.sampleRate;
      const totalSamples = Math.floor(duration * sampleRate);
      const audioBuffer = audioContext.createBuffer(1, totalSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      let currentSample = 0;

      const processAudio = () => {
        analyser.getFloatTimeDomainData(dataArray);
        const samplesToCopy = Math.min(dataArray.length, totalSamples - currentSample);
        channelData.set(dataArray.slice(0, samplesToCopy), currentSample);
        currentSample += samplesToCopy;

        if (currentSample < totalSamples && !video.ended) {
          requestAnimationFrame(processAudio);
        } else {
          URL.revokeObjectURL(video.src);
          resolve(audioBuffer);
        }
      };

      video.play();
      processAudio();
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('動画の読み込みに失敗しました'));
    };
  });
}
