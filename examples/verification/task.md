# 検証タスク

## プロンプト

```
ログインフォームをReactで実装してください。
- メールアドレス入力フィールド
- パスワード入力フィールド
- ログインボタン
- 「パスワードを忘れた方はこちら」リンク
```

## 検証条件

| 条件 | コンテキスト | ディレクトリ |
|------|------------|------------|
| A | なし（LLMのデフォルト出力） | `without-context/` |
| B | あり（design-system.context.md を提供） | `with-context/` |

## 評価指標

- Token Compliance（デザイントークン準拠率）
- Component Reuse（登録コンポーネント再利用率）
- Accessibility（axe-core スキャン）
- DQS 総合スコア
