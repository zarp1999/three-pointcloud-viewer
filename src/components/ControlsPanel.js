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
  onToggleStats,
  onToggleCesiumViewer
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
        <button onClick={onToggleStats}>
          Stats Panel 切り替え
        </button>
      </div>
      <div className="control-group">
        <button onClick={onToggleCesiumViewer}>
          CesiumJSビューア切り替え
        </button>
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
