#!/usr/bin/env python3
"""
LASファイルをPLYファイルに変換するスクリプト
laspyライブラリを使用してLASファイルを読み込み、PLY形式で出力します。
"""

import laspy
import numpy as np
import sys
import os

def las_to_ply(las_file_path, ply_file_path=None):
    """
    LASファイルをPLYファイルに変換する
    
    Args:
        las_file_path (str): 入力LASファイルのパス
        ply_file_path (str): 出力PLYファイルのパス（省略時は自動生成）
    """
    try:
        # LASファイルを読み込み
        print(f"LASファイルを読み込み中: {las_file_path}")
        las = laspy.read(las_file_path)
        
        # 点群データを取得
        points = np.vstack((las.x, las.y, las.z)).transpose()
        
        # 色情報を取得（RGB）
        if hasattr(las, 'red') and hasattr(las, 'green') and hasattr(las, 'blue'):
            colors = np.vstack((las.red, las.green, las.blue)).transpose()
            # 色の値を0-1の範囲に正規化
            colors = colors / 65535.0
        else:
            # 色情報がない場合は白で設定
            colors = np.ones((len(points), 3))
        
        # 出力ファイル名を生成
        if ply_file_path is None:
            base_name = os.path.splitext(las_file_path)[0]
            ply_file_path = f"{base_name}.ply"
        
        # PLYファイルを書き込み
        print(f"PLYファイルに変換中: {ply_file_path}")
        with open(ply_file_path, 'w') as f:
            # PLYヘッダーを書き込み
            f.write("ply\n")
            f.write("format ascii 1.0\n")
            f.write(f"element vertex {len(points)}\n")
            f.write("property float x\n")
            f.write("property float y\n")
            f.write("property float z\n")
            f.write("property uchar red\n")
            f.write("property uchar green\n")
            f.write("property uchar blue\n")
            f.write("end_header\n")
            
            # 点群データを書き込み
            for i in range(len(points)):
                x, y, z = points[i]
                r, g, b = colors[i]
                f.write(f"{x:.6f} {y:.6f} {z:.6f} {int(r*255)} {int(g*255)} {int(b*255)}\n")
        
        print(f"変換完了: {ply_file_path}")
        print(f"点群数: {len(points)}")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        return False
    
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使用方法: python las_to_ply_converter.py <LASファイルパス> [PLYファイルパス]")
        sys.exit(1)
    
    las_file = sys.argv[1]
    ply_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(las_file):
        print(f"LASファイルが見つかりません: {las_file}")
        sys.exit(1)
    
    success = las_to_ply(las_file, ply_file)
    if success:
        print("変換が正常に完了しました。")
    else:
        print("変換に失敗しました。")
        sys.exit(1)
