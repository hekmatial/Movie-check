import type { TextEntry, CheckError } from '../types';

/**
 * タイムコード付きテキストファイルをパース
 * 形式: HH:MM:SS:FF テキスト内容
 */
export function parseTextFile(content: string): TextEntry[] {
  const lines = content.split('\n');
  const entries: TextEntry[] = [];

  const timecodeRegex = /^(\d{2}:\d{2}:\d{2}:\d{2})\s+(.+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(timecodeRegex);
    if (match) {
      entries.push({
        timecode: match[1],
        text: match[2],
      });
    }
  }

  return entries;
}

/**
 * バックエンドAPIを使用して誤字脱字をチェック
 */
export async function checkSpelling(
  textEntries: TextEntry[]
): Promise<CheckError[]> {
  const errors: CheckError[] = [];

  if (textEntries.length === 0) {
    return errors;
  }

  try {
    // バックエンドAPIエンドポイントを呼び出し
    // Vercelにデプロイ後は自動的に /api/check-spelling が利用可能
    // 開発環境では Vercel CLI で `vercel dev` を実行するか、
    // 本番環境のURLを使用してください
    const apiUrl = import.meta.env.VITE_API_URL || '/api/check-spelling';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ textEntries }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    // バックエンドから返されたエラーをCheckError形式に変換
    interface ApiErrorItem {
      original: string;
      error: string;
      suggestion: string;
      timecode: string;
    }
    
    if (data.errors && Array.isArray(data.errors)) {
      (data.errors as ApiErrorItem[]).forEach((item: ApiErrorItem) => {
        errors.push({
          source: 'txt',
          type: 'spell',
          message: `誤字脱字: "${item.original}" → "${item.suggestion}" (${item.error})`,
          timecode: item.timecode,
          severity: 'error',
        });
      });
    }
  } catch (error) {
    console.error('誤字脱字チェックエラー:', error);
    errors.push({
      source: 'txt',
      type: 'spell',
      message: `誤字脱字チェックに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
      timecode: '00:00:00:00',
      severity: 'warning',
    });
  }

  return errors;
}
