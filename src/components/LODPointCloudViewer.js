/**
 * LOD対応点群ビューア - メインビューアコンポーネント
 * 
 * PotreeConverterで生成されたLODデータを使用して、
 * ズームレベルに応じた適応的な点群表示を実現します。
 * 
 * 主な機能:
 * - LODデータの読み込みと表示
 * - ズームレベルに応じた適応的品質調整
 * - カメラ距離に基づく詳細度制御
 * - メモリ効率的な点群表示
 */

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

/**
 * LOD対応点群ビューアコンポーネント
 * 
 * PotreeConverterで生成されたLODデータを使用して、
 * ズームレベルに応じた適応的な点群表示を実現します。
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {number} props.pointSize - 点のサイズ
 * @param {number} props.opacity - 透明度
 * @param {boolean} props.showColors - 色表示の有無
 * @param {Function} props.onPointCloudLoaded - 点群読み込み完了時のコールバック
 * @param {Function} props.onLoadingChange - ローディング状態変更時のコールバック
 */
const LODPointCloudViewer = forwardRef(({ 
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
  const [lodLevel, setLodLevel] = useState(0); // LODレベル（0-5）

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
        // ここでLODデータの読み込み処理を実装
        // 現在は基本的な点群読み込みを実装
        throw new Error('LODデータの読み込み機能は実装中です。');
      } catch (error) {
        console.error('LOD点群データの読み込みエラー:', error);
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
      id="lod-point-cloud-viewer" 
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
});

LODPointCloudViewer.displayName = 'LODPointCloudViewer';

export default LODPointCloudViewer;
