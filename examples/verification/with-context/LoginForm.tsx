import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import './LoginForm.css';

// コンテキストあり: design-system.context.md を参照した出力
// - 登録済みコンポーネント（Button, Input, Card）を正しく使用
// - デザイントークンのみ使用（生の値なし）
// - アクセシビリティ対応済み（labelはInputコンポーネントが担保）

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
    else if (!email.includes('@')) newErrors.email = '有効なメールアドレスを入力してください';
    if (!password) newErrors.password = 'パスワードを入力してください';
    else if (password.length < 8) newErrors.password = 'パスワードは8文字以上で入力してください';
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
      <Card padding="lg" shadow="lg">
        <h1 className="login-title">ログイン</h1>
        <p className="login-subtitle">アカウントにサインインしてください</p>

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="メールアドレス"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="example@example.com"
            error={errors.email}
          />

          <Input
            label="パスワード"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="8文字以上"
            error={errors.password}
          />

          <Button
            variant="primary"
            size="lg"
            loading={isLoading}
          >
            ログイン
          </Button>
        </form>

        <div className="forgot-password">
          <a href="/forgot-password">パスワードを忘れた方はこちら</a>
        </div>
      </Card>
    </div>
  );
}
