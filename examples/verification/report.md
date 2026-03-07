# 効果検証レポート: HANGOVERフレームワーク

## 概要

同一タスク「ログインフォームをReactで実装してください」を2条件で実装し、DQSスコアを比較した。

**タスク:**
```
ログインフォームをReactで実装してください。
- メールアドレス入力フィールド
- パスワード入力フィールド
- ログインボタン
- 「パスワードを忘れた方はこちら」リンク
```

---

## 結果サマリー

3条件で比較した。条件B-手動は理想値の上限として、条件B-LLMはサブエージェント（Claude）に実際にコンテキストを与えて生成させた実測値。

```
                        条件A（なし）  条件B-手動（上限）  条件B-LLM生成（実測）
DQS 総合スコア             42/100           91/100              91/100
Token Compliance           0/100          100/100             100/100
Component Reuse            0/100           67/100              57/100
Code Structure            97/100           97/100              97/100
Accessibility             85/100           95/100             100/100
```

| 指標 | 条件A（なし） | 条件B-手動（上限） | 条件B-LLM生成（実測） | A→LLM改善幅 |
|------|------------|-----------------|-------------------|------------|
| **DQS 総合** | **42/100 [FAIL]** | **91/100 [PASS]** | **91/100 [PASS]** | **+49点** |
| Token Compliance | 0/100 | 100/100 | 100/100 | +100点 |
| Component Reuse | 0/100 | 67/100 | 57/100 | +57点 |
| Code Structure | 97/100 | 97/100 | 97/100 | ±0点 |
| Accessibility | 85/100 | 95/100 | **100/100** | +15点 |

**注目点:** LLM生成（実測）が手動（理想値）と同点の91点に到達。Accessibilityは手動を上回り100点満点。

---

## 条件A（コンテキストなし）の問題点

### Token Compliance: 0/100（20エラー、7警告）

典型的なトークン捏造パターン:

| LLMが生成した値 | 正しいトークン |
|----------------|---------------|
| `font-family: Inter, -apple-system, sans-serif` | `var(--font-family-base)` = Garamond |
| `color: #111827` | `var(--color-text-primary)` |
| `color: #6b7280` | `var(--color-text-secondary)` |
| `color: #3b82f6` | `var(--color-primary)` ※値も違う（#2563EB）|
| `padding: 40px` | `var(--space-600)` = 48px |
| `border-radius: 12px` | `var(--radius-lg)` |
| `border-radius: 8px` | `var(--radius-md)` |
| `font-size: 24px` | `var(--font-size-2xl)` |
| `font-size: 14px` | `var(--font-size-sm)` |

特に深刻なのが **フォントの差異**。ブランドフォントが Garamond（セリフ体）であるにもかかわらず、LLMはInterというサンセリフ体を選択した。これはデザインの根幹に関わる問題であり、Token Validatorがなければスペルミスのような形で気づかれないまま蓄積される。

また、`#3b82f6`（Tailwindのblue-500）が使われていたが、プロジェクトのprimaryは `#2563EB`（blue-600相当）であり、**1ビットずれた色**がハードコードされていた。

### Component Reuse: 0/100

Button、Input、Cardの3つの登録コンポーネントが存在するにもかかわらず、全て再実装。

```tsx
// 条件A: ButtonをHTMLで再実装
<button type="submit" className="login-button" disabled={isLoading}>
  {isLoading ? 'ログイン中...' : 'ログイン'}
</button>

// 条件A: InputをHTMLで再実装
<input
  id="email"
  type="email"
  className={`form-input ${errors.email ? 'error' : ''}`}
  ...
/>
```

### Accessibility: 85/100（1 serious、1 moderate）

- `<html>` タグに `lang` 属性なし（serious）
- フォームのロール・ランドマーク設定不足（moderate）

---

## 条件B（コンテキストあり）の改善内容

### Token Compliance: 100/100（違反ゼロ）

全ての値をデザイントークンで記述:

```css
/* 条件B: トークンを正しく使用 */
background-color: var(--color-bg-tertiary);
font-family: var(--font-family-base);   /* Garamond */
font-size: var(--font-size-2xl);
color: var(--color-text-primary);
margin-bottom: var(--space-500);
```

### Component Reuse: 67/100（4/6コンポーネント使用）

```tsx
// 条件B: 登録コンポーネントを使用
<Card padding="lg" shadow="lg">
  <Input label="メールアドレス" type="email" value={email} onChange={setEmail} error={errors.email} />
  <Input label="パスワード" type="password" value={password} onChange={setPassword} error={errors.password} />
  <Button variant="primary" size="lg" loading={isLoading}>ログイン</Button>
</Card>
```

