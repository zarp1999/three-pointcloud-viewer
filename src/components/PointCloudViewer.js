/**
 * 点群データビューア - メインビューアコンポーネント
 * 
 * Three.jsを使用して3D点群データを表示するコアコンポーネントです。
 * LASファイルとPLYファイルの両方に対応し、大規模データの最適化機能も含みます。
 * 
 * 主な機能:
 * - LAS/PLYファイルの読み込みと解析
 * - 3D点群の表示とインタラクション
 * - 品質レベル調整（LODシステム）
 * - 色情報の表示/非表示切り替え
 * - 点のサイズと透明度の調整
 */

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

/**
 * 点群ビューアコンポーネント
 * 
 * Three.jsを使用して3D点群を表示するメインコンポーネントです。
 * forwardRefを使用して親コンポーネントから直接制御できるAPIを提供します。
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {number} props.pointSize - 点のサイズ
 * @param {number} props.opacity - 透明度
 * @param {boolean} props.showColors - 色表示の有無
 * @param {Function} props.onPointCloudLoaded - 点群読み込み完了時のコールバック
 * @param {Function} props.onLoadingChange - ローディング状態変更時のコールバック
 */
const PointCloudViewer = forwardRef(({ 
  pointSize, 
  opacity, 
  showColors, 
  onPointCloudLoaded, 
  onLoadingChange 
}, ref) => {
  // Three.js関連の参照
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const currentPointCloudRef = useRef(null);
  const animationIdRef = useRef(null);
  const statsRef = useRef(null);
  const lodManagerRef = useRef(null);

  // 点群情報の状態
  const [pointCloudInfo, setPointCloudInfo] = useState(null);

  /**
   * コンポーネントの初期化
   */
  useEffect(() => {
    initThreeJS();
    return () => {
      // クリーンアップ
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (statsRef.current && statsRef.current.dom && statsRef.current.dom.parentNode) {
        statsRef.current.dom.parentNode.removeChild(statsRef.current.dom);
      }
    };
  }, []);

  /**
   * 点のサイズが変更された時の処理
   */
  useEffect(() => {
    if (currentPointCloudRef.current) {
      currentPointCloudRef.current.material.size = pointSize;
    }
  }, [pointSize]);

  /**
   * 透明度が変更された時の処理
   */
  useEffect(() => {
    if (currentPointCloudRef.current) {
      currentPointCloudRef.current.material.opacity = opacity;
    }
  }, [opacity]);

  /**
   * 色表示の切り替え処理
   */
  useEffect(() => {
    if (currentPointCloudRef.current) {
      const material = currentPointCloudRef.current.material;
      material.vertexColors = showColors;
      material.needsUpdate = true;
    }
  }, [showColors]);

  /**
   * Three.jsの初期化
   */
  const initThreeJS = () => {
    // シーンを作成
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // カメラを作成
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // レンダラーを作成
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // コンテナにレンダラーを追加
    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }

    // コントロールを設定
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // ライティングを設定
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Stats Panelを初期化
    const stats = new Stats();
    stats.showPanel(0); // フレームレートパネルを表示
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '10px';
    stats.dom.style.left = '10px';
    stats.dom.style.zIndex = '1000';
    stats.dom.style.display = 'none'; // 初期状態では非表示
    statsRef.current = stats;
    
    // Stats PanelをDOMに追加
    if (containerRef.current) {
      containerRef.current.appendChild(stats.dom);
    }

    // LOD管理を初期化
    const lodManager = new LODManager(scene, camera, controls);
    lodManagerRef.current = lodManager;

    // ウィンドウリサイズイベント
    window.addEventListener('resize', onWindowResize);

    // アニメーションループを開始
    animate();
  };

  /**
   * ウィンドウリサイズ処理
   */
  const onWindowResize = () => {
    if (cameraRef.current && rendererRef.current) {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    }
  };

  /**
   * アニメーションループ
   */
  const animate = () => {
    animationIdRef.current = requestAnimationFrame(animate);
    
    // Stats Panelの更新
    if (statsRef.current) {
      statsRef.current.begin();
    }
    
    if (controlsRef.current) {
      controlsRef.current.update();
    }
    
    // LOD更新
    if (lodManagerRef.current) {
      lodManagerRef.current.updateLOD();
    }
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    // Stats Panelの更新終了
    if (statsRef.current) {
      statsRef.current.end();
    }
  };

  /**
   * PLYファイルを読み込む
   * @param {File} file - PLYファイル
   */
  const loadPLYFile = (file) => {
    return new Promise((resolve, reject) => {
      const loader = new PLYLoader();
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const geometry = loader.parse(event.target.result);
          createPointCloud(geometry);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
      reader.readAsText(file);
    });
  };

  /**
   * LASファイルを読み込む
   * @param {File} file - LASファイル
   */
  const loadLASFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const dataView = new DataView(arrayBuffer);

          console.log('LASファイルを読み込み中...', file.name);

          // LASファイルのヘッダーを解析
          const header = parseLASHeader(dataView);

          if (!header) {
            throw new Error('LASファイルのヘッダーが正しく解析できませんでした。');
          }

          console.log('LASヘッダー情報:', header);
          console.log(`Point Data Format: ${header.pointDataFormat}`);
          console.log(`Point Data Record Length: ${header.pointDataRecordLength}`);
          console.log(`Total Points: ${header.totalPoints}`);

          // 点群データを解析（LODシステムが自動調整）
          const points = parseLASPoints(dataView, header);

          console.log('取得した点群数:', points.length);

          if (points.length === 0) {
            throw new Error('点群データが見つかりませんでした。');
          }

          // Three.jsのジオメトリを作成
          const geometry = new THREE.BufferGeometry();

          // 位置データを設定
          const positions = new Float32Array(points.length * 3);
          const colors = new Float32Array(points.length * 3);

          for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const i3 = i * 3;

            // 位置（スケールとオフセットを適用）
            positions[i3] = point.x * header.xScale + header.xOffset;
            positions[i3 + 1] = point.y * header.yScale + header.yOffset;
            positions[i3 + 2] = point.z * header.zScale + header.zOffset;

            // 色（RGB）- 既に正規化されているのでそのまま使用
            if (point.red !== undefined && point.green !== undefined && point.blue !== undefined) {
              colors[i3] = point.red;
              colors[i3 + 1] = point.green;
              colors[i3 + 2] = point.blue;
            } else {
              // 色情報がない場合は高さに基づいて色を設定
              const normalizedHeight = (positions[i3 + 2] - header.minZ) / (header.maxZ - header.minZ);
              colors[i3] = normalizedHeight;
              colors[i3 + 1] = 1.0 - normalizedHeight;
              colors[i3 + 2] = 0.5;
            }
          }

          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

          createPointCloud(geometry);
          resolve();
        } catch (error) {
          console.error('LASファイル読み込みエラー:', error);
          reject(new Error('LASファイルの読み込みに失敗しました: ' + error.message));
        }
      };

      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * LASファイルのヘッダーを解析する
   * @param {DataView} dataView - データビュー
   * @returns {Object|null} ヘッダー情報
   */
  const parseLASHeader = (dataView) => {
    try {
      // LASファイルのマジックナンバーをチェック
      const magic = String.fromCharCode(
        dataView.getUint8(0),
        dataView.getUint8(1),
        dataView.getUint8(2),
        dataView.getUint8(3)
      );

      if (magic !== 'LASF') {
        throw new Error('有効なLASファイルではありません。');
      }

      // ヘッダー情報を読み取り
      const versionMajor = dataView.getUint8(24);
      const versionMinor = dataView.getUint8(25);

      console.log(`LASバージョン: ${versionMajor}.${versionMinor}`);

      if (versionMajor !== 1 || versionMinor > 4) {
        throw new Error(`サポートされていないLASバージョン: ${versionMajor}.${versionMinor}`);
      }

      const pointDataFormat = dataView.getUint8(104);
      const pointDataRecordLength = dataView.getUint16(105, true);
      const numberOfPointRecords = dataView.getUint32(107, true);

      // LAS 1.4では、点群数は複数の場所に記録されている
      let totalPoints = numberOfPointRecords;

      // LAS 1.4の場合、拡張された点群数フィールドもチェック
      if (versionMajor === 1 && versionMinor >= 4) {
        const extendedLow = dataView.getUint32(247, true);
        const extendedHigh = dataView.getUint32(251, true);
        const extendedNumberOfPointRecords = extendedLow + (extendedHigh * 0x100000000);

        console.log(`Extended Point Records (Low): ${extendedLow}`);
        console.log(`Extended Point Records (High): ${extendedHigh}`);
        console.log(`Extended Point Records (Total): ${extendedNumberOfPointRecords}`);

        if (extendedNumberOfPointRecords > 0) {
          totalPoints = extendedNumberOfPointRecords;
        }
      }

      console.log(`Point Data Format: ${pointDataFormat}`);
      console.log(`Point Data Record Length: ${pointDataRecordLength}`);
      console.log(`Number of Point Records (Header): ${numberOfPointRecords}`);
      console.log(`Total Points: ${totalPoints}`);

      // スケールとオフセット
      const xScale = dataView.getFloat64(131, true);
      const yScale = dataView.getFloat64(139, true);
      const zScale = dataView.getFloat64(147, true);
      const xOffset = dataView.getFloat64(155, true);
      const yOffset = dataView.getFloat64(163, true);
      const zOffset = dataView.getFloat64(171, true);

      // 境界
      const maxX = dataView.getFloat64(179, true);
      const minX = dataView.getFloat64(187, true);
      const maxY = dataView.getFloat64(195, true);
      const minY = dataView.getFloat64(203, true);
      const maxZ = dataView.getFloat64(211, true);
      const minZ = dataView.getFloat64(219, true);

      // 点データの開始位置
      const pointDataOffset = dataView.getUint32(96, true);

      console.log(`Point Data Offset: ${pointDataOffset}`);
      console.log(`Bounds: X[${minX}, ${maxX}] Y[${minY}, ${maxY}] Z[${minZ}, ${maxZ}]`);

      return {
        versionMajor,
        versionMinor,
        pointDataFormat,
        pointDataRecordLength,
        numberOfPointRecords,
        totalPoints,
        xScale,
        yScale,
        zScale,
        xOffset,
        yOffset,
        zOffset,
        maxX,
        minX,
        maxY,
        minY,
        maxZ,
        minZ,
        pointDataOffset
      };
    } catch (error) {
      console.error('LASヘッダー解析エラー:', error);
      return null;
    }
  };

  /**
   * LASファイルの点群データを解析する（LODシステム対応）
   * @param {DataView} dataView - データビュー
   * @param {Object} header - ヘッダー情報
   * @returns {Array} 点群データの配列
   */
  const parseLASPoints = (dataView, header) => {
    const points = [];
    const offset = header.pointDataOffset;
    const recordLength = header.pointDataRecordLength;
    const pointDataFormat = header.pointDataFormat;

    // 大規模データの場合は初期読み込みを制限（緩和）
    const maxInitialPoints = Math.min(header.totalPoints, 5000000); // 初期は500万点まで
    const step = Math.max(1, Math.floor(header.totalPoints / maxInitialPoints));

    console.log(`点群データを読み込み中... (初期: ${maxInitialPoints}点, 全点: ${header.totalPoints}点, LODシステムで自動調整)`);
    
    // 大規模データの警告
    if (header.totalPoints > 50000000) {
      console.warn(`⚠️ 大規模データ検出: ${header.totalPoints.toLocaleString()}点`);
      console.warn('メモリ使用量が大きくなる可能性があります。LODシステムで自動最適化されます。');
    }

    for (let i = 0; i < maxInitialPoints; i += step) {
      const recordOffset = offset + (i * recordLength);

      try {
        // 位置データを読み取り（Little Endian）
        const x = dataView.getInt32(recordOffset, true);
        const y = dataView.getInt32(recordOffset + 4, true);
        const z = dataView.getInt32(recordOffset + 8, true);

        const point = { x, y, z };

        // 色情報がある場合（Point Data Format 2, 3, 5, 6, 7, 8, 10）
        if ([2, 3, 5, 6, 7, 8, 10].includes(pointDataFormat)) {
          let colorOffset = 20; // デフォルトの色情報オフセット

          // 各フォーマットでの色情報の位置を正確に設定
          switch (pointDataFormat) {
            case 2:
              colorOffset = 20; // RGB情報のオフセット（X,Y,Z,Intensity,Return,Class,ScanAngle,UserData,PointSourceID,R,G,B）
              break;
            case 3:
              colorOffset = 28; // RGB情報のオフセット（X,Y,Z,Intensity,Return,Class,ScanAngle,UserData,PointSourceID,GPS_Time,R,G,B）
              break;
            case 5:
              colorOffset = 28; // RGB情報のオフセット（X,Y,Z,Intensity,Return,Class,ScanAngle,UserData,PointSourceID,GPS_Time,R,G,B）
              break;
            case 6:
              colorOffset = 28; // RGB情報のオフセット（X,Y,Z,Intensity,Return,Class,ScanAngle,UserData,PointSourceID,GPS_Time,Red,Green,Blue）
              break;
            case 7:
              colorOffset = 28; // RGB情報のオフセット（X,Y,Z,Intensity,Return,Class,ScanAngle,UserData,PointSourceID,GPS_Time,Red,Green,Blue）
              break;
            case 8:
              colorOffset = 30; // RGB情報のオフセット（X,Y,Z,Intensity,Return,Class,ScanAngle,UserData,PointSourceID,GPS_Time,Red,Green,Blue）
              break;
            case 10:
              colorOffset = 28; // RGB情報のオフセット（X,Y,Z,Intensity,Return,Class,ScanAngle,UserData,PointSourceID,GPS_Time,Red,Green,Blue）
              break;
          }

          if (recordOffset + colorOffset + 6 < dataView.byteLength) {
            // 16ビットの色情報を読み取り
            const red = dataView.getUint16(recordOffset + colorOffset, true);
            const green = dataView.getUint16(recordOffset + colorOffset + 2, true);
            const blue = dataView.getUint16(recordOffset + colorOffset + 4, true);
            
            // 色情報を正規化（0-1の範囲に変換）
            point.red = red / 65535.0;
            point.green = green / 65535.0;
            point.blue = blue / 65535.0;
            
            // デバッグ用：最初の数点の色情報をログ出力
            if (i < 10) {
              console.log(`点 ${i}: オフセット${colorOffset} RGB(${red}, ${green}, ${blue}) -> 正規化(${point.red.toFixed(3)}, ${point.green.toFixed(3)}, ${point.blue.toFixed(3)})`);
            }
          } else {
            // 色情報が読み取れない場合のデバッグ情報
            if (i < 10) {
              console.log(`点 ${i}: 色情報が読み取れません (オフセット: ${colorOffset}, レコード長: ${recordLength})`);
            }
          }
        }

        points.push(point);

        // 進捗表示（10万点ごと）
        if (i > 0 && i % 100000 === 0) {
          console.log(`読み込み進捗: ${i}/${maxPoints} 点`);
        }
      } catch (error) {
        console.warn(`点 ${i} の読み込みに失敗:`, error);
        break;
      }
    }

    console.log(`点群データ読み込み完了: ${points.length} 点`);
    return points;
  };

  /**
   * LOD管理クラス
   * カメラ距離に基づいて適切なLODレベルを決定し、点群の詳細度を制御します。
   */
  class LODManager {
    constructor(scene, camera, controls) {
      this.scene = scene;
      this.camera = camera;
      this.controls = controls;
      this.lodLevels = [
        { maxDistance: 50, pointLimit: 2000000, step: 1 },    // 最高詳細度（200万点）
        { maxDistance: 100, pointLimit: 1000000, step: 2 },  // 高詳細度（100万点）
        { maxDistance: 200, pointLimit: 500000, step: 4 },  // 中詳細度（50万点）
        { maxDistance: 500, pointLimit: 250000, step: 8 },  // 低詳細度（25万点）
        { maxDistance: 1000, pointLimit: 100000, step: 16 }, // 最低詳細度（10万点）
        { maxDistance: Infinity, pointLimit: 50000, step: 32 } // 遠景（5万点）
      ];
      this.currentLodLevel = 0;
      this.pointCloud = null;
      this.originalGeometry = null;
      this.isUpdating = false; // 更新中のフラグ
    }

    /**
     * カメラ距離に基づいてLODレベルを更新
     */
    updateLOD() {
      if (!this.pointCloud || !this.originalGeometry || this.isUpdating) return;

      const distance = this.camera.position.distanceTo(this.controls.target);
      const newLodLevel = this.getLodLevelForDistance(distance);
      
      if (newLodLevel !== this.currentLodLevel) {
        this.currentLodLevel = newLodLevel;
        this.applyLOD().catch(error => {
          console.error('LOD更新エラー:', error);
          this.isUpdating = false;
        });
      }
    }

    /**
     * 距離に基づいてLODレベルを取得
     * @param {number} distance - カメラからの距離
     * @returns {number} LODレベル
     */
    getLodLevelForDistance(distance) {
      for (let i = 0; i < this.lodLevels.length; i++) {
        if (distance <= this.lodLevels[i].maxDistance) {
          return i;
        }
      }
      return this.lodLevels.length - 1;
    }

    /**
     * LODを適用して点群の詳細度を調整
     */
    async applyLOD() {
      if (!this.pointCloud || !this.originalGeometry || this.isUpdating) return;

      this.isUpdating = true;

      try {
        const lodConfig = this.lodLevels[this.currentLodLevel];
        const positions = this.originalGeometry.attributes.position.array;
        const colors = this.originalGeometry.attributes.color.array;
        const pointCount = positions.length / 3;
        
        // サンプリング間隔を計算
        const step = Math.max(1, Math.floor(pointCount / lodConfig.pointLimit));
        const sampledCount = Math.floor(pointCount / step);
        
        // メモリ効率を考慮してバッチ処理（大規模データ対応）
        const batchSize = 50000; // バッチサイズを増加
        const newPositions = new Float32Array(sampledCount * 3);
        const newColors = new Float32Array(sampledCount * 3);
        
        // バッチ処理で点群をサンプリング
        for (let batch = 0; batch < sampledCount; batch += batchSize) {
          const endBatch = Math.min(batch + batchSize, sampledCount);
          
          for (let i = batch; i < endBatch; i++) {
            const sourceIndex = i * step;
            const targetIndex = i * 3;
            
            // 位置データをコピー
            newPositions[targetIndex] = positions[sourceIndex * 3];
            newPositions[targetIndex + 1] = positions[sourceIndex * 3 + 1];
            newPositions[targetIndex + 2] = positions[sourceIndex * 3 + 2];
            
            // 色データをコピー
            if (colors.length > 0) {
              newColors[targetIndex] = colors[sourceIndex * 3];
              newColors[targetIndex + 1] = colors[sourceIndex * 3 + 1];
              newColors[targetIndex + 2] = colors[sourceIndex * 3 + 2];
            }
          }
          
          // メモリ圧迫を防ぐため、バッチごとに少し待機
          if (batch % (batchSize * 5) === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
        
        // 新しいジオメトリを作成
        const newGeometry = new THREE.BufferGeometry();
        newGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
        if (colors.length > 0) {
          newGeometry.setAttribute('color', new THREE.BufferAttribute(newColors, 3));
        }
        
        // 点群を更新
        this.pointCloud.geometry.dispose();
        this.pointCloud.geometry = newGeometry;
        
        // 距離を計算してログ出力
        const distance = this.camera.position.distanceTo(this.controls.target);
        console.log(`LOD更新: レベル${this.currentLodLevel}, 距離${distance.toFixed(2)}, 点数${sampledCount}`);
        
      } catch (error) {
        console.error('LOD更新エラー:', error);
      } finally {
        this.isUpdating = false;
      }
    }

    /**
     * 点群を設定
     * @param {THREE.Points} pointCloud - 点群オブジェクト
     */
    setPointCloud(pointCloud) {
      this.pointCloud = pointCloud;
      this.originalGeometry = pointCloud.geometry.clone();
    }
  }

  /**
   * 点群を作成する
   * @param {THREE.BufferGeometry} geometry - ジオメトリ
   */
  const createPointCloud = (geometry) => {
    // 既存の点群を削除
    if (currentPointCloudRef.current && sceneRef.current) {
      sceneRef.current.remove(currentPointCloudRef.current);
    }

    // 法線を計算
    geometry.computeVertexNormals();

    // 点群の境界を計算
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    // マテリアルを作成
    const material = new THREE.PointsMaterial({
      vertexColors: showColors,
      size: pointSize,
      transparent: true,
      opacity: opacity
    });

    // 点群を作成
    const pointCloud = new THREE.Points(geometry, material);
    currentPointCloudRef.current = pointCloud;
    sceneRef.current.add(pointCloud);

    // LOD管理に点群を設定
    if (lodManagerRef.current) {
      lodManagerRef.current.setPointCloud(pointCloud);
    }

    // カメラを点群の中心に移動
    const center = geometry.boundingSphere.center;
    const radius = geometry.boundingSphere.radius;

    cameraRef.current.position.set(
      center.x + radius * 2,
      center.y + radius * 2,
      center.z + radius * 2
    );
    controlsRef.current.target.copy(center);
    controlsRef.current.update();

    // 点群情報を保存
    const info = {
      count: geometry.attributes.position.count,
      bounds: geometry.boundingBox,
      center: center,
      radius: radius
    };
    setPointCloudInfo(info);
    onPointCloudLoaded(info);
  };

  /**
   * ビューをリセットする
   */
  const resetView = () => {
    if (currentPointCloudRef.current && sceneRef.current) {
      sceneRef.current.remove(currentPointCloudRef.current);
      currentPointCloudRef.current = null;
      setPointCloudInfo(null);

      // カメラをリセット
      cameraRef.current.position.set(0, 0, 5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  /**
   * Stats Panelの表示/非表示を切り替える
   */
  const toggleStats = () => {
    if (statsRef.current) {
      if (statsRef.current.dom.style.display === 'none') {
        statsRef.current.dom.style.display = 'block';
      } else {
        statsRef.current.dom.style.display = 'none';
      }
    }
  };

  // 親コンポーネントから呼び出せるメソッドを公開
  useImperativeHandle(ref, () => ({
    loadPointCloud: async (file) => {
      if (onLoadingChange) {
        onLoadingChange(true);
      }

      try {
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'ply') {
          await loadPLYFile(file);
        } else if (fileExtension === 'las') {
          await loadLASFile(file);
        } else {
          throw new Error('サポートされていないファイル形式です。PLYまたはLASファイルを選択してください。');
        }
      } catch (error) {
        console.error('点群データの読み込みエラー:', error);
        throw error;
      } finally {
        if (onLoadingChange) {
          onLoadingChange(false);
        }
      }
    },
    toggleStats,
    resetView
  }));

  return (
    <div 
      id="point-cloud-viewer" 
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
});

PointCloudViewer.displayName = 'PointCloudViewer';

export default PointCloudViewer;
