import React, { useState, useRef, useEffect } from 'react';
import PointCloudViewer from './components/PointCloudViewer';
import Sidebar from './components/Sidebar';
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
  
  // 計測機能の状態管理
  const [isMeasurementMode, setIsMeasurementMode] = useState(false);
  const [measurementDistance, setMeasurementDistance] = useState(null);
  
  // サイドバーの表示状態
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  // Three.js関連の参照
  const viewerRef = useRef(null);

  /**
   * 計測距離を定期的に更新
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (viewerRef.current && isMeasurementMode) {
        const distance = viewerRef.current.measurementDistance;
        if (distance !== measurementDistance) {
          setMeasurementDistance(distance);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isMeasurementMode, measurementDistance]);

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

  /**
   * 計測モードを切り替える
   */
  const handleToggleMeasurement = () => {
    if (viewerRef.current) {
      viewerRef.current.toggleMeasurementMode();
      // ビューアの状態を取得して更新
      setIsMeasurementMode(viewerRef.current.isMeasurementMode);
    }
  };

  /**
   * 計測をクリアする
   */
  const handleClearMeasurement = () => {
    if (viewerRef.current) {
      viewerRef.current.clearMeasurement();
      setMeasurementDistance(null);
    }
  };

  /**
   * サイドバーの表示/非表示を切り替える
   */
  const handleToggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  return (
    <div className="app-container">
      <header>
        <div className="header-content">
          <h1>点群データビューア</h1>
          <div className="header-controls">
            <button 
              className="sidebar-toggle-btn"
              onClick={handleToggleSidebar}
              title={isSidebarVisible ? 'メニューを閉じる' : 'メニューを開く'}
            >
              <div className="hamburger-icon">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
            <FileUpload 
              onFileLoad={handlePointCloudLoaded}
              onLoadingChange={handleLoadingChange}
              viewerRef={viewerRef}
            />
          </div>
        </div>
      </header>
      
      <div className={`main-content ${!isSidebarVisible ? 'full-width' : ''}`}>
        <div className="viewer-container">
          <PointCloudViewer 
            ref={viewerRef}
            pointSize={pointSize}
            opacity={opacity}
            showColors={showColors}
            onPointCloudLoaded={handlePointCloudLoaded}
            onLoadingChange={handleLoadingChange}
          />
          {isLoading && (
            <div className="loading show">読み込み中...</div>
          )}
        </div>
        
        {isSidebarVisible && (
          <Sidebar
            pointSize={pointSize}
            opacity={opacity}
            showColors={showColors}
            onPointSizeChange={handlePointSizeChange}
            onOpacityChange={handleOpacityChange}
            onToggleColors={handleToggleColors}
            onReset={handleReset}
            onToggleStats={handleToggleStats}
            onToggleMeasurement={handleToggleMeasurement}
            onClearMeasurement={handleClearMeasurement}
            isMeasurementMode={isMeasurementMode}
            measurementDistance={measurementDistance}
            pointCloudInfo={pointCloudInfo}
          />
        )}
      </div>
    </div>
  );
}

export default App;
