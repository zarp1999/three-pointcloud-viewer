import React from 'react';
import ControlsPanel from './ControlsPanel';
import InfoPanel from './InfoPanel';

/**
 * サイドバーコンポーネント
 * 表示設定と点群情報を統合したサイドバー
 */
const Sidebar = ({
  pointSize,
  opacity,
  showColors,
  onPointSizeChange,
  onOpacityChange,
  onToggleColors,
  onReset,
  onToggleStats,
  onToggleMeasurement,
  onClearMeasurement,
  isMeasurementMode,
  measurementDistance,
  pointCloudInfo
}) => {
  return (
    <div className="sidebar">
      <div className="sidebar-content">
        {/* 表示設定パネル */}
        <ControlsPanel
          pointSize={pointSize}
          opacity={opacity}
          showColors={showColors}
          onPointSizeChange={onPointSizeChange}
          onOpacityChange={onOpacityChange}
          onToggleColors={onToggleColors}
          onReset={onReset}
          onToggleStats={onToggleStats}
          onToggleMeasurement={onToggleMeasurement}
          onClearMeasurement={onClearMeasurement}
          isMeasurementMode={isMeasurementMode}
          measurementDistance={measurementDistance}
        />
        
        {/* 点群情報パネル */}
        <InfoPanel pointCloudInfo={pointCloudInfo} />
      </div>
    </div>
  );
};

export default Sidebar;
