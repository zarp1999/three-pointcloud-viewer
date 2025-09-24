import React from 'react';

/**
 * 情報パネルコンポーネント
 * 点群の情報（点数、境界など）を表示
 */
const InfoPanel = ({ pointCloudInfo }) => {
  // 点群情報がない場合はデフォルト表示
  if (!pointCloudInfo) {
    return (
      <div className="info-panel">
        <h3>点群情報</h3>
        <div>点群数: -</div>
        <div>範囲: -</div>
      </div>
    );
  }

  // 境界情報をフォーマット
  const formatBounds = (bounds) => {
    return `X[${bounds.min.x.toFixed(2)}, ${bounds.max.x.toFixed(2)}] Y[${bounds.min.y.toFixed(2)}, ${bounds.max.y.toFixed(2)}] Z[${bounds.min.z.toFixed(2)}, ${bounds.max.z.toFixed(2)}]`;
  };

  return (
    <div className="info-panel">
      <h3>点群情報</h3>
      <div>点群数: {pointCloudInfo.count.toLocaleString()}</div>
      <div>範囲: {formatBounds(pointCloudInfo.bounds)}</div>
    </div>
  );
};

export default InfoPanel;
