# HANGOVER Framework

**H**uman **A**udit **N**ormalization for **G**enerated **O**utput, **V**erification, **E**nforcement, and **R**eview

> バイブコーディングの翌朝、あなたを救う5フェーズの品質改善プロセス。

LLM（生成AI）が生成するフロントエンドコードの品質問題を体系的に解決するツールセットです。

---

## 背景

バイブコーディングは最高の気分だ。「このフォームをいい感じにして」と言えばAIが秒でコードを書いてくれる。

翌朝、あなたは画面を見る。

- `padding: 12px`（トークンは `--space-200` のはずだった）
- `color: #2462EA`（`#2563EB` からなぜか1ビットずれている）
- `font-family: Inter`（ブランドフォントは Garamond だった）
- コントラスト比: 2.8:1（WCAG は 4.5:1 以上）

**これが AI コーディングの二日酔いだ。**

HANGOVER はこの二日酔いと体系的に戦うための5フェーズのプロセスです。

---

## インストール

```bash
npm install -g hangover-framework
```

または開発依存として追加:

```bash
npm install --save-dev hangover-framework
```

---

## クイックスタート

### 1. プロジェクト設定ファイルを作成

```json
// hangover.config.json
{
  "tokens": "src/styles/tokens.css",
  "components": "src/components/manifest.json",
  "scan": ["src/", "components/", "pages/"]
}
```

### 2. LLM向け仕様書を生成（Phase 0）

```bash
hangover compile \
  --tokens src/styles/tokens.css \
  --components src/components/manifest.json \
  --guidelines src/styles/guidelines.md \
  --output design-system.context.md
```

生成された `design-system.context.md` を `CLAUDE.md` から参照することで、LLM がデザインシステムを「知った状態」でコードを生成します。

### 3. トークン違反を検知（Phase 2）

```bash
hangover validate --tokens src/styles/tokens.css --scan src/
```

```
HANGOVER Token Validator v0.1.0

examples/test-components/BadComponent.css
  Line    4: [ERR]  background-color: #2563EB
           → var(--color-primary) = #2563EB  (confidence: 100%)
  Line    6: [ERR]  padding: 12px
           → var(--space-200) = 12px  (confidence: 100%)

Total: 11 violations  (11 errors, 0 warnings)  in 1 file(s)
Your hangover score: Critical. How did this ship?
```

### 4. 品質スコアを計算（Phase 3）

```bash
hangover dqs \
  --tokens src/styles/tokens.css \
  --scan src/ \
  --html dist/ \
  --output dqs-result.json
```

```
HANGOVER Design Quality Score
══════════════════════════════════════════════════
  DQS: 81/100  [PASS]
  █████████████████████████░░░░░
  Based on 4 of 6 dimensions

Breakdown:
──────────────────────────────────────────────────
  ✓ Token Compliance        95/100  3 errors, 1 warning
  ✓ Component Reuse         90/100  9 of 10 using registered components
  ✓ Code Structure          85/100  1 file over 200 lines
  ✗ Accessibility           55/100  1 critical, 2 serious in 3 file(s)
  - Performance              N/A   --url <url> で有効化
  - Visual Consistency       N/A   npx chromatic --project-token=<token>
```

### 5. ドリフトを追跡（Phase 5）

```bash
# セッションを記録
hangover track --dqs dqs-result.json --label "Sprint 5 PR #42"

# 履歴を表示
hangover track --report
```

```
HANGOVER Consistency Tracker
══════════════════════════════════════════════════
  Sessions tracked: 5
  Trend: █▇▆▄▂  ↓

  #    Date         DQS    Token  Struct  Reuse
   1  2026/3/1    95     100     100    100  [初期実装]
   2  2026/3/7    87      85     100     90  [Sprint 4]
   3  2026/3/14   82      75     100     85  [Sprint 5]

⚠ Drift Alert:
  Overall DQS dropped 13 points over last 3 sessions
    Token Compliance: −25 points (100 → 75)
```

---

## 効果の実証

5種類のUIで同一LLMに2条件（コンテキストなし vs あり）で実装させ、DQSスコアを比較した。

| UI | 条件A（なし） | 条件B（あり） | 改善幅 |
|----|------------|------------|--------|
| ログインフォーム | 40 [FAIL] | 100 [PASS] | +60点 |
| ダッシュボード | 39 [FAIL] | 100 [PASS] | +61点 |
| 設定ページ | 39 [FAIL] | 92 [PASS] | +53点 |
| 商品一覧 | 42 [FAIL] | 99 [PASS] | +57点 |
| 通知センター | 39 [FAIL] | 99 [PASS] | +60点 |
| **平均** | **40 [FAIL]** | **98 [PASS]** | **+58点** |

