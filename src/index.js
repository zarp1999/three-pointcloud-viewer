import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// デバッグ用ログ
console.log('Reactアプリケーションを初期化中...');

// ReactアプリケーションをDOMにマウント
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('root要素が見つかりません');
} else {
  console.log('root要素が見つかりました');
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
  console.log('Reactアプリケーションがマウントされました');
}
