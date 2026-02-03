import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ProgressBar } from './components/ProgressBar';
import { ResultsTable } from './components/ResultsTable';
import { CheckError } from './types';
import { parsePremiereXML, detectGaps } from './modules/xmlParser';
import { detectFlashFrames } from './modules/videoAnalyzer';
import { checkAudioLevels } from './modules/audioAnalyzer';
import { parseTextFile, checkSpelling } from './modules/textChecker';
import { exportToCSV } from './modules/csvExporter';

function App() {
  const [files, setFiles] = useState<{
    xml?: File;
    mp4?: File;
    txt?: File;
    referenceMp4?: File;
  }>({});
  const [errors, setErrors] = useState<CheckError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const handleFilesSelected = (selectedFiles: typeof files) => {
    setFiles(selectedFiles);
  };

  const handleCheck = async () => {
    if (!files.xml && !files.mp4 && !files.txt) {
      alert('少なくとも1つのファイル（XML、MP4、またはTXT）を選択してください。');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setErrors([]);

    const allErrors: CheckError[] = [];

    try {
      // 1. XML解析とギャップ検知
      if (files.xml) {
        setProgressMessage('Premiere Pro XMLを解析中...');
        setProgress(10);
        try {
          const xmlContent = await files.xml.text();
          const timeline = await parsePremiereXML(xmlContent);
          const gapErrors = detectGaps(timeline);
          allErrors.push(...gapErrors);
          setProgress(30);
        } catch (error) {
          console.error('XML解析エラー:', error);
          allErrors.push({
            source: 'xml',
            type: 'gap',
            message: `XML解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
            timecode: '00:00:00:00',
            severity: 'error',
          });
        }
      }

      // 2. 動画解析（フラッシュフレーム検知）
      if (files.mp4) {
        setProgressMessage('動画を解析中（フラッシュフレーム検知）...');
        setProgress(40);
        try {
          let timeline = null;
          if (files.xml) {
            const xmlContent = await files.xml.text();
            timeline = await parsePremiereXML(xmlContent);
          }
          const flashErrors = await detectFlashFrames(files.mp4, timeline || { clips: [], duration: '00:00:00:00' });
          allErrors.push(...flashErrors);
          setProgress(60);
        } catch (error) {
          console.error('動画解析エラー:', error);
          allErrors.push({
            source: 'mp4',
            type: 'flash',
            message: `動画解析に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
            timecode: '00:00:00:00',
            severity: 'warning',
          });
        }
      }

      // 3. 音声解析
      if (files.mp4) {
        setProgressMessage('音声を解析中...');
        setProgress(70);
        try {
          const audioErrors = await checkAudioLevels(files.mp4, files.referenceMp4 || null);
          allErrors.push(...audioErrors);
          setProgress(85);
        } catch (error) {
          console.error('音声解析エラー:', error);
          // 音声解析エラーは警告として記録
        }
      }

      // 4. テキスト誤字脱字チェック
      if (files.txt) {
        setProgressMessage('テキストの誤字脱字をチェック中...');
        setProgress(90);
        try {
          const txtContent = await files.txt.text();
          const textEntries = parseTextFile(txtContent);
          const spellErrors = await checkSpelling(textEntries);
          allErrors.push(...spellErrors);
          setProgress(95);
        } catch (error) {
          console.error('テキストチェックエラー:', error);
          allErrors.push({
            source: 'txt',
            type: 'spell',
            message: `テキストチェックに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
            timecode: '00:00:00:00',
            severity: 'warning',
          });
        }
      }

      setProgress(100);
      setProgressMessage('チェック完了');
      setErrors(allErrors);
    } catch (error) {
      console.error('チェック処理エラー:', error);
      alert(`エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 2000);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(errors);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">動画チェックツール</h1>

        {/* ファイルアップロード */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">ファイルをアップロード</h2>
          <FileUpload onFilesSelected={handleFilesSelected} />
        </div>

        {/* チェック実行ボタン */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={handleCheck}
            disabled={isProcessing || (!files.xml && !files.mp4 && !files.txt)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'チェック中...' : 'チェック開始'}
          </button>

          {isProcessing && (
            <div className="mt-4">
              <ProgressBar progress={progress} message={progressMessage} />
            </div>
          )}
        </div>

        {/* 結果表示 */}
        {errors.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <ResultsTable errors={errors} onExportCSV={handleExportCSV} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