Button・Input・Cardをそれぞれ1回ずつ使用（4コンポーネント使用）。残り2つはHTMLのform要素とaタグで、代替可能な登録コンポーネントがないため妥当。

### Accessibility: 95/100（1 moderate）

- `<html lang="ja">` で言語を明示
- `aria-required="true"` で必須フィールドを明示
- Inputコンポーネントがlabelとinputのひも付けを自動担保

残るmoderate（`<form>`のaria-label未設定）はコンポーネントレベルの改善で対処可能。

---

## 条件B-LLM生成の実装分析

サブエージェント（Claude）にデザインシステムコンテキストを与えて生成させた実測コード。

### Token Compliance: 100/100（条件Aから完全改善）

コンテキストを与えることで、生成されるCSSは完全にトークンのみに。

```css
/* LLM生成: 全てvar()で記述 */
background-color: var(--color-bg-tertiary);
font-family: var(--font-family-base);
color: var(--color-text-primary);
gap: var(--space-400);
```

### Component Reuse: 57/100（手動67より低い）

LLMはButton・Input・Cardの3コンポーネントを使用したが、7つのHTML要素中4つが登録コンポーネント。手動より生の要素が多かった（`<form>`、`<a>`、さらに `<div>` など）。コンポーネントカタログに登録されていない要素については、適切にHTMLを選択した。

### Accessibility: 100/100（手動の95を超えた）

LLMがコンテキストのa11y要件を積極的に解釈し、手動より高い品質を実現:
- `<html lang="ja">` 付与
- `<form aria-label="ログインフォーム">` でフォームのランドマーク化
- `aria-describedby` でエラーメッセージをinputに紐付け
- `role="alert"` + `aria-live="polite"` でエラーの動的通知
- `autocomplete` 属性を適切に設定

これは手動実装では見落としていたaria属性群で、コンテキストの「Every form control needs a label」ルールをLLMが積極的に拡張解釈した結果。

---

## 考察

### 最大の問題はToken Compliance

DQSの差（+49点）の大部分はToken Compliance（0→100）とComponent Reuse（0→67）に起因する。Code Structureは両条件でほぼ同等であり、LLMはコードの「構造的な品質」は比較的保てるが、**デザインシステムとの整合性**は明示的なコンテキストなしでは保てない。

### ブランドフォントの置き換えは自動検知が必須

条件Aではブランドフォント（Garamond）がInterに置き換わっていた。視覚的には「悪くない」ため人間のレビューでも見落とされやすい。Token Validatorが `font-family: Inter` を即座に検出し `var(--font-family-base)` への修正を促すことで、初回生成直後に修正できる。

### セッション間ドリフトの防止

今回は単一フォームの検証だったが、実際のプロジェクトでは複数セッションにわたって類似のコードが生成される。条件Aのパターンが蓄積すると:

- ファイルAでは `padding: 40px`
- ファイルBでは `padding: 12px`
- ファイルCでは `padding: var(--space-300)` （たまたま正しい）

という不整合が広がり、「3チームが作ったように見える」状態になる。HANGOVERのConsistency Trackerはこのドリフトを時系列で検知する。

---

## 結論

HANGOVERフレームワーク（Phase 0: Spec Compiler）により、同一タスクに対してDQSスコアが **42点 → 91点（+49点）** 改善した。

**特筆すべき点:** コンテキストを与えたLLM生成コード（実測）が手動の理想実装と同点（91点）に到達。Accessibilityにいたっては手動（95点）を上回り100点満点を記録した。

```
DQS改善（条件A → 条件B-LLM生成）: 42 → 91 (+49点, +117%)

内訳:
  Token Compliance   0 → 100  (+100点)  ブランドフォント・カラートークン適用
  Component Reuse    0 →  57  ( +57点)  Button/Input/Card登録コンポーネント活用
  Accessibility     85 → 100  ( +15点)  aria属性・フォームランドマーク付与
  Code Structure    97 →  97  (  ±0点)  コード構造は元から良好
```

デザインシステムの仕様をLLMに「知らせる」だけで、デザイン二日酔いの主要因（トークン捏造・コンポーネント再実装・a11y欠如）を一括して防止できる。

---

## 検証環境

- 日付: 2026-03-07
- ツール: HANGOVER Framework v0.1.0
- LLM: Claude Sonnet 4.6（サブエージェント）
- デザインシステム: `examples/sample-design-system/`
- 条件A（コンテキストなし）: `examples/verification/without-context/`
- 条件B-手動（上限値）: `examples/verification/with-context/`
- 条件B-LLM生成（実測）: `examples/verification/with-context-llm/`
