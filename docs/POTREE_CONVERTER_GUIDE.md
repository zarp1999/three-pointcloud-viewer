# PotreeConverter統合ガイド

このガイドでは、PotreeConverterを使用して大規模点群データを効率的に表示する方法を説明します。

## 1. PotreeConverterのインストール

### Windows版のダウンロード
1. [PotreeConverter GitHub](https://github.com/potree/PotreeConverter) にアクセス
2. 最新のリリースから `PotreeConverter_2.x_windows_x64.zip` をダウンロード
3. 任意のディレクトリに展開（例: `C:\PotreeConverter\`）

### 使用方法
```bash
# 基本的な変換コマンド
PotreeConverter.exe input.las -o output_directory --overwrite

# オプション付きの変換
PotreeConverter.exe input.las -o output_directory --overwrite --spacing 0.1 --format BIN

# 複数ファイルの変換
PotreeConverter.exe *.las -o output_directory --overwrite
```

## 2. 変換オプション

### 主要オプション
- `-o <OUTPUT_DIRECTORY>`: 出力ディレクトリを指定
- `--overwrite`: 既存の出力ディレクトリを上書き
- `--spacing <VALUE>`: ルートノードの初期サンプリング間隔（小さいほど詳細）
- `--format <FORMAT>`: 出力形式（BIN, LAZ, COPC）
- `--projection <EPSG_CODE>`: 座標参照系を指定（例: EPSG:2450）

### 推奨設定
```bash
# 2億点クラスの大規模データ用設定
PotreeConverter.exe large_pointcloud.las -o potree_data --overwrite --spacing 0.5 --format BIN --projection EPSG:2450
```

## 3. 出力ファイル構造

変換後、以下の構造が生成されます：
```
potree_data/
├── cloud.js              # メイン設定ファイル
├── data/                 # LODレベルごとのデータ
│   ├── r/                # ルートレベル
│   ├── r0/               # LODレベル1
│   ├── r00/              # LODレベル2
│   └── ...               # より詳細なレベル
└── libs/                 # ライブラリファイル
```

## 4. アプリケーションでの使用

### LODPointCloudViewerの使用
```javascript
// App.js でLODPointCloudViewerを使用
import LODPointCloudViewer from './components/LODPointCloudViewer';

const App = () => {
  const handleLoadPotree = async () => {
    try {
      // PotreeConverterで生成されたデータを読み込み
      await viewerRef.current.loadPointCloud('/path/to/potree_data/cloud.js');
    } catch (error) {
      console.error('Potreeデータの読み込みに失敗:', error);
    }
  };

  return (
    <div>
      <LODPointCloudViewer ref={viewerRef} />
      <button onClick={handleLoadPotree}>Potreeデータを読み込み</button>
    </div>
  );
};
```

## 5. パフォーマンス最適化

### 大規模データ用設定
- `--spacing 0.5`: 初期サンプリング間隔を0.5に設定
- `--format BIN`: バイナリ形式で効率的な読み込み
- `--projection EPSG:2450`: 適切な座標参照系を指定

### メモリ効率化
- 初期表示: 粗いサンプリングで全体形状を把握
- ズームイン: 詳細なデータを段階的に読み込み
- 視錐台外: 不要なデータを自動アンロード

## 6. トラブルシューティング

### よくある問題
1. **メモリ不足**: `--spacing`を大きくして初期サンプリングを粗くする
2. **読み込みエラー**: ファイルパスとWebサーバーの設定を確認
3. **色情報が表示されない**: LASファイルに色情報が含まれているか確認

### デバッグ方法
```javascript
// ブラウザのコンソールで確認
console.log('Potreeデータ読み込み状況:', viewerRef.current);
```

## 7. ベストプラクティス

### データ準備
1. LASファイルに色情報が含まれていることを確認
2. 適切な座標参照系を設定
3. ファイルサイズに応じて`--spacing`を調整

### パフォーマンス
1. 初期表示は粗いサンプリングで全体形状を把握
2. ユーザーの操作に応じて詳細度を段階的に向上
3. 不要なデータは即座にアンロード

これで、2億点クラスの大規模点群データでも効率的に表示できます！
