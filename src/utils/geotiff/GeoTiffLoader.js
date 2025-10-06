import { fromArrayBuffer } from 'geotiff';

/**
 * GeoTIFFを読み込み、標高配列とメタデータを返す
 */
export const loadGeoTiff = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const tiff = await fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();

  const width = image.getWidth();
  const height = image.getHeight();
  const rasters = await image.readRasters();
  const elevationArray = rasters[0];

  const bbox = image.getBoundingBox();
  const modelPixelScale = image.getFileDirectory().ModelPixelScale || null;
  const modelTiepoint = image.getFileDirectory().ModelTiepoint || null;

  return {
    image,
    width,
    height,
    elevationArray,
    bbox,
    modelPixelScale,
    modelTiepoint
  };
};


