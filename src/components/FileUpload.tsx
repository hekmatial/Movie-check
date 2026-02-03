import { useCallback, useState } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: {
    xml?: File;
    mp4?: File;
    txt?: File;
    referenceMp4?: File;
  }) => void;
}

export function FileUpload({ onFilesSelected }: FileUploadProps) {
  const [files, setFiles] = useState<{
    xml?: File;
    mp4?: File;
    txt?: File;
    referenceMp4?: File;
  }>({});

  const handleFileChange = useCallback(
    (type: 'xml' | 'mp4' | 'txt' | 'referenceMp4', file: File | null) => {
      const newFiles = { ...files, [type]: file || undefined };
      setFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [files, onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, type: 'xml' | 'mp4' | 'txt' | 'referenceMp4') => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileChange(type, file);
      }
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Premiere Pro XML */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Premiere Pro XML
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onDrop={(e) => handleDrop(e, 'xml')}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              accept=".xml"
              className="hidden"
              id="xml-upload"
              onChange={(e) => handleFileChange('xml', e.target.files?.[0] || null)}
            />
            <label htmlFor="xml-upload" className="cursor-pointer">
              {files.xml ? (
                <div className="text-sm text-gray-600">
                  {files.xml.name}
                </div>
              ) : (
                <div>
                  <p className="text-gray-500">ドラッグ&ドロップまたはクリック</p>
                  <p className="text-xs text-gray-400 mt-2">.xmlファイル</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* MP4動画 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            チェック対象動画 (MP4)
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onDrop={(e) => handleDrop(e, 'mp4')}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              accept="video/mp4"
              className="hidden"
              id="mp4-upload"
              onChange={(e) => handleFileChange('mp4', e.target.files?.[0] || null)}
            />
            <label htmlFor="mp4-upload" className="cursor-pointer">
              {files.mp4 ? (
                <div className="text-sm text-gray-600">
                  {files.mp4.name}
                </div>
              ) : (
                <div>
                  <p className="text-gray-500">ドラッグ&ドロップまたはクリック</p>
                  <p className="text-xs text-gray-400 mt-2">.mp4ファイル</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* テキストファイル */}
        <div>
          <label className="block text-sm font-medium mb-2">
            テロップテキスト (TXT)
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onDrop={(e) => handleDrop(e, 'txt')}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              accept=".txt"
              className="hidden"
              id="txt-upload"
              onChange={(e) => handleFileChange('txt', e.target.files?.[0] || null)}
            />
            <label htmlFor="txt-upload" className="cursor-pointer">
              {files.txt ? (
                <div className="text-sm text-gray-600">
                  {files.txt.name}
                </div>
              ) : (
                <div>
                  <p className="text-gray-500">ドラッグ&ドロップまたはクリック</p>
                  <p className="text-xs text-gray-400 mt-2">.txtファイル（タイムコード付き）</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* お手本動画 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            お手本動画 (MP4) <span className="text-xs text-gray-400">（オプション）</span>
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onDrop={(e) => handleDrop(e, 'referenceMp4')}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              accept="video/mp4"
              className="hidden"
              id="reference-mp4-upload"
              onChange={(e) => handleFileChange('referenceMp4', e.target.files?.[0] || null)}
            />
            <label htmlFor="reference-mp4-upload" className="cursor-pointer">
              {files.referenceMp4 ? (
                <div className="text-sm text-gray-600">
                  {files.referenceMp4.name}
                </div>
              ) : (
                <div>
                  <p className="text-gray-500">ドラッグ&ドロップまたはクリック</p>
                  <p className="text-xs text-gray-400 mt-2">.mp4ファイル</p>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
