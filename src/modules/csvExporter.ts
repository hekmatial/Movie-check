import Papa from 'papaparse';
import { CheckError } from '../types';

/**
 * チェックエラーをCSV形式でエクスポート
 */
export function exportToCSV(errors: CheckError[]): void {
  // CSVデータを準備
  const csvData = errors.map(error => ({
    '参照データソース': error.source,
    'エラータイプ': error.type,
    'エラー内容': error.message,
    'タイムコード': error.timecode,
    '重要度': error.severity || 'error',
  }));

  // CSV文字列を生成
  const csv = Papa.unparse(csvData, {
    header: true,
    encoding: 'UTF-8',
  });

  // BOMを追加（Excelで正しく表示されるように）
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // ダウンロードリンクを作成
  const link = document.createElement('a');
  link.href = url;
  link.download = `動画チェック結果_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