**コンテキストなし（条件A）の一様な崩壊:**
- Token Compliance: 全UIで **0/100** — 確実に生の値（`#3b82f6`, `font-family: Inter`）を使う
- Component Reuse: 全UIで **0/100** — 確実に Button/Input/Card を再実装する
- Accessibility: 平均 **100/100** — a11y は元々 LLM が自発的に担保できる領域

**コンテキストあり（条件B）の安定した改善:**
- Token Compliance: 平均 **99/100** — ほぼ完全にデザイントークンを使用
- Component Reuse: 平均 **97/100** — 登録コンポーネントをほぼ全て使用
- Code Structure: 平均 **96/100** — 元々高い水準を維持

UIの種類・複雑さに関わらず、改善効果は安定して再現した。

詳細は [`examples/verification/report.md`](examples/verification/report.md) を参照。

---

## コマンドリファレンス

```
hangover compile   --tokens <tokens.css> [--components <c.json>] [--guidelines <g.md>] [--output <out.md>]
hangover validate  --tokens <tokens.css> --scan <path> [--exit-on-error]
hangover dqs       --tokens <tokens.css> --scan <path> [--components <c.json>]
                   [--html <path>] [--url <url>] [--output <result.json>] [--threshold 80]
hangover track     --dqs <result.json> [--label "description"] [--log hangover.log.json]
hangover track     --report [--log hangover.log.json]
```

---

## 5フェーズのアーキテクチャ

```
[前夜]                              [翌朝]
バイブコーディング ─────────────────────────────────────────
     │          Phase 0      Phase 2     Phase 3     Phase 4      Phase 5
     │          飲む前に     目が覚める   被害確認    家族への     同じ過ちを
     │          水を飲む     (即時)       (CI)        説明         繰り返す
     ▼             ▼             ▼           ▼           ▼            ▼
   LLM生成     Spec          Token        DQS        Design      Consistency
   コード      Compiler      Validator    Score      Review      Tracker
```

| フェーズ | ツール | 検知タイミング | 修正コスト |
|---------|-------|-------------|----------|
| **0** | Spec Compiler | 生成前（予防） | ゼロ |
| **2** | Token Validator | 生成直後（秒） | 極小 |
| **3** | DQS | PR作成時（分） | 小 |
| **4** | Design Review | レビュー時（時間） | 中 |
| **5** | Consistency Tracker | マージ後（日〜週） | 大 |

**原則: 左で捕まえるほど安い。**

---

## Claude Code との連携

`PostToolUse` フックを使うと、Claude Code がファイルを書いた直後に自動でトークン検証が走ります。

`.claude/settings.local.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "node .claude/hooks/post-write.js" }]
      }
    ]
  }
}
```

`.claude/hooks/post-write.js` は `examples/` ディレクトリに同梱されています。

---

## CI/CD 統合

`.github/workflows/hangover.yml` をコピーして使うと、PR ごとに DQS スコアが自動投稿されます。

```yaml
- name: Run DQS
  run: |
    hangover dqs \
      --tokens src/styles/tokens.css \
      --scan src/ \
      --output dqs-result.json \
      --threshold 80
```

DQS が閾値を下回るとマージがブロックされます。

---

## サンプルデータ

`examples/` ディレクトリに動作確認用のサンプルが含まれています。

```bash
# サンプルで全コマンドを試す
hangover compile  --tokens examples/sample-design-system/tokens.css \
                  --components examples/sample-design-system/components.json \
                  --output design-system.context.md

hangover validate --tokens examples/sample-design-system/tokens.css \
                  --scan examples/test-components/

hangover dqs      --tokens examples/sample-design-system/tokens.css \
                  --components examples/sample-design-system/components.json \
                  --scan examples/test-components/BadComponent.css \
                  --html examples/test-components/BadComponent.html
```

---

## components.json フォーマット

Storybook Component Manifest 互換のJSON形式です。

```json
{
  "version": "1.0.0",
  "components": [
    {
      "name": "Button",
      "import": "@/components/Button",
      "description": "クリック可能なアクションボタン",
      "props": {
        "variant": {
          "type": "enum",
          "values": ["primary", "secondary", "ghost", "destructive"],
          "default": "primary",
          "required": false
        }
      },
      "examples": ["<Button variant=\"primary\">送信</Button>"],
      "antiPatterns": ["<div onClick={fn}>NG: divをボタン代わりに使用</div>"]
    }
  ]
}
```

---

## 調査背景

本ツールは「LLM生成フロントエンドコードの問題点」の調査レポートを元に開発されました。

[docs/research/llm-frontend-problems.md](docs/research/llm-frontend-problems.md) — 問題の根本原因・既存対策の有効性・ギャップ分析を含む調査レポート

[docs/hangover-framework.md](docs/hangover-framework.md) — フレームワークの設計思想と各フェーズの詳細説明

---

## ライセンス

MIT
