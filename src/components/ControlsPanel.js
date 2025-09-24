import React from 'react';

/**
 * コントロールパネルコンポーネント
 * 点群の表示設定（点のサイズ、透明度、色表示）を制御
 */
const ControlsPanel = ({
  pointSize,
  opacity,
  showColors,
  onPointSizeChange,
  onOpacityChange,
  onToggleColors,
  onReset,
  onQualityChange
}) => {
  /**
   * 点のサイズが変更された時の処理
   * @param {Event} event - スライダーイベント
   */
  const handlePointSizeChange = (event) => {
    const size = parseFloat(event.target.value);
    onPointSizeChange(size);
  };

  /**
   * 透明度が変更された時の処理
   * @param {Event} event - スライダーイベント
   */
  const handleOpacityChange = (event) => {
    const opacity = parseFloat(event.target.value);
    onOpacityChange(opacity);
  };

  /**
   * 品質レベルが変更された時の処理
   * @param {Event} event - スライダーイベント
   */
  const handleQualityChange = (event) => {
    const quality = parseInt(event.target.value);
    onQualityChange(quality);
    
    // 品質レベルの表示を更新
    const qualityLabels = ['最高品質', '高品質', '中品質', '低品質'];
    const qualityValue = document.getElementById('qualityValue');
    if (qualityValue) {
      qualityValue.textContent = qualityLabels[quality];
    }
  };

  return (
    <div className="controls-panel">
      <h3>表示設定</h3>
      <div className="control-group">
        <label htmlFor="pointSize">点のサイズ:</label>
        <input 
          type="range" 
          id="pointSize" 
          min="0.001" 
          max="0.1" 
          step="0.001" 
          value={pointSize}
          onChange={handlePointSizeChange}
        />
        <span>{pointSize.toFixed(3)}</span>
      </div>
      <div className="control-group">
        <label htmlFor="opacity">透明度:</label>
        <input 
          type="range" 
          id="opacity" 
          min="0.1" 
          max="1.0" 
          step="0.1" 
          value={opacity}
          onChange={handleOpacityChange}
        />
        <span>{opacity.toFixed(1)}</span>
      </div>
      <div className="control-group">
        <button 
          onClick={onToggleColors}
          style={{
            background: showColors ? '#3498db' : '#e74c3c'
          }}
        >
          {showColors ? '色情報を無効にする' : '色情報を有効にする'}
        </button>
      </div>
      <div className="control-group">
        <label htmlFor="quality">品質レベル:</label>
        <input 
          type="range" 
          id="quality" 
          min="0" 
          max="3" 
          step="1" 
          defaultValue="0"
          onChange={handleQualityChange}
        />
        <span id="qualityValue">最高品質</span>
      </div>
      <div className="control-group">
        <button onClick={onReset}>
          リセット
        </button>
      </div>
    </div>
  );
};

export default ControlsPanel;
