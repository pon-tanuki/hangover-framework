import React from 'react';

// NG: AI生成コードの典型例
// - 生のCSS値を使用（トークンを無視）
// - divにonClickを使用（セマンティクス違反）
// - Cardコンポーネントを再実装
// - InputコンポーネントをlabelなしのHTMLで再実装

interface Props {
  title: string;
  description: string;
  onAction: () => void;
  email: string;
  onEmailChange: (v: string) => void;
}

export function BadComponent({ title, description, onAction, email, onEmailChange }: Props) {
  return (
    // NG: Cardを再実装。<Card>を使うべき
    <div
      style={{
        backgroundColor: '#F9FAFB',        // NG: var(--color-bg-secondary)
        border: '1px solid #E5E7EB',       // NG: var(--color-border)
        borderRadius: '8px',               // NG: var(--radius-md)
        padding: '24px',                   // NG: var(--space-400)
        fontFamily: 'Inter, sans-serif',   // NG: var(--font-family-base)
      }}
    >
      <h2 style={{ color: '#111827', fontSize: '20px', fontWeight: 600 }}>
        {title}
      </h2>
      <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '8px' }}>
        {description}
      </p>

      {/* NG: labelなしのinput。<Input label="...">を使うべき */}
      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        style={{
          border: '1px solid #D1D5DB',     // NG: var(--color-border-strong)
          borderRadius: '4px',             // NG: var(--radius-sm)
          padding: '8px 12px',             // NG: var(--space-150) var(--space-200)
          fontSize: '14px',               // NG: var(--font-size-sm)
          width: '100%',
          marginTop: '16px',              // NG: var(--space-300)
        }}
      />

      {/* NG: divにonClick。<Button>を使うべき */}
      <div
        onClick={onAction}
        style={{
          backgroundColor: '#2563EB',      // NG: var(--color-primary)
          color: '#ffffff',                // NG: var(--color-bg-primary)
          padding: '8px 16px',            // NG: var(--space-150) var(--space-300)
          borderRadius: '6px',            // NG: var(--radius-md)
          cursor: 'pointer',
          marginTop: '16px',              // NG: var(--space-300)
          display: 'inline-block',
          fontSize: '14px',              // NG: var(--font-size-sm)
        }}
      >
        実行する
      </div>
    </div>
  );
}
