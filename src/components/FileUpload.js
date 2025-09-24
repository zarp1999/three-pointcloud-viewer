import React, { useRef } from 'react';

/**
 * ファイルアップロードコンポーネント
 * 点群ファイル（PLY、LAS）の選択と読み込みを担当
 */
const FileUpload = ({ onFileLoad, onLoadingChange, viewerRef }) => {
  const fileInputRef = useRef(null);

  /**
   * ファイルが選択された時の処理
   * @param {Event} event - ファイル選択イベント
   */
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      if (viewerRef.current) {
        await viewerRef.current.loadPointCloud(file);
      }
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      alert('ファイルの読み込みに失敗しました: ' + error.message);
    }
  };

  /**
   * ファイル選択ボタンがクリックされた時の処理
   */
  const handleLoadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="controls">
      <input 
        type="file" 
        id="fileInput" 
        accept=".las,.ply" 
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button onClick={handleLoadButtonClick}>
        点群データを読み込み
      </button>
    </div>
  );
};

export default FileUpload;
