/**
 * 点群ビューアコンポーネント
 * 
 * Three.jsを使用してLASおよびPLYファイルの点群データを表示します。
 * CesiumJSビューアと組み合わせて使用し、シンプルで高速な表示を提供します。
 * 
 * 主な機能:
 * - LAS/PLYファイルの読み込み
 * - Three.jsでの点群表示
 * - Stats Panel表示
 * - カメラ操作
 * - 点のサイズ・透明度・色表示の制御
 */

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

/**
 * 点群ビューアコンポーネント
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

  // 点群情報の状態
  const [pointCloudInfo, setPointCloudInfo] = useState(null);

  /**
   * Three.jsシーンの初期化
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

    // ライトを追加
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Stats Panelを初期化
    const stats = new Stats();
    stats.dom.style.display = 'none';
    statsRef.current = stats;

    // Stats PanelをDOMに追加
    if (containerRef.current) {
      containerRef.current.appendChild(stats.dom);
    }

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
  const loadPLYFile = async (file) => {
    console.log(`PLYファイルを読み込み中: ${file.name}`);
    
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

      reader.onerror = () => {
        reject(new Error('ファイルの読み込みに失敗しました'));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * LASファイルを読み込む
   * @param {File} file - LASファイル
   */
  const loadLASFile = async (file) => {
    console.log(`LASファイルを読み込み中: ${file.name}`);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const dataView = new DataView(arrayBuffer);
          
          // LASヘッダーを読み込み
          const header = parseLASHeader(dataView);
          console.log('LASヘッダー情報:', header);

          // 点群データを解析
          const points = await parseLASPoints(dataView, header);
          
          // Three.jsジオメトリを作成
          const geometry = new THREE.BufferGeometry();
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
              
              // デバッグ用：最初の数点の色情報をログ出力
              if (i < 5) {
                console.log(`色設定 点${i}: RGB(${point.red.toFixed(3)}, ${point.green.toFixed(3)}, ${point.blue.toFixed(3)})`);
              }
            } else {
              // 色情報がない場合は高さに基づいて色を設定
              const normalizedHeight = (positions[i3 + 2] - header.minZ) / (header.maxZ - header.minZ);
              colors[i3] = normalizedHeight;
              colors[i3 + 1] = 1.0 - normalizedHeight;
              colors[i3 + 2] = 0.5;
              
              if (i < 5) {
                console.log(`色設定 点${i}: 色情報なし、高さベース色を使用`);
              }
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

      reader.onerror = () => {
        reject(new Error('ファイルの読み込みに失敗しました'));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * LASヘッダーを解析
   * @param {DataView} dataView - データビュー
   */
  const parseLASHeader = (dataView) => {
    return {
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

    // 大規模データの場合は初期読み込みを制限（全体形状把握優先）
    const maxInitialPoints = Math.min(header.totalPoints, 2000000); // 初期は200万点まで（全体形状把握）
    const step = Math.max(1, Math.floor(header.totalPoints / maxInitialPoints));
    
    console.log(`初期表示設定: 全点${header.totalPoints.toLocaleString()}点 → 表示${maxInitialPoints.toLocaleString()}点 (ステップ: ${step})`);

    console.log(`点群データを読み込み中... (初期: ${maxInitialPoints}点, 全点: ${header.totalPoints}点, ステップ: ${step}, LODシステムで自動調整)`);
    console.log(`全体形状把握のため、均等にサンプリングして表示します`);
    
    // 大規模データの警告
    if (header.totalPoints > 50000000) {
      console.warn(`⚠️ 大規模データ検出: ${header.totalPoints.toLocaleString()}点`);
      console.warn('メモリ使用量が大きくなる可能性があります。LODシステムで自動最適化されます。');
    }

    // メモリ使用量の監視開始
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    console.log(`読み込み開始時のメモリ使用量: ${(startMemory / 1024 / 1024).toFixed(2)} MB`);

    for (let i = 0; i < maxInitialPoints; i += step) {
      const recordOffset = offset + (i * recordLength);
      
      // レコード境界チェック
      if (recordOffset + recordLength > dataView.byteLength) {
        console.warn(`レコード ${i} がファイルサイズを超えています`);
        break;
      }

      try {
        // 基本座標を読み込み
        const x = dataView.getInt32(recordOffset, true);
        const y = dataView.getInt32(recordOffset + 4, true);
        const z = dataView.getInt32(recordOffset + 8, true);

        const point = { x, y, z };

        // Point Data Format に応じて色情報を読み込み
        if (pointDataFormat >= 2) {
          let colorOffset;
          
          // Point Data Format別の色情報オフセット
          switch (pointDataFormat) {
            case 2:
              colorOffset = 20;
              break;
            case 3:
              colorOffset = 28;
              break;
            case 5:
              colorOffset = 28;
              break;
            case 6:
              colorOffset = 20;
              break;
            case 7:
              colorOffset = 28;
              break;
            case 8:
              colorOffset = 30;
              break;
            case 10:
              colorOffset = 20;
              break;
          }

          if (recordOffset + colorOffset + 6 < dataView.byteLength) {
            // 16ビットの色情報を読み取り
            const red = dataView.getUint16(recordOffset + colorOffset, true);
            const green = dataView.getUint16(recordOffset + colorOffset + 2, true);
            const blue = dataView.getUint16(recordOffset + colorOffset + 4, true);
            
            // 色情報を正規化（0-1の範囲に変換）
            // LASファイルの色情報は通常16ビット（0-65535）なので、65535で正規化
            point.red = Math.min(red / 65535.0, 1.0);
            point.green = Math.min(green / 65535.0, 1.0);
            point.blue = Math.min(blue / 65535.0, 1.0);
            
            // デバッグ用：最初の数点の色情報をログ出力
            if (i < 10) {
              console.log(`点 ${i}: オフセット${colorOffset} RGB(${red}, ${green}, ${blue}) -> 正規化(${point.red.toFixed(3)}, ${point.green.toFixed(3)}, ${point.blue.toFixed(3)})`);
              console.log(`   → 実際の色値: R=${Math.round(point.red * 255)}, G=${Math.round(point.green * 255)}, B=${Math.round(point.blue * 255)}`);
            }
          } else {
            // 色情報が読み取れない場合のデバッグ情報
            if (i < 10) {
              console.log(`点 ${i}: 色情報が読み取れません (オフセット: ${colorOffset}, レコード長: ${recordLength})`);
            }
          }
        }

        points.push(point);

        // 進捗表示（5万点ごと）
        if (i > 0 && i % 50000 === 0) {
          console.log(`読み込み進捗: ${i}/${maxInitialPoints} 点 (${((i/maxInitialPoints)*100).toFixed(1)}%)`);
        }

      } catch (error) {
        console.error(`点 ${i} の読み込みエラー:`, error);
        if (i < 1000) {
          console.warn(`初期の読み込みでエラーが発生しました。処理を中断します。`);
          break;
        }
        continue;
      }
    }

    // メモリ使用量の監視終了
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const memoryUsed = endMemory - startMemory;
    console.log(`読み込み完了時のメモリ使用量: ${(endMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`読み込みで使用したメモリ: ${(memoryUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`点群データ読み込み完了: ${points.length} 点`);
    
    return points;
  };

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
      opacity: opacity,
      sizeAttenuation: true // 距離に応じてサイズを調整
    });
    
    console.log(`点群マテリアル設定: 色表示=${showColors}, サイズ=${pointSize}, 透明度=${opacity}`);

    // 点群を作成
    const pointCloud = new THREE.Points(geometry, material);
    currentPointCloudRef.current = pointCloud;
    sceneRef.current.add(pointCloud);

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

    onPointCloudLoaded(info);
    
    console.log(`点群作成完了: ${info.count} 点`);
  };

  /**
   * ビューをリセットする
   */
  const resetView = () => {
    if (sceneRef.current && currentPointCloudRef.current) {
      sceneRef.current.remove(currentPointCloudRef.current);
      currentPointCloudRef.current = null;
    }
    
    // カメラをリセット
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 0, 5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // コンポーネントの初期化
  useEffect(() => {
    initThreeJS();
    
    return () => {
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

  // プロパティの変更を監視
  useEffect(() => {
    if (currentPointCloudRef.current) {
      const material = currentPointCloudRef.current.material;
      material.size = pointSize;
      material.needsUpdate = true;
    }
  }, [pointSize]);

  useEffect(() => {
    if (currentPointCloudRef.current) {
      const material = currentPointCloudRef.current.material;
      material.opacity = opacity;
      material.needsUpdate = true;
    }
  }, [opacity]);

  useEffect(() => {
    if (currentPointCloudRef.current) {
      const material = currentPointCloudRef.current.material;
      material.vertexColors = showColors;
      material.needsUpdate = true;
    }
  }, [showColors]);

  // 親コンポーネントから呼び出せるメソッドを公開
  useImperativeHandle(ref, () => ({
    loadPointCloud: async (file) => {
      if (file.name.toLowerCase().endsWith('.las')) {
        await loadLASFile(file);
      } else if (file.name.toLowerCase().endsWith('.ply')) {
        await loadPLYFile(file);
      } else {
        throw new Error('サポートされていないファイル形式です');
      }
    },
    resetView,
    toggleStats: () => {
      if (statsRef.current) {
        statsRef.current.dom.style.display = 
          statsRef.current.dom.style.display === 'none' ? 'block' : 'none';
      }
    }
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
