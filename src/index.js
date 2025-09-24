/**
 * 点群データビューア - エントリーポイント
 * 
 * このファイルはReactアプリケーションのエントリーポイントです。
 * アプリケーションの初期化とDOMへのマウントを行います。
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// アプリケーション初期化のログ出力
console.log('Reactアプリケーションを初期化中...');

/**
 * ReactアプリケーションをDOMにマウント
 * 
 * 1. HTMLのroot要素を取得
 * 2. 要素の存在確認
 * 3. React 18のcreateRoot APIを使用してマウント
 * 4. メインのAppコンポーネントをレンダリング
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('root要素が見つかりません');
} else {
  console.log('root要素が見つかりました');
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
  console.log('Reactアプリケーションがマウントされました');
}
