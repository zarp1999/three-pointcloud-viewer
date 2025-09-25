import React, { useState, useRef, useEffect } from 'react';
import PointCloudViewer from './components/PointCloudViewer';
import LODPointCloudViewer from './components/LODPointCloudViewer';
import ControlsPanel from './components/ControlsPanel';
import InfoPanel from './components/InfoPanel';
import FileUpload from './components/FileUpload';

/**
 * メインアプリケーションコンポーネント
 * 点群ビューアの全体レイアウトと状態管理を担当
 */
function App() {
  // デバッグ用ログ
  console.log('Appコンポーネントがレンダリングされています');
  
  // アプリケーションの状態管理
  const [pointCloudInfo, setPointCloudInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pointSize, setPointSize] = useState(0.01);
  const [opacity, setOpacity] = useState(1.0);
  const [showColors, setShowColors] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [useLODViewer, setUseLODViewer] = useState(false); // LODビューアの使用フラグ
  
  // Three.js関連の参照
  const viewerRef = useRef(null);
  const lodViewerRef = useRef(null);

  /**
   * 点群情報を更新する
   * @param {Object} info - 点群の情報（点数、境界など）
   */
  const handlePointCloudLoaded = (info) => {
    setPointCloudInfo(info);
  };

  /**
   * ローディング状態を更新する
   * @param {boolean} loading - ローディング状態
   */
  const handleLoadingChange = (loading) => {
    setIsLoading(loading);
  };

  /**
   * 点のサイズを更新する
   * @param {number} size - 新しい点のサイズ
   */
  const handlePointSizeChange = (size) => {
    setPointSize(size);
  };

  /**
   * 透明度を更新する
   * @param {number} opacity - 新しい透明度
   */
  const handleOpacityChange = (opacity) => {
    setOpacity(opacity);
  };

  /**
   * 色表示の切り替え
   */
  const handleToggleColors = () => {
    setShowColors(!showColors);
  };


  /**
   * Stats Panelの表示/非表示を切り替える
   */
  const handleToggleStats = () => {
    setShowStats(!showStats);
    if (viewerRef.current) {
      viewerRef.current.toggleStats();
    }
    if (lodViewerRef.current) {
      lodViewerRef.current.toggleStats();
    }
  };

  /**
   * LODビューアの切り替え
   */
  const handleToggleLODViewer = () => {
    setUseLODViewer(!useLODViewer);
    console.log(`LODビューア切り替え: ${!useLODViewer ? '有効' : '無効'}`);
  };

  /**
   * Potreeデータの読み込み
   */
  const handleLoadPotreeData = async () => {
    const potreeUrl = prompt('PotreeデータのURLを入力してください (例: /potree_data/cloud.js):');
    if (potreeUrl && lodViewerRef.current) {
      try {
        await lodViewerRef.current.loadPointCloud(potreeUrl);
        console.log('Potreeデータの読み込みが完了しました');
      } catch (error) {
        console.error('Potreeデータの読み込みに失敗:', error);
        alert('Potreeデータの読み込みに失敗しました: ' + error.message);
      }
    }
  };

  /**
   * ビューをリセットする
   */
  const handleReset = () => {
    setPointCloudInfo(null);
    if (viewerRef.current) {
      viewerRef.current.resetView();
    }
  };

  return (
    <div className="container">
      <header>
        <h1>点群データビューア</h1>
        <FileUpload 
          onFileLoad={handlePointCloudLoaded}
          onLoadingChange={handleLoadingChange}
          viewerRef={viewerRef}
        />
      </header>
      
      <div className="viewer-container">
        {useLODViewer ? (
          <LODPointCloudViewer 
            ref={lodViewerRef}
            pointSize={pointSize}
            opacity={opacity}
            showColors={showColors}
            onPointCloudLoaded={handlePointCloudLoaded}
            onLoadingChange={handleLoadingChange}
          />
        ) : (
          <PointCloudViewer 
            ref={viewerRef}
            pointSize={pointSize}
            opacity={opacity}
            showColors={showColors}
            onPointCloudLoaded={handlePointCloudLoaded}
            onLoadingChange={handleLoadingChange}
          />
        )}
        {isLoading && (
          <div className="loading show">読み込み中...</div>
        )}
        <InfoPanel pointCloudInfo={pointCloudInfo} />
      </div>
      
      <ControlsPanel
        pointSize={pointSize}
        opacity={opacity}
        showColors={showColors}
        onPointSizeChange={handlePointSizeChange}
        onOpacityChange={handleOpacityChange}
        onToggleColors={handleToggleColors}
        onToggleStats={handleToggleStats}
        onToggleLODViewer={handleToggleLODViewer}
        onLoadPotreeData={handleLoadPotreeData}
        onReset={handleReset}
      />
    </div>
  );
}

export default App;
