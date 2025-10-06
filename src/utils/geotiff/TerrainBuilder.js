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

  let minElevation = Infinity;
  let maxElevation = -Infinity;

  for (let i = 0; i < elevationData.length; i += step) {
    if (!Number.isFinite(elevationData[i])) continue;
    const value = elevationData[i];
    if (value < minElevation) minElevation = value;
    if (value > maxElevation) maxElevation = value;
  }

  const elevationRange = maxElevation - minElevation || 1;

  let vi = 0;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = y * width + x;
      const elevation = elevationData[index];
      const normalized = Number.isFinite(elevation)
        ? (elevation - minElevation) / elevationRange
        : 0;

      // y成分が高さ
      vertices[vi + 1] = Number.isFinite(elevation) ? elevation - minElevation : 0;

      // simple color ramp
      const r = normalized;
      const g = 0.6 + 0.4 * (1.0 - normalized);
      const b = 0.4 * (1.0 - normalized);
      colors.push(r, g, b);

      vi += 3;
    }
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.translate(0, 0, 0);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return { geometry, minElevation, maxElevation };
};

/**
 * 地形メッシュをシーンに追加し、カメラを調整
 */
export const createTerrainSurface = (
  scene,
  geometry,
  minElevation,
  maxElevation,
  {
    currentPointCloudRef,
    cameraRef,
    controlsRef,
    setPointCloudInfo,
    onPointCloudLoaded
  }
) => {
  if (currentPointCloudRef.current && scene) {
    scene.remove(currentPointCloudRef.current);
  }

  geometry.computeBoundingSphere();

  const material = new THREE.MeshPhongMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    shininess: 10,
    specular: new THREE.Color(0x333333)
  });

  const terrainMesh = new THREE.Mesh(geometry, material);
  currentPointCloudRef.current = terrainMesh;
  scene.add(terrainMesh);

  const center = geometry.boundingSphere.center;
  const radius = geometry.boundingSphere.radius;

  if (cameraRef.current && controlsRef.current) {
    const camera = cameraRef.current;
    camera.position.set(center.x, radius * 1.2, radius * 1.8);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  }

  const info = {
    type: 'terrain',
    count: geometry.attributes.position.count,
    bounds: geometry.boundingBox,
    center,
    radius,
    minElevation,
    maxElevation
  };

  setPointCloudInfo && setPointCloudInfo(info);
  onPointCloudLoaded && onPointCloudLoaded(info);
};


