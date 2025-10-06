/**
 * Babylon.js 高さマップ地形ビューアコンポーネント
 * 
 * Babylon.jsを使用してTIFFファイルを高さマップベースの3D地形表示するコンポーネントです。
 * CreateGroundFromHeightMapを使用することで、効率的な地形表示を実現します。
 * 
 * 主な機能:
 * - TIFFファイルの読み込みと解析
 * - 高さマップベースの3D地形表示
 * - カメラコントロール
 * - 地形の高さと色の調整
 * - リアルタイムレンダリング
 */

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { fromArrayBuffer } from 'geotiff';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  DynamicTexture,
  StandardMaterial,
  Color3,
  Vector3,
  MeshBuilder,
  GroundMesh,
  Texture,
  Color4
} from '@babylonjs/core';

/**
 * Babylon.js 高さマップ地形ビューアコンポーネント
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {number} props.terrainSize - 地形のサイズ
 * @param {number} props.heightScale - 高さのスケール
 * @param {boolean} props.showWireframe - ワイヤーフレーム表示の有無
 * @param {Function} props.onTerrainLoaded - 地形読み込み完了時のコールバック
 * @param {Function} props.onLoadingChange - ローディング状態変更時のコールバック
 */
const BabylonDynamicTerrainViewer = forwardRef(({ 
  terrainSize = 200,
  heightScale = 1.0,
  showWireframe = false,
  onTerrainLoaded,
  onLoadingChange 
}, ref) => {
  // Babylon.js関連の参照
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const terrainRef = useRef(null);
  const groundRef = useRef(null);
  const heightDataRef = useRef(null);
  const animationIdRef = useRef(null);

  // 地形情報の状態
  const [terrainInfo, setTerrainInfo] = useState(null);

  /**
   * コンポーネントの初期化
   */
  useEffect(() => {
    initBabylonJS();
    return () => {
      // クリーンアップ
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  /**
   * Babylon.jsの初期化
   */
  const initBabylonJS = () => {
    if (!canvasRef.current) return;

    try {
      // エンジンの作成
      const engine = new Engine(canvasRef.current, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true
      });
      engineRef.current = engine;

      // シーンの作成
      const scene = new Scene(engine);
      sceneRef.current = scene;

      // カメラの作成
      const camera = new ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        Math.PI / 3,
        50,
        Vector3.Zero(),
        scene
      );
      camera.attachControls(canvasRef.current, true);
      cameraRef.current = camera;

      // ライティングの設定
      const hemisphericLight = new HemisphericLight("hemisphericLight", new Vector3(0, 1, 0), scene);
      hemisphericLight.intensity = 0.6;

      const directionalLight = new DirectionalLight("directionalLight", new Vector3(-1, -1, -1), scene);
      directionalLight.intensity = 0.8;
      directionalLight.position = new Vector3(20, 40, 20);

      // 背景色の設定
      scene.clearColor = new Color4(0.5, 0.8, 1.0, 1.0);

      // レンダーループの開始
      const renderLoop = () => {
        scene.render();
        animationIdRef.current = requestAnimationFrame(renderLoop);
      };
      renderLoop();

      // ウィンドウリサイズの処理
      const handleResize = () => {
        engine.resize();
      };
      window.addEventListener('resize', handleResize);

      console.log('Babylon.js 高さマップ地形ビューアが初期化されました');
    } catch (error) {
      console.error('Babylon.js の初期化に失敗しました:', error);
    }
  };

  /**
   * TIFFファイルから高さデータを読み込む
   * @param {ArrayBuffer} arrayBuffer - TIFFファイルのArrayBuffer
   */
  const loadHeightDataFromTIFF = async (arrayBuffer) => {
    try {
      onLoadingChange && onLoadingChange(true);
      
      const tiff = await fromArrayBuffer(arrayBuffer);
      const image = await tiff.getImage();
      const rasters = await image.readRasters();
      
      // 高さデータを取得（最初のバンドを使用）
      const heightData = rasters[0];
      const width = image.getWidth();
      const height = image.getHeight();
      
      console.log(`TIFFファイル読み込み完了: ${width}x${height} ピクセル`);
      
      // 高さデータを正規化（0-1の範囲）
      const minHeight = Math.min(...heightData);
      const maxHeight = Math.max(...heightData);
      const normalizedHeightData = heightData.map(h => (h - minHeight) / (maxHeight - minHeight));
      
      heightDataRef.current = {
        data: normalizedHeightData,
        width: width,
        height: height,
        minHeight: minHeight,
        maxHeight: maxHeight
      };

      return { width, height, minHeight, maxHeight };
    } catch (error) {
      console.error('TIFFファイルの読み込みに失敗しました:', error);
      throw error;
    } finally {
      onLoadingChange && onLoadingChange(false);
    }
  };

  /**
   * 高さマップベースの地形を作成する
   * @param {Object} heightData - 高さデータ
   */
  const createHeightMapTerrain = (heightData) => {
    if (!sceneRef.current || !heightData) return;

    try {
      // 既存の地形を削除
      if (terrainRef.current) {
        terrainRef.current.dispose();
      }
      if (groundRef.current) {
        groundRef.current.dispose();
      }

      // 高さマップテクスチャを作成
      const heightMapTexture = new DynamicTexture("heightMap", heightData.width, sceneRef.current);
      const context = heightMapTexture.getContext();
      
      // 高さデータをテクスチャに描画
      const imageData = context.createImageData(heightData.width, heightData.height);
      for (let i = 0; i < heightData.data.length; i++) {
        const height = heightData.data[i];
        const pixelIndex = i * 4;
        imageData.data[pixelIndex] = height * 255;     // R
        imageData.data[pixelIndex + 1] = height * 255; // G
        imageData.data[pixelIndex + 2] = height * 255; // B
        imageData.data[pixelIndex + 3] = 255;          // A
      }
      context.putImageData(imageData, 0, 0);
      heightMapTexture.update();

      // Groundメッシュを作成（高さマップを使用）
      const ground = MeshBuilder.CreateGroundFromHeightMap("terrain", heightMapTexture, {
        width: terrainSize,
        height: terrainSize,
        subdivisions: 64,
        minHeight: 0,
        maxHeight: heightScale * 10
      }, sceneRef.current);
      groundRef.current = ground;

      // マテリアルの設定
      const material = new StandardMaterial("terrainMaterial", sceneRef.current);
      material.diffuseColor = new Color3(0.4, 0.6, 0.3);
      material.specularColor = new Color3(0.2, 0.2, 0.2);
      material.wireframe = showWireframe;
      
      // 高さに基づく色分けテクスチャ
      const colorTexture = new DynamicTexture("terrainColorTexture", 512, sceneRef.current);
      const colorContext = colorTexture.getContext();
      
      // グラデーション色の生成
      for (let i = 0; i < 512; i++) {
        const gradient = colorContext.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#87CEEB'); // 空色（高い場所）
        gradient.addColorStop(0.3, '#8FBC8F'); // 緑（中程度）
        gradient.addColorStop(0.7, '#D2B48C'); // 茶色（低い場所）
        gradient.addColorStop(1, '#F4A460'); // 砂色（最も低い場所）
        
        colorContext.fillStyle = gradient;
        colorContext.fillRect(i, 0, 1, 512);
      }
      colorTexture.update();
      
      material.diffuseTexture = colorTexture;
      ground.material = material;

      terrainRef.current = ground;

      // 地形情報を設定
      const info = {
        width: heightData.width,
        height: heightData.height,
        minHeight: heightData.minHeight,
        maxHeight: heightData.maxHeight,
        terrainSize: terrainSize,
        subdivisions: 64
      };
      setTerrainInfo(info);
      onTerrainLoaded && onTerrainLoaded(info);

      console.log('高さマップ地形が作成されました');
    } catch (error) {
      console.error('高さマップ地形の作成に失敗しました:', error);
    }
  };

  /**
   * TIFFファイルを読み込んで地形を生成する
   * @param {File} file - TIFFファイル
   */
  const loadTIFFFile = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const heightData = await loadHeightDataFromTIFF(arrayBuffer);
      createHeightMapTerrain(heightDataRef.current);
    } catch (error) {
      console.error('TIFFファイルの読み込みに失敗しました:', error);
    }
  };

  /**
   * 地形の高さスケールを更新する
   * @param {number} scale - 新しい高さスケール
   */
  const updateHeightScale = (scale) => {
    if (terrainRef.current && heightDataRef.current) {
      // 高さマップテクスチャを再作成
      const heightMapTexture = new DynamicTexture("heightMap", heightDataRef.current.width, sceneRef.current);
      const context = heightMapTexture.getContext();
      
      // 高さデータをテクスチャに描画（新しいスケールで）
      const imageData = context.createImageData(heightDataRef.current.width, heightDataRef.current.height);
      for (let i = 0; i < heightDataRef.current.data.length; i++) {
        const height = heightDataRef.current.data[i];
        const pixelIndex = i * 4;
        imageData.data[pixelIndex] = height * 255;     // R
        imageData.data[pixelIndex + 1] = height * 255; // G
        imageData.data[pixelIndex + 2] = height * 255; // B
        imageData.data[pixelIndex + 3] = 255;          // A
      }
      context.putImageData(imageData, 0, 0);
      heightMapTexture.update();

      // 既存の地形を削除
      terrainRef.current.dispose();
      
      // 新しい高さスケールで地形を再作成
      const ground = MeshBuilder.CreateGroundFromHeightMap("terrain", heightMapTexture, {
        width: terrainSize,
        height: terrainSize,
        subdivisions: 64,
        minHeight: 0,
        maxHeight: scale * 10
      }, sceneRef.current);
      
      // マテリアルを適用
      const material = new StandardMaterial("terrainMaterial", sceneRef.current);
      material.diffuseColor = new Color3(0.4, 0.6, 0.3);
      material.specularColor = new Color3(0.2, 0.2, 0.2);
      material.wireframe = showWireframe;
      
      // 色分けテクスチャを適用
      const colorTexture = new DynamicTexture("terrainColorTexture", 512, sceneRef.current);
      const colorContext = colorTexture.getContext();
      
      for (let i = 0; i < 512; i++) {
        const gradient = colorContext.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#8FBC8F');
        gradient.addColorStop(0.7, '#D2B48C');
        gradient.addColorStop(1, '#F4A460');
        
        colorContext.fillStyle = gradient;
        colorContext.fillRect(i, 0, 1, 512);
      }
      colorTexture.update();
      
      material.diffuseTexture = colorTexture;
      ground.material = material;
      
      terrainRef.current = ground;
    }
  };

  /**
   * ワイヤーフレーム表示を切り替える
   * @param {boolean} wireframe - ワイヤーフレーム表示の有無
   */
  const toggleWireframe = (wireframe) => {
    if (terrainRef.current && terrainRef.current.material) {
      terrainRef.current.material.wireframe = wireframe;
    }
  };

  /**
   * ビューをリセットする
   */
  const resetView = () => {
    if (cameraRef.current) {
      cameraRef.current.setTarget(Vector3.Zero());
      cameraRef.current.alpha = -Math.PI / 2;
      cameraRef.current.beta = Math.PI / 3;
      cameraRef.current.radius = 50;
    }
  };

  /**
   * 地形をクリアする
   */
  const clearTerrain = () => {
    if (terrainRef.current) {
      terrainRef.current.dispose();
      terrainRef.current = null;
    }
    if (groundRef.current) {
      groundRef.current.dispose();
      groundRef.current = null;
    }
    heightDataRef.current = null;
    setTerrainInfo(null);
  };

  // 親コンポーネントから呼び出せるメソッドを公開
  useImperativeHandle(ref, () => ({
    loadTIFFFile,
    updateHeightScale,
    toggleWireframe,
    resetView,
    clearTerrain,
    get terrainInfo() { return terrainInfo; }
  }));

  return (
    <div className="babylon-viewer-container">
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block',
          outline: 'none'
        }}
      />
    </div>
  );
});

export default BabylonDynamicTerrainViewer;
