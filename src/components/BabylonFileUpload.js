/**
 * Babylon.js用ファイルアップロードコンポーネント
 * 
 * TIFFファイルをアップロードしてBabylon.js DynamicTerrainビューアに読み込むコンポーネントです。
 */

import React, { useRef } from 'react';

/**
 * Babylon.js用ファイルアップロードコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Function} props.onFileLoad - ファイル読み込み完了時のコールバック
 * @param {Function} props.onLoadingChange - ローディング状態変更時のコールバック
 * @param {Object} props.viewerRef - Babylon.jsビューアの参照
 */
const BabylonFileUpload = ({ onFileLoad, onLoadingChange, viewerRef }) => {
  const fileInputRef = useRef(null);

  /**
   * ファイル選択時の処理
   * @param {Event} event - ファイル選択イベント
   */
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // ファイル拡張子のチェック
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.tif') && !fileName.endsWith('.tiff')) {
      alert('TIFFファイルを選択してください。');
      return;
    }

    try {
      onLoadingChange && onLoadingChange(true);
      
      // Babylon.jsビューアにファイルを読み込む
      if (viewerRef.current && viewerRef.current.loadTIFFFile) {
        await viewerRef.current.loadTIFFFile(file);
        onFileLoad && onFileLoad({
          name: file.name,
          size: file.size,
          type: file.type
        });
      }
    } catch (error) {
      console.error('ファイルの読み込みに失敗しました:', error);
      alert('ファイルの読み込みに失敗しました。');
    } finally {
      onLoadingChange && onLoadingChange(false);
    }
  };

  /**
   * ファイル選択ダイアログを開く
   */
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="babylon-file-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept=".tif,.tiff"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button 
        className="upload-btn"
        onClick={openFileDialog}
        title="TIFFファイルを選択"
      >
        📁 TIFFファイルを選択
      </button>
    </div>
  );
};

export default BabylonFileUpload;
