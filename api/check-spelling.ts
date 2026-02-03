import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // CORS設定
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { textEntries } = request.body;

    if (!textEntries || !Array.isArray(textEntries)) {
      response.status(400).json({ error: 'textEntries is required and must be an array' });
      return;
    }

    // 環境変数からAPIキーを取得
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      response.status(500).json({ error: 'Gemini API key is not configured' });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const errors: Array<{
      index: number;
      original: string;
      error: string;
      suggestion: string;
      timecode: string;
    }> = [];

    // テキストをバッチでチェック（API呼び出し回数を減らす）
    const batchSize = 5;
    for (let i = 0; i < textEntries.length; i += batchSize) {
      const batch = textEntries.slice(i, i + batchSize);

      try {
        const prompt = `以下のテキストの誤字脱字をチェックしてください。誤字脱字がある場合は、該当するテキストと修正案を指摘してください。

テキスト:
${batch.map((entry: any, idx: number) => `${idx + 1}. [${entry.timecode}] ${entry.text}`).join('\n')}

JSON形式で回答してください。誤字脱字がない場合は空配列を返してください。
形式: [{"index": 数値, "original": "元のテキスト", "error": "誤字脱字の内容", "suggestion": "修正案"}]`;

        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();

        // JSONを抽出（マークダウンコードブロックから）
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            if (Array.isArray(parsed)) {
              parsed.forEach((item: any) => {
                const entryIndex = item.index - 1;
                if (entryIndex >= 0 && entryIndex < batch.length) {
                  const entry = batch[entryIndex];
                  errors.push({
                    index: i + entryIndex,
                    original: item.original,
                    error: item.error,
                    suggestion: item.suggestion,
                    timecode: entry.timecode,
                  });
                }
              });
            }
          } catch (parseError) {
            console.warn('JSON解析エラー:', parseError);
          }
        }

        // APIレート制限を考慮して少し待機
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('誤字脱字チェックエラー:', error);
        // エラーが発生しても処理を続行
      }
    }

    response.status(200).json({ errors });
  } catch (error) {
    console.error('APIエラー:', error);
    response.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
