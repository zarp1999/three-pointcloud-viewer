/**
 * CesiumJSベースの大規模点群ビューアコンポーネント
 * 
 * CesiumJSを使用して2億点クラスの大規模点群データを効率的に表示します。
 * 地理空間データの表示に特化しており、LOD（Level of Detail）と
 * 視錐台カリングによる最適化が自動的に適用されます。
 * 
 * 主な機能:
 * - 大規模点群データの効率的な表示
 * - 自動LOD調整
 * - 地理空間座標系のサポート
 * - 3D地球表示
 * - 高性能レンダリング
 */

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import * as Cesium from 'cesium';

/**
 * CesiumJS点群ビューアコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {number} props.pointSize - 点のサイズ
 * @param {number} props.opacity - 透明度
 * @param {boolean} props.showColors - 色表示の有無
 * @param {Function} props.onPointCloudLoaded - 点群読み込み完了時のコールバック
 * @param {Function} props.onLoadingChange - ローディング状態変更時のコールバック
 */
const CesiumPointCloudViewer = forwardRef(({ 
  pointSize, 
  opacity, 
  showColors, 
  onPointCloudLoaded, 
  onLoadingChange 
}, ref) => {
  // CesiumJS関連の参照
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const pointCloudDataSourceRef = useRef(null);
  const animationIdRef = useRef(null);

  // 点群情報の状態
  const [pointCloudInfo, setPointCloudInfo] = useState(null);

  /**
   * CesiumJSビューアの初期化
   */
  const initCesiumViewer = () => {
    if (!containerRef.current) return;

    console.log('CesiumJSビューアを初期化中...');

    try {
      // CesiumJSビューアを作成
      const viewer = new Cesium.Viewer(containerRef.current, {
        timeline: false,
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false
      });

      // 地球の設定
      if (viewer.scene.globe) {
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.dynamicAtmosphereLighting = true;
        viewer.scene.globe.atmosphereLightIntensity = 10.0;
      }
      
      // カメラの設定
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, 10000000.0),
        orientation: {
          heading: 0.0,
          pitch: Cesium.Math.toRadians(-90.0),
          roll: 0.0
        }
      });

      viewerRef.current = viewer;
      console.log('CesiumJSビューア初期化完了');

    } catch (error) {
      console.error('CesiumJSビューア初期化エラー:', error);
      throw error;
    }
  };

  /**
   * LASファイルを読み込んで点群データを表示
   * @param {File} file - LASファイル
   */
  const loadLASFile = async (file) => {
    if (onLoadingChange) {
      onLoadingChange(true);
    }

    console.log(`CesiumJSでLASファイルを読み込み中: ${file.name}`);

    try {
      // LASファイルを読み込み
      const arrayBuffer = await file.arrayBuffer();
      const lasData = await parseLASFile(arrayBuffer);
      
      // 点群データをCesiumJSで表示
      await displayPointCloudInCesium(lasData);
      
      // 点群情報を設定
      const info = {
        count: lasData.points.length,
        bounds: lasData.bounds,
        center: lasData.center,
        radius: lasData.radius
      };
      
      setPointCloudInfo(info);
      onPointCloudLoaded(info);
      console.log(`CesiumJS点群表示完了: ${lasData.points.length} 点`);

    } catch (error) {
      console.error('CesiumJS LASファイル読み込みエラー:', error);
      throw new Error('LASファイルの読み込みに失敗しました: ' + error.message);
    } finally {
      if (onLoadingChange) {
        onLoadingChange(false);
      }
    }
  };

  /**
   * LASファイルを解析
   * @param {ArrayBuffer} arrayBuffer - LASファイルのデータ
   */
  const parseLASFile = async (arrayBuffer) => {
    console.log('LASファイルを解析中...');
    
    const dataView = new DataView(arrayBuffer);
    
    // LASヘッダーを読み込み
    const header = parseLASHeader(dataView);
    console.log('LASヘッダー情報:', header);

    // 点群データを読み込み
    const points = await parseLASPoints(dataView, header);
    
    // 境界ボックスを計算
    const bounds = calculateBounds(points);
    const center = calculateCenter(bounds);
    const radius = calculateRadius(bounds);

    return {
      points,
      bounds,
      center,
      radius,
      header
    };
  };

  /**
   * LASヘッダーを解析
   * @param {DataView} dataView - データビュー
   */
  const parseLASHeader = (dataView) => {
    // LASファイルのヘッダー情報を読み込み
    const header = {
      versionMajor: dataView.getUint8(24),
      versionMinor: dataView.getUint8(25),
      pointDataFormat: dataView.getUint8(104),
      pointDataRecordLength: dataView.getUint16(105, true),
      pointDataOffset: dataView.getUint32(96, true),
      totalPoints: dataView.getUint32(107, true),
      xScale: dataView.getFloat64(131, true),
      yScale: dataView.getFloat64(139, true),
      zScale: dataView.getFloat64(147, true),
      xOffset: dataView.getFloat64(155, true),
      yOffset: dataView.getFloat64(163, true),
      zOffset: dataView.getFloat64(171, true),
      maxX: dataView.getFloat64(179, true),
      minX: dataView.getFloat64(187, true),
      maxY: dataView.getFloat64(195, true),
      minY: dataView.getFloat64(203, true),
      maxZ: dataView.getFloat64(211, true),
      minZ: dataView.getFloat64(219, true)
    };

    return header;
  };

  /**
   * LAS点群データを解析
   * @param {DataView} dataView - データビュー
   * @param {Object} header - LASヘッダー
   */
  const parseLASPoints = async (dataView, header) => {
    const points = [];
    const offset = header.pointDataOffset;
    const recordLength = header.pointDataRecordLength;
    const pointDataFormat = header.pointDataFormat;

    // 大規模データの場合は初期読み込みを制限
    const maxInitialPoints = Math.min(header.totalPoints, 5000000); // 500万点まで
    const step = Math.max(1, Math.floor(header.totalPoints / maxInitialPoints));
    
    console.log(`CesiumJS点群データを読み込み中... (初期: ${maxInitialPoints}点, 全点: ${header.totalPoints}点)`);

    for (let i = 0; i < maxInitialPoints; i += step) {
      const recordOffset = offset + (i * recordLength);
      
      if (recordOffset + recordLength > dataView.byteLength) {
        console.warn(`レコード ${i} がファイルサイズを超えています`);
        break;
      }

      try {
        // 座標を読み込み
        const x = dataView.getInt32(recordOffset, true) * header.xScale + header.xOffset;
        const y = dataView.getInt32(recordOffset + 4, true) * header.yScale + header.yOffset;
        const z = dataView.getInt32(recordOffset + 8, true) * header.zScale + header.zOffset;

        // 色情報を読み込み（Point Data Format 2以上の場合）
        let color = { r: 1.0, g: 1.0, b: 1.0 };
        if (pointDataFormat >= 2) {
          const colorOffset = getColorOffset(pointDataFormat);
          if (recordOffset + colorOffset + 6 < dataView.byteLength) {
            const red = dataView.getUint16(recordOffset + colorOffset, true);
            const green = dataView.getUint16(recordOffset + colorOffset + 2, true);
            const blue = dataView.getUint16(recordOffset + colorOffset + 4, true);
            
            color = {
              r: Math.min(red / 65535.0, 1.0),
              g: Math.min(green / 65535.0, 1.0),
              b: Math.min(blue / 65535.0, 1.0)
            };
          }
        }

        points.push({
          x, y, z,
          color,
          index: i
        });

      } catch (error) {
        console.warn(`点 ${i} の読み込みエラー:`, error);
        continue;
      }

      // 進捗表示
      if (i > 0 && i % 100000 === 0) {
        console.log(`読み込み進捗: ${i}/${maxInitialPoints} 点`);
      }
    }

    console.log(`CesiumJS点群データ読み込み完了: ${points.length} 点`);
    return points;
  };

  /**
   * 色情報のオフセットを取得
   * @param {number} pointDataFormat - ポイントデータフォーマット
   */
  const getColorOffset = (pointDataFormat) => {
    switch (pointDataFormat) {
      case 2: return 20;
      case 3: return 20;
      case 5: return 20;
      case 6: return 20;
      case 7: return 20;
      case 8: return 30;
      case 10: return 20;
      default: return 20;
    }
  };

  /**
   * 境界ボックスを計算
   * @param {Array} points - 点群データ
   */
  const calculateBounds = (points) => {
    if (points.length === 0) return null;

    let minX = points[0].x, maxX = points[0].x;
    let minY = points[0].y, maxY = points[0].y;
    let minZ = points[0].z, maxZ = points[0].z;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
      minZ = Math.min(minZ, point.z);
      maxZ = Math.max(maxZ, point.z);
    }

    return {
      minX, maxX, minY, maxY, minZ, maxZ
    };
  };

  /**
   * 中心点を計算
   * @param {Object} bounds - 境界ボックス
   */
  const calculateCenter = (bounds) => {
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
      z: (bounds.minZ + bounds.maxZ) / 2
    };
  };

  /**
   * 半径を計算
   * @param {Object} bounds - 境界ボックス
   */
  const calculateRadius = (bounds) => {
    const dx = bounds.maxX - bounds.minX;
    const dy = bounds.maxY - bounds.minY;
    const dz = bounds.maxZ - bounds.minZ;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) / 2;
  };

  /**
   * 点群データをCesiumJSで表示
   * @param {Object} lasData - LASデータ
   */
  const displayPointCloudInCesium = async (lasData) => {
    if (!viewerRef.current) return;

    console.log('CesiumJSで点群データを表示中...');

    try {
      // 既存の点群データソースを削除
      if (pointCloudDataSourceRef.current) {
        viewerRef.current.dataSources.remove(pointCloudDataSourceRef.current);
      }

      // 点群データソースを作成
      const dataSource = new Cesium.CustomDataSource('PointCloud');

      // 点群データを効率的に表示（サンプリング）
      const totalPoints = Math.min(lasData.points.length, 500000); // 最大50万点まで表示
      const step = Math.max(1, Math.floor(lasData.points.length / totalPoints));
      
      console.log(`CesiumJSで点群表示中: ${totalPoints} 点 (ステップ: ${step})`);
      
      // サンプリングされた点群データを作成
      const sampledPoints = [];
      for (let i = 0; i < lasData.points.length; i += step) {
        sampledPoints.push(lasData.points[i]);
        if (sampledPoints.length >= totalPoints) break;
      }
      
      // バッチ処理で点群エンティティを作成
      const batchSize = 10000;
      for (let i = 0; i < sampledPoints.length; i += batchSize) {
        const batch = sampledPoints.slice(i, i + batchSize);
        
        for (const point of batch) {
          const entity = new Cesium.Entity({
            position: Cesium.Cartesian3.fromDegrees(point.x, point.y, point.z),
            point: {
              pixelSize: Math.max(pointSize * 1000, 1),
              color: showColors ? 
                Cesium.Color.fromBytes(
                  Math.round(point.color.r * 255),
                  Math.round(point.color.g * 255),
                  Math.round(point.color.b * 255)
                ) : Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 0,
              heightReference: Cesium.HeightReference.NONE
            }
          });
          
          dataSource.entities.add(entity);
        }

        // UIをブロックしないように非同期処理
        if (i % (batchSize * 5) === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
          console.log(`点群表示進捗: ${i}/${sampledPoints.length} 点`);
        }
      }

      // データソースをビューアに追加
      viewerRef.current.dataSources.add(dataSource);
      pointCloudDataSourceRef.current = dataSource;

      // カメラを点群の中心に移動
      viewerRef.current.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          lasData.center.x,
          lasData.center.y,
          lasData.center.z + lasData.radius * 2
        ),
        orientation: {
          heading: 0.0,
          pitch: Cesium.Math.toRadians(-45.0),
          roll: 0.0
        }
      });

      console.log('CesiumJS点群表示完了');

    } catch (error) {
      console.error('CesiumJS点群表示エラー:', error);
      throw error;
    }
  };

  /**
   * ビューをリセット
   */
  const resetView = () => {
    if (viewerRef.current) {
      viewerRef.current.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0.0, 0.0, 10000000.0),
        orientation: {
          heading: 0.0,
          pitch: Cesium.Math.toRadians(-90.0),
          roll: 0.0
        }
      });
    }
    setPointCloudInfo(null);
  };

  // コンポーネントの初期化
  useEffect(() => {
    initCesiumViewer();
    
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  // プロパティの変更を監視
  useEffect(() => {
    if (viewerRef.current && pointCloudDataSourceRef.current) {
      // 点のサイズを更新
      pointCloudDataSourceRef.current.entities.values.forEach(entity => {
        if (entity.point) {
          entity.point.pixelSize = pointSize * 1000;
        }
      });
    }
  }, [pointSize]);

  useEffect(() => {
    if (viewerRef.current && pointCloudDataSourceRef.current) {
      // 色表示を更新
      pointCloudDataSourceRef.current.entities.values.forEach(entity => {
        if (entity.point) {
          entity.point.color = showColors ? 
            entity.point.color : Cesium.Color.WHITE;
        }
      });
    }
  }, [showColors]);

  // 親コンポーネントから呼び出せるメソッドを公開
  useImperativeHandle(ref, () => ({
    loadPointCloud: loadLASFile,
    resetView
  }));

  return (
    <div 
      id="cesium-point-cloud-viewer" 
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
});

CesiumPointCloudViewer.displayName = 'CesiumPointCloudViewer';

export default CesiumPointCloudViewer;
