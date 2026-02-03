import type { CheckError } from '../types';

interface ResultsTableProps {
  errors: CheckError[];
  onExportCSV: () => void;
}

export function ResultsTable({ errors, onExportCSV }: ResultsTableProps) {
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  const getTypeLabel = (type: CheckError['type']) => {
    const labels = {
      gap: 'ギャップ',
      flash: 'フラッシュフレーム',
      audio: '音量異常',
      spell: '誤字脱字',
    };
    return labels[type];
  };

  const getSourceLabel = (source: CheckError['source']) => {
    const labels = {
      xml: 'Premiere Pro XML',
      mp4: '動画ファイル',
      txt: 'テキストファイル',
    };
    return labels[source];
  };

  const getSeverityColor = (severity?: string) => {
    if (severity === 'error') return 'bg-red-100 text-red-800';
    if (severity === 'warning') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">チェック結果</h2>
          <p className="text-sm text-gray-600 mt-1">
            エラー: {errorCount}件 / 警告: {warningCount}件 / 合計: {errors.length}件
          </p>
        </div>
        <button
          onClick={onExportCSV}
          disabled={errors.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          CSV出力
        </button>
      </div>

      {errors.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          エラーは検出されませんでした。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  参照データ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  エラータイプ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイムコード
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  エラー内容
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  重要度
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {errors.map((error, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {getSourceLabel(error.source)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {getTypeLabel(error.type)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
                    {error.timecode}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {error.message}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                        error.severity
                      )}`}
                    >
                      {error.severity === 'error' ? 'エラー' : '警告'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
