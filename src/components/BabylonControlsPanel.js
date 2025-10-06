/**
 * Babylon.js用コントロールパネルコンポーネント
 * 
 * 高さマップ地形ビューアの各種設定を調整するコントロールパネルです。
 */

import React, { useState, useEffect } from 'react';

/**
 * Babylon.js用コントロールパネルコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Object} props.viewerRef - Babylon.jsビューアの参照
 * @param {Object} props.terrainInfo - 地形情報
 * @param {Function} props.onHeightScaleChange - 高さスケール変更時のコールバック
 * @param {Function} props.onWireframeToggle - ワイヤーフレーム切り替え時のコールバック
 */
const BabylonControlsPanel = ({ 
  viewerRef, 
  terrainInfo, 
  onHeightScaleChange,
  onWireframeToggle 
}) => {
  // コントロールの状態
  const [heightScale, setHeightScale] = useState(1.0);
  const [showWireframe, setShowWireframe] = useState(false);
  const [terrainSize, setTerrainSize] = useState(200);

  /**
   * 高さスケールの変更
   * @param {number} scale - 新しい高さスケール
   */
  const handleHeightScaleChange = (scale) => {
    setHeightScale(scale);
    if (viewerRef.current && viewerRef.current.updateHeightScale) {
      viewerRef.current.updateHeightScale(scale);
    }
    onHeightScaleChange && onHeightScaleChange(scale);
  };

  /**
   * ワイヤーフレーム表示の切り替え
   * @param {boolean} wireframe - ワイヤーフレーム表示の有無
   */
  const handleWireframeToggle = (wireframe) => {
    setShowWireframe(wireframe);
    if (viewerRef.current && viewerRef.current.toggleWireframe) {
      viewerRef.current.toggleWireframe(wireframe);
    }
    onWireframeToggle && onWireframeToggle(wireframe);
  };

  /**
   * ビューのリセット
   */
  const handleResetView = () => {
    if (viewerRef.current && viewerRef.current.resetView) {
      viewerRef.current.resetView();
    }
  };

  /**
   * 地形のクリア
   */
  const handleClearTerrain = () => {
    if (viewerRef.current && viewerRef.current.clearTerrain) {
      viewerRef.current.clearTerrain();
    }
  };

  return (
    <div className="babylon-controls-panel">
      <h3>Babylon.js 高さマップ地形 コントロール</h3>
      
      {/* 高さスケール調整 */}
      <div className="control-group">
        <label htmlFor="heightScale">
          高さスケール: {heightScale.toFixed(2)}
        </label>
        <input
          id="heightScale"
          type="range"
          min="0.1"
          max="5.0"
          step="0.1"
          value={heightScale}
          onChange={(e) => handleHeightScaleChange(parseFloat(e.target.value))}
          className="slider"
        />
      </div>

      {/* ワイヤーフレーム表示 */}
      <div className="control-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showWireframe}
            onChange={(e) => handleWireframeToggle(e.target.checked)}
          />
          ワイヤーフレーム表示
        </label>
      </div>

      {/* 地形サイズ調整 */}
      <div className="control-group">
        <label htmlFor="terrainSize">
          地形サイズ: {terrainSize}
        </label>
        <input
          id="terrainSize"
          type="range"
          min="100"
          max="500"
          step="50"
          value={terrainSize}
          onChange={(e) => setTerrainSize(parseInt(e.target.value))}
          className="slider"
        />
      </div>

      {/* 地形情報表示 */}
      {terrainInfo && (
        <div className="terrain-info">
          <h4>地形情報</h4>
          <div className="info-item">
            <span>解像度:</span>
            <span>{terrainInfo.width} × {terrainInfo.height}</span>
          </div>
          <div className="info-item">
            <span>高さ範囲:</span>
            <span>{terrainInfo.minHeight.toFixed(2)} - {terrainInfo.maxHeight.toFixed(2)}</span>
          </div>
          <div className="info-item">
            <span>地形サイズ:</span>
            <span>{terrainInfo.terrainSize}</span>
          </div>
          <div className="info-item">
            <span>分割数:</span>
            <span>{terrainInfo.subdivisions}</span>
          </div>
        </div>
      )}

      {/* コントロールボタン */}
      <div className="control-buttons">
        <button 
          className="control-btn reset-btn"
          onClick={handleResetView}
          title="ビューをリセット"
        >
          🔄 ビューリセット
        </button>
        <button 
          className="control-btn clear-btn"
          onClick={handleClearTerrain}
          title="地形をクリア"
        >
          🗑️ 地形クリア
        </button>
      </div>

      {/* 操作説明 */}
      <div className="instructions">
        <h4>操作方法</h4>
        <ul>
          <li>マウス左ドラッグ: カメラ回転</li>
          <li>マウス右ドラッグ: カメラ移動</li>
          <li>マウスホイール: ズーム</li>
          <li>高さスケール: 地形の高さを調整</li>
          <li>ワイヤーフレーム: 地形の構造を表示</li>
        </ul>
      </div>
    </div>
  );
};

export default BabylonControlsPanel;
