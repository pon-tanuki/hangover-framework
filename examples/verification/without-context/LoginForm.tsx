import React, { useState } from 'react';
import './LoginForm.css';

// コンテキストなし: 典型的なAI生成コンポーネント
// - 登録済みコンポーネント（Button, Input, Card）を無視して再実装
// - 生のCSSクラスでスタイリング
// - 一部アクセシビリティ対応は行っているが不完全

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'メールアドレスを入力してください';
    if (!email.includes('@')) newErrors.email = '有効なメールアドレスを入力してください';
    if (!password) newErrors.password = 'パスワードを入力してください';
    if (password.length < 8) newErrors.password = 'パスワードは8文字以上で入力してください';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Card を再実装 */}
      <div className="login-card">
        <h1 className="login-title">ログイン</h1>
        <p className="login-subtitle">アカウントにサインインしてください</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              メールアドレス
            </label>
            {/* Input を再実装 */}
            <input
              id="email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="example@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              パスワード
            </label>
            {/* Input を再実装 */}
            <input
              id="password"
              type="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="8文字以上"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {/* Button を再実装 */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="forgot-password">
          <a href="/forgot-password">パスワードを忘れた方はこちら</a>
        </div>
      </div>
    </div>
  );
}
