# デザインシステム使用ガイドライン

## 基本原則

1. **トークンを使う**: 生のCSS値（`#2563EB`, `12px`）は使用禁止。必ずCSS変数（`var(--color-primary)`, `var(--space-200)`）を使うこと
2. **登録コンポーネントを使う**: `Button`, `Input`, `Card`等の登録済みコンポーネントを優先。カスタム実装は最終手段
3. **セマンティックHTMLを使う**: `<div onClick>` ではなく `<button>` を使う
4. **アクセシビリティを確保する**: すべてのインタラクティブ要素にlabel/aria属性を付与する

## フォントについて

- ベースフォント: `var(--font-family-base)` = Garamond（ブランドフォント）
- モノスペース: `var(--font-family-mono)` = JetBrains Mono
- **禁止**: `Inter`, `Roboto`, `System UI`, `Arial`, `Helvetica` の直接指定

## 配色について

- プライマリアクション: `var(--color-primary)`
- ホバー状態: `var(--color-primary-hover)`
- 背景は `var(--color-bg-primary)` or `var(--color-bg-secondary)` を使用
- **禁止**: 白背景（`#ffffff`, `#fff`, `white`）の直接指定

## スペーシングについて

スペーシングトークンは8ptグリッドベース:

| トークン | 値 |
|---------|-----|
| `--space-50` | 2px |
| `--space-100` | 4px |
| `--space-150` | 8px |
| `--space-200` | 12px |
| `--space-300` | 16px |
| `--space-400` | 24px |
| `--space-500` | 32px |

## アクセシビリティ

- インタラクティブ要素には必ずfocusスタイルを設定
- カラーコントラスト比は最低4.5:1（通常テキスト）、3:1（大きいテキスト）
- 画像には必ずalt属性
- フォームコントロールには必ずlabel

## NG パターン集

| NG | OK |
|----|-----|
| `color: #2563EB` | `color: var(--color-primary)` |
| `padding: 16px` | `padding: var(--space-300)` |
| `font-family: Inter` | `font-family: var(--font-family-base)` |
| `border-radius: 8px` | `border-radius: var(--radius-md)` |
| `<div onClick={fn}>` | `<button onClick={fn}>` |
| `<input placeholder="...">` | `<Input label="..." ... />` |
