import React, { useState } from 'react';
import './LoginForm.css';

interface LoginFormProps {
  onSubmit?: (email: string, password: string) => Promise<void>;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await onSubmit?.(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">ログイン</h1>
        <p className="login-subtitle">アカウントにサインインしてください</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              className={`form-input${errors.email ? ' form-input--error' : ''}`}
              placeholder="example@example.com"
              value={email}
              onChange={handleEmailChange}
              autoComplete="email"
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
              disabled={isLoading}
            />
            {errors.email && (
              <span id="email-error" className="error-message" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              className={`form-input${errors.password ? ' form-input--error' : ''}`}
              placeholder="8文字以上"
              value={password}
              onChange={handlePasswordChange}
              autoComplete="current-password"
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
              disabled={isLoading}
            />
            {errors.password && (
              <span id="password-error" className="error-message" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
            aria-busy={isLoading}
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

export default LoginForm;
