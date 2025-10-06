import * as THREE from 'three';

/**
 * GeoTIFF標高配列からPlaneGeometryベースの地形メッシュを生成
 */
export const createTerrainMesh = (elevationData, width, height, bbox, step = 1) => {
  const minX = bbox[0];
  const minY = bbox[1];
  const maxX = bbox[2];
  const maxY = bbox[3];

  const newWidth = Math.floor(width / step);
  const newHeight = Math.floor(height / step);

  const geoWidth = (maxX - minX);
  const geoHeight = (maxY - minY);

  const geometry = new THREE.PlaneGeometry(
    geoWidth,
    geoHeight,
    newWidth - 1,
    newHeight - 1
  );

  geometry.rotateX(-Math.PI / 2);

  const vertices = geometry.attributes.position.array;
  const colors = [];

  // 標高データの統計を計算
  let minElevation = Infinity;
  let maxElevation = -Infinity;
  let validElevationCount = 0;

  for (let i = 0; i < elevationData.length; i += step) {
    const value = elevationData[i];
    if (Number.isFinite(value) && value !== null && value !== undefined) {
      if (value < minElevation) minElevation = value;
      if (value > maxElevation) maxElevation = value;
      validElevationCount++;
    }
  }

  // 有効な標高データがない場合のデフォルト値
  if (minElevation === Infinity || maxElevation === -Infinity) {
    minElevation = 0;
    maxElevation = 100;
    console.warn('有効な標高データが見つかりません。デフォルト値を使用します。');
  }

  const elevationRange = maxElevation - minElevation || 1;
  
  // 垂直強調係数を計算（標高範囲に基づいて調整）
  let verticalExaggeration = 1;
  if (elevationRange < 10) {
    verticalExaggeration = 20; // 平坦な地形は20倍強調
  } else if (elevationRange < 50) {
    verticalExaggeration = 10; // 丘陵地は10倍強調
  } else if (elevationRange < 200) {
    verticalExaggeration = 5;  // 山地は5倍強調
  } else if (elevationRange < 1000) {
    verticalExaggeration = 2;  // 高山地は2倍強調
  } else {
    verticalExaggeration = 1;  // 極高山地は強調なし
  }

  console.log(`標高範囲: ${minElevation.toFixed(2)}m - ${maxElevation.toFixed(2)}m (範囲: ${elevationRange.toFixed(2)}m)`);
  console.log(`垂直強調係数: ${verticalExaggeration}x`);
  console.log(`有効な標高データ数: ${validElevationCount}`);

  let vi = 0;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = y * width + x;
      const elevation = elevationData[index];
      const normalized = Number.isFinite(elevation) && elevation !== null && elevation !== undefined
        ? (elevation - minElevation) / elevationRange
        : 0;

      // 標高を垂直強調係数で強調して適用
      const exaggeratedElevation = Number.isFinite(elevation) && elevation !== null && elevation !== undefined
        ? (elevation - minElevation) * verticalExaggeration
        : 0;
      
      vertices[vi + 1] = exaggeratedElevation;

      // 地形の色を標高に基づいて計算（より自然な色分け）
      const terrainColor = getTerrainColor(normalized);
      colors.push(terrainColor.r, terrainColor.g, terrainColor.b);

      vi += 3;
    }
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.translate(0, 0, 0);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return { geometry, minElevation, maxElevation, verticalExaggeration };
};

/**
 * 標高に基づく地形色を取得（より自然な色分け）
 * @param {number} normalizedElevation - 正規化された標高 (0-1)
 * @returns {Object} RGB色オブジェクト
 */
const getTerrainColor = (normalizedElevation) => {
  // 地形の色分け（低地から高地へ）- より鮮やかで自然な色に調整
  if (normalizedElevation < 0.05) {
    // 海・湖（深い青）
    return { r: 0.1, g: 0.3, b: 0.8 };
  } else if (normalizedElevation < 0.15) {
    // 海岸・湿地（青緑）
    return { r: 0.2, g: 0.6, b: 0.7 };
  } else if (normalizedElevation < 0.3) {
    // 平地・草原（鮮やかな緑）
    return { r: 0.3, g: 0.8, b: 0.3 };
  } else if (normalizedElevation < 0.5) {
    // 丘陵（黄緑）
    return { r: 0.6, g: 0.9, b: 0.4 };
  } else if (normalizedElevation < 0.7) {
    // 山地（茶色）
    return { r: 0.7, g: 0.5, b: 0.3 };
  } else if (normalizedElevation < 0.85) {
    // 高山（薄茶色）
    return { r: 0.8, g: 0.6, b: 0.5 };
  } else {
    // 雪峰（白）
    return { r: 1.0, g: 1.0, b: 1.0 };
  }
};

/**
 * 地形メッシュをシーンに追加し、カメラを調整
 */
export const createTerrainSurface = (
  scene,
  geometry,
  minElevation,
  maxElevation,
  verticalExaggeration,
  {
    currentTerrainRef,
    cameraRef,
    controlsRef,
    setPointCloudInfo,
    onPointCloudLoaded
  }
) => {
  if (currentTerrainRef.current && scene) {
    scene.remove(currentTerrainRef.current);
  }

  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();

  // 地形のマテリアルを改善（より自然な見た目）
  const material = new THREE.MeshPhongMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    shininess: 30,
    specular: new THREE.Color(0x222222),
    shininess: 50
  });

  const terrainMesh = new THREE.Mesh(geometry, material);
  currentTerrainRef.current = terrainMesh;
  scene.add(terrainMesh);

  // 地形の境界と中心を計算
  const boundingBox = geometry.boundingBox;
  const center = geometry.boundingSphere.center;
  const radius = geometry.boundingSphere.radius;
  
  // 地形の実際の高さを計算
  const terrainHeight = boundingBox.max.y - boundingBox.min.y;
  const terrainWidth = boundingBox.max.x - boundingBox.min.x;
  const terrainDepth = boundingBox.max.z - boundingBox.min.z;

  console.log(`地形の寸法: 幅${terrainWidth.toFixed(2)}, 奥行き${terrainDepth.toFixed(2)}, 高さ${terrainHeight.toFixed(2)}`);
  console.log(`地形の中心: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);

  // カメラの位置を地形に適した位置に調整
  if (cameraRef.current && controlsRef.current) {
    const camera = cameraRef.current;
    
    // 地形の最大寸法を基準にカメラ位置を計算
    const maxDimension = Math.max(terrainWidth, terrainDepth, terrainHeight);
    const cameraDistance = maxDimension * 2.5; // 適切な距離を確保
    
    // カメラを地形の斜め上に配置
    camera.position.set(
      center.x + cameraDistance * 0.7,
      center.y + cameraDistance * 1.2,
      center.z + cameraDistance * 0.7
    );
    
    // カメラの注視点を地形の中心に設定
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
    
    console.log(`カメラ位置: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`);
    console.log(`カメラ距離: ${camera.position.distanceTo(center).toFixed(2)}`);
  }

  const info = {
    type: 'terrain',
    count: geometry.attributes.position.count,
    bounds: geometry.boundingBox,
    center,
    radius,
    minElevation,
    maxElevation,
    verticalExaggeration,
    terrainHeight,
    terrainWidth,
    terrainDepth
  };

  setPointCloudInfo && setPointCloudInfo(info);
  onPointCloudLoaded && onPointCloudLoaded(info);
};


