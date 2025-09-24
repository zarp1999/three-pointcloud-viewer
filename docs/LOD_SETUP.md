# LOD (Level of Detail) システムのセットアップ

## 概要

大規模な点群データを効率的に表示するために、PotreeConverterを使用してLODデータを生成し、Three.jsで適応的に表示するシステムです。

## 必要なツール

### 1. PotreeConverter のインストール

```bash
# Python環境が必要
pip install potreeconverter
```

### 2. 使用方法

```bash
# 基本的な変換
potreeconverter input.las -o output_directory

# 詳細オプション付き
potreeconverter input.las -o output_directory --spacing 0.1 --levels 5 --format LAS
```

### 3. オプション説明

- `--spacing`: 点群の間隔（メートル）
- `--levels`: LODレベル数（デフォルト: 5）
- `--format`: 出力形式（LAS, PLY, XYZ）
- `--output-format`: 出力ファイル形式（LAS, PLY, XYZ）

## LODデータの構造

```
output_directory/
├── metadata.json          # メタデータ
├── hierarchy.bin         # 階層構造
├── octree.bin           # オクツリー構造
└── points.bin           # 点群データ
```

## Three.js での実装

### 1. LODPointCloudViewer の使用

```javascript
import LODPointCloudViewer from './components/LODPointCloudViewer';

// コンポーネントの使用
<LODPointCloudViewer
  ref={viewerRef}
  pointSize={pointSize}
  opacity={opacity}
  showColors={showColors}
  onPointCloudLoaded={handlePointCloudLoaded}
  onLoadingChange={handleLoadingChange}
/>
```

### 2. LOD管理クラス

```javascript
class LODManager {
  constructor(scene, camera, controls) {
    this.lodLevels = [
      { maxDistance: 50, pointLimit: 1000000, step: 1 },    // 最高詳細度
      { maxDistance: 100, pointLimit: 500000, step: 2 },  // 高詳細度
      { maxDistance: 200, pointLimit: 250000, step: 4 },  // 中詳細度
      { maxDistance: 500, pointLimit: 100000, step: 8 },  // 低詳細度
      { maxDistance: 1000, pointLimit: 50000, step: 16 }, // 最低詳細度
      { maxDistance: Infinity, pointLimit: 25000, step: 32 } // 遠景
    ];
  }
}
```

## パフォーマンス最適化

### 1. カメラ距離に基づくLOD調整

- **近距離**: 高詳細度（全点表示）
- **中距離**: 中詳細度（サンプリング）
- **遠距離**: 低詳細度（大幅サンプリング）

### 2. メモリ管理

- 不要なLODレベルは自動的にアンロード
- 必要なLODレベルのみをメモリに保持
- ガベージコレクションの最適化

### 3. レンダリング最適化

- フラスタムカリング
- 視錐台カリング
- 背面カリング

## 実装の流れ

1. **PotreeConverterでLODデータ生成**
2. **LODPointCloudViewerコンポーネントの実装**
3. **カメラ距離に基づくLOD調整**
4. **パフォーマンス監視とStats Panel**

## 注意事項

- 大規模データの変換には時間がかかります
- 十分なディスク容量を確保してください
- メモリ使用量に注意してください

## 参考リンク

- [PotreeConverter GitHub](https://github.com/potree/PotreeConverter)
- [Potree Documentation](https://github.com/potree/potree)
- [Three.js LOD Examples](https://threejs.org/examples/)
