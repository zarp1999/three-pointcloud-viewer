/**
 * 点群データビューア - メインビューアコンポーネント
 * 
 * Three.jsを使用して3D点群データを表示するコアコンポーネントです。
 * LASファイルのみに対応し、大規模データの最適化機能も含みます。
 * 
 * 主な機能:
 * - LASファイルの読み込みと解析
 * - 3D点群の表示とインタラクション
 * - 品質レベル調整（LODシステム）
 * - 色情報の表示/非表示切り替え
 * - 点のサイズと透明度の調整
 */

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
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
  const raycasterRef = useRef(null);
  const mouseRef = useRef(null);

  // 点群情報の状態
  const [pointCloudInfo, setPointCloudInfo] = useState(null);

  // 距離計測機能の状態
  const [isMeasurementMode, setIsMeasurementMode] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [measurementDistance, setMeasurementDistance] = useState(null);
  const [measurementLine, setMeasurementLine] = useState(null);
  const [measurementMarkers, setMeasurementMarkers] = useState([]);
  
  // 計測モードの状態を同期するためのref
  const isMeasurementModeRef = useRef(false);
  const measurementPointsRef = useRef([]);
  const measurementLineRef = useRef(null);
  const measurementMarkersRef = useRef([]);

  // 計測モードの状態をrefに同期
  useEffect(() => {
    isMeasurementModeRef.current = isMeasurementMode;
  }, [isMeasurementMode]);

  // 計測点の状態をrefに同期
  useEffect(() => {
    measurementPointsRef.current = measurementPoints;
  }, [measurementPoints]);

  // 計測線の状態をrefに同期
  useEffect(() => {
    measurementLineRef.current = measurementLine;
  }, [measurementLine]);

  // 計測マーカーの状態をrefに同期
  useEffect(() => {
    measurementMarkersRef.current = measurementMarkers;
  }, [measurementMarkers]);

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

    // レイキャスターとマウスを初期化
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    raycasterRef.current = raycaster;
    mouseRef.current = mouse;

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

    // マウスクリックイベント
    renderer.domElement.addEventListener('click', onMouseClick);

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
   * マウスクリックイベントハンドラー
   */
  const onMouseClick = (event) => {
    console.log('マウスクリックイベント:', {
      isMeasurementMode: isMeasurementModeRef.current,
      hasPointCloud: !!currentPointCloudRef.current,
      hasCamera: !!cameraRef.current,
      hasScene: !!sceneRef.current
    });

    if (!isMeasurementModeRef.current || !currentPointCloudRef.current || !cameraRef.current || !sceneRef.current) {
      console.log('計測モードが無効または必要な参照がありません');
      return;
    }

    // マウス位置を正規化デバイス座標に変換
    const rect = event.target.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    console.log('マウス座標:', { x: mouseRef.current.x, y: mouseRef.current.y });

    // レイキャスターを更新
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // 点群との交差を計算
    const intersects = raycasterRef.current.intersectObject(currentPointCloudRef.current);
    console.log('交差点数:', intersects.length);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      console.log('選択された点:', point);
      addMeasurementPoint(point);
    } else {
      console.log('点群との交差が見つかりませんでした');
    }
  };

  /**
   * 計測点を追加
   */
  const addMeasurementPoint = (point) => {
    console.log('計測点を追加:', point);
    const currentPoints = measurementPointsRef.current;
    const newPoints = [...currentPoints, point];
    setMeasurementPoints(newPoints);
    console.log('現在の計測点数:', newPoints.length);

    // マーカーを作成
    createMeasurementMarker(point, newPoints.length);

    if (newPoints.length === 2) {
      // 2点が選択されたら距離を計算
      const distance = point.distanceTo(newPoints[0]);
      console.log('距離計算:', distance);
      setMeasurementDistance(distance);
      createMeasurementLine(newPoints[0], point);
    } else if (newPoints.length > 2) {
      // 3点目以降は最初の2点を保持
      const firstTwoPoints = [newPoints[0], newPoints[1]];
      setMeasurementPoints(firstTwoPoints);
      const distance = firstTwoPoints[1].distanceTo(firstTwoPoints[0]);
      console.log('距離計算（3点目以降）:', distance);
      setMeasurementDistance(distance);
      createMeasurementLine(firstTwoPoints[0], firstTwoPoints[1]);
    }
  };

  /**
   * 計測マーカーを作成
   */
  const createMeasurementMarker = (point, index) => {
    console.log('計測マーカーを作成:', { point, index });
    
    // 球体のジオメトリを作成（点群の点より少し大きめ）
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.9
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(point);
    
    // 番号を表示するためのスプライトを作成
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.fillRect(0, 0, 64, 64);
    context.fillStyle = '#000000';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(index.toString(), 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(point);
    sprite.position.y += 0.2; // 球体の上に表示
    sprite.scale.set(0.5, 0.5, 1);
    
    // マーカーをグループ化
    const markerGroup = new THREE.Group();
    markerGroup.add(sphere);
    markerGroup.add(sprite);
    
    // シーンに追加
    if (sceneRef.current) {
      sceneRef.current.add(markerGroup);
      setMeasurementMarkers(prev => {
        const newMarkers = [...prev, markerGroup];
        measurementMarkersRef.current = newMarkers;
        return newMarkers;
      });
    }
  };

  /**
   * 計測線を作成
   */
  const createMeasurementLine = (point1, point2) => {
    console.log('計測線を作成:', { point1, point2 });
    
    // 既存の計測線を削除
    if (measurementLine && sceneRef.current) {
      console.log('既存の計測線を削除');
      sceneRef.current.remove(measurementLine);
    }

    // 新しい計測線を作成
    const geometry = new THREE.BufferGeometry().setFromPoints([point1, point2]);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
    const line = new THREE.Line(geometry, material);
    
    console.log('新しい計測線をシーンに追加');
    setMeasurementLine(line);
    measurementLineRef.current = line;
    sceneRef.current.add(line);
  };

  /**
   * 計測モードを切り替え
   */
  const toggleMeasurementMode = () => {
    console.log('計測モード切り替え:', !isMeasurementMode);
    setIsMeasurementMode(!isMeasurementMode);
    if (!isMeasurementMode) {
      // 計測モードを開始する際に既存の計測をクリア
      console.log('計測をクリア');
      clearMeasurement();
    }
  };

  /**
   * 計測をクリア
   */
  const clearMeasurement = () => {
    console.log('計測をクリア中...');
    setMeasurementPoints([]);
    setMeasurementDistance(null);
    
    // 計測線を削除
    if (measurementLineRef.current && sceneRef.current) {
      console.log('計測線を削除');
      sceneRef.current.remove(measurementLineRef.current);
      setMeasurementLine(null);
      measurementLineRef.current = null;
    }
    
    // マーカーを削除
    if (sceneRef.current && measurementMarkersRef.current.length > 0) {
      console.log('マーカーを削除:', measurementMarkersRef.current.length);
      measurementMarkersRef.current.forEach(marker => {
        sceneRef.current.remove(marker);
      });
      setMeasurementMarkers([]);
      measurementMarkersRef.current = [];
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

          // 座標の中心を計算（ヘッダー情報から）
          const centerX = (header.maxX + header.minX) / 2;
          const centerY = (header.maxY + header.minY) / 2;
          const centerZ = (header.maxZ + header.minZ) / 2;
          
          console.log(`座標範囲: X[${header.minX}, ${header.maxX}], Y[${header.minY}, ${header.maxY}], Z[${header.minZ}, ${header.maxZ}]`);
          console.log(`座標中心: (${centerX.toFixed(3)}, ${centerY.toFixed(3)}, ${centerZ.toFixed(3)})`);

          for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const i3 = i * 3;

            // 位置（スケールとオフセットを適用）
            const worldX = point.x * header.xScale + header.xOffset;
            const worldY = point.y * header.yScale + header.yOffset;
            const worldZ = point.z * header.zScale + header.zOffset;
            
            // 座標を中心からの相対位置に変換（正規化）
            const normalizedX = worldX - centerX;
            const normalizedY = worldY - centerY;
            const normalizedZ = worldZ - centerZ;
            
            positions[i3] = normalizedX;
            positions[i3 + 1] = normalizedY;
            positions[i3 + 2] = normalizedZ;
            
            // デバッグ用：最初の数点の座標をログ出力
            if (i < 10) {
              console.log(`点 ${i}: 生データ(${point.x}, ${point.y}, ${point.z}) -> 世界座標(${worldX.toFixed(3)}, ${worldY.toFixed(3)}, ${worldZ.toFixed(3)}) -> 正規化座標(${normalizedX.toFixed(3)}, ${normalizedY.toFixed(3)}, ${normalizedZ.toFixed(3)})`);
            }

            // 色（RGB）- 既に正規化されているのでそのまま使用
            if (point.red !== undefined && point.green !== undefined && point.blue !== undefined) {
              colors[i3] = point.red;
              colors[i3 + 1] = point.green;
              colors[i3 + 2] = point.blue;
            } else {
              // 色情報がない場合は高さに基づいて色を設定
              const normalizedHeight = (normalizedZ - (header.minZ - centerZ)) / ((header.maxZ - centerZ) - (header.minZ - centerZ));
              colors[i3] = Math.max(0, Math.min(1, normalizedHeight));
              colors[i3 + 1] = Math.max(0, Math.min(1, 1.0 - normalizedHeight));
              colors[i3 + 2] = 0.5;
            }
          }

          console.log('座標正規化処理完了');
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

          console.log('点群の作成を開始...');
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

    // LODシステムが自動調整するため、全点を読み込み
    const maxPoints = header.totalPoints;
    const step = 1; // 全点を読み込み

    console.log(`点群データを読み込み中... (最大${maxPoints}点, LODシステムで自動調整)`);

    for (let i = 0; i < maxPoints; i += step) {
      const recordOffset = offset + (i * recordLength);

      // データ範囲チェック
      if (recordOffset + recordLength > dataView.byteLength) {
        console.log(`点 ${i} の読み込みに失敗: データ範囲外 (オフセット: ${recordOffset}, レコード長: ${recordLength}, データ長: ${dataView.byteLength})`);
        break;
      }

      try {
        // 位置データを読み取り（Little Endian）
        const x = dataView.getInt32(recordOffset, true);
        const y = dataView.getInt32(recordOffset + 4, true);
        const z = dataView.getInt32(recordOffset + 8, true);

        const point = { x, y, z };

        // 色情報がある場合（Point Data Format 2, 3, 5, 6, 7, 8, 10, 135）
        if ([2, 3, 5, 6, 7, 8, 10, 135].includes(pointDataFormat)) {
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
            case 135:
              colorOffset = 20; // 拡張フォーマット135の色情報オフセット（仮定）
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
        { maxDistance: 50, pointLimit: 1000000, step: 1 },    // 最高詳細度
        { maxDistance: 100, pointLimit: 500000, step: 2 },  // 高詳細度
        { maxDistance: 200, pointLimit: 250000, step: 4 },  // 中詳細度
        { maxDistance: 500, pointLimit: 100000, step: 8 },  // 低詳細度
        { maxDistance: 1000, pointLimit: 50000, step: 16 }, // 最低詳細度
        { maxDistance: Infinity, pointLimit: 25000, step: 32 } // 遠景
      ];
      this.currentLodLevel = 0;
      this.pointCloud = null;
      this.originalGeometry = null;
    }

    /**
     * カメラ距離に基づいてLODレベルを更新
     */
    updateLOD() {
      if (!this.pointCloud || !this.originalGeometry) return;

      const distance = this.camera.position.distanceTo(this.controls.target);
      const newLodLevel = this.getLodLevelForDistance(distance);
      
      if (newLodLevel !== this.currentLodLevel) {
        this.currentLodLevel = newLodLevel;
        this.applyLOD();
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
    applyLOD() {
      if (!this.pointCloud || !this.originalGeometry) return;

      const lodConfig = this.lodLevels[this.currentLodLevel];
      const positions = this.originalGeometry.attributes.position.array;
      const colors = this.originalGeometry.attributes.color.array;
      const pointCount = positions.length / 3;
      
      // サンプリング間隔を計算
      const step = Math.max(1, Math.floor(pointCount / lodConfig.pointLimit));
      const sampledCount = Math.floor(pointCount / step);
      
      // 新しい配列を作成
      const newPositions = new Float32Array(sampledCount * 3);
      const newColors = new Float32Array(sampledCount * 3);
      
      // 点群をサンプリング
      for (let i = 0; i < sampledCount; i++) {
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

    // マテリアルを作成（点のサイズを大きくして視認性を向上）
    const material = new THREE.PointsMaterial({
      vertexColors: showColors,
      size: Math.max(pointSize, 2.0), // 最小サイズを2.0に設定
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

    console.log(`点群の中心: (${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})`);
    console.log(`点群の半径: ${radius.toFixed(3)}`);

    // カメラを点群の外側に配置
    const distance = Math.max(radius * 3, 100); // 最小距離を100に設定
    cameraRef.current.position.set(
      center.x + distance,
      center.y + distance,
      center.z + distance
    );
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
    
    console.log(`カメラ位置: (${cameraRef.current.position.x.toFixed(3)}, ${cameraRef.current.position.y.toFixed(3)}, ${cameraRef.current.position.z.toFixed(3)})`);

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

        if (fileExtension === 'las') {
          await loadLASFile(file);
        } else {
          throw new Error('サポートされていないファイル形式です。LASファイルを選択してください。');
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
    resetView,
    toggleMeasurementMode,
    clearMeasurement,
    isMeasurementMode,
    measurementDistance
  }));

  return (
    <div 
      id="point-cloud-viewer" 
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    >
      {/* 計測モード表示 */}
      {isMeasurementMode && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '14px',
          zIndex: 1000
        }}>
          <div>計測モード: ON</div>
          <div>クリックして2点を選択してください</div>
          {measurementPoints.length > 0 && (
            <div>選択済み: {measurementPoints.length}/2 点</div>
          )}
          {measurementDistance !== null && (
            <div style={{ color: '#ff0000', fontWeight: 'bold' }}>
              距離: {measurementDistance.toFixed(3)} m
            </div>
          )}
        </div>
      )}
    </div>
  );
});

PointCloudViewer.displayName = 'PointCloudViewer';

export default PointCloudViewer;
