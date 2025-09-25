import React from 'react';

/**
 * 情報パネルコンポーネント
 * 
 * 点群データの詳細情報を表示するコンポーネントです。
 * 点群数、境界範囲などの統計情報をユーザーに提供します。
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Object|null} props.pointCloudInfo - 点群の情報オブジェクト
 * @param {number} props.pointCloudInfo.count - 点群の総数
 * @param {Object} props.pointCloudInfo.bounds - 境界情報
 * @param {Object} props.pointCloudInfo.bounds.min - 最小座標（x, y, z）
 * @param {Object} props.pointCloudInfo.bounds.max - 最大座標（x, y, z）
 * @param {number} props.loadedPoints - 現在読み込まれている点数
 * @param {number} props.maxPoints - 最大点数
 */
const InfoPanel = ({ pointCloudInfo, loadedPoints, maxPoints }) => {
  /**
   * 点群情報がない場合のデフォルト表示
   * ファイルが読み込まれていない状態を示します
   */
  if (!pointCloudInfo) {
    return (
      <div className="info-panel">
        <h3>点群情報</h3>
        <div>点群数: -</div>
        <div>範囲: -</div>
      </div>
    );
  }

  /**
   * 境界情報を読みやすい形式にフォーマット
   * @param {Object} bounds - 境界情報オブジェクト
   * @param {Object} bounds.min - 最小座標
   * @param {Object} bounds.max - 最大座標
   * @returns {string} フォーマットされた境界文字列
   */
  const formatBounds = (bounds) => {
    return `X[${bounds.min.x.toFixed(2)}, ${bounds.max.x.toFixed(2)}] Y[${bounds.min.y.toFixed(2)}, ${bounds.max.y.toFixed(2)}] Z[${bounds.min.z.toFixed(2)}, ${bounds.max.z.toFixed(2)}]`;
  };

  return (
    <div className="info-panel">
      <h3>点群情報</h3>
      {/* 点群数をカンマ区切りで表示 */}
      <div>点群数: {pointCloudInfo.count.toLocaleString()}</div>
      
      {/* 段階的読み込みの進捗表示 */}
      {loadedPoints && maxPoints && (
        <div>
          読み込み進捗: {loadedPoints.toLocaleString()} / {maxPoints.toLocaleString()} 点
          ({((loadedPoints / maxPoints) * 100).toFixed(1)}%)
        </div>
      )}
      
      {/* 境界範囲をフォーマットして表示 */}
      <div>範囲: {formatBounds(pointCloudInfo.bounds)}</div>
    </div>
  );
};

export default InfoPanel;
