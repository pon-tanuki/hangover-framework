import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import './LoginForm.css';

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
}

function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validate(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email) {
    errors.email = 'メールアドレスを入力してください';
  } else if (!validateEmail(values.email)) {
    errors.email = '有効なメールアドレスを入力してください';
  }

  if (!values.password) {
    errors.password = 'パスワードを入力してください';
  } else if (values.password.length < 8) {
    errors.password = 'パスワードは8文字以上で入力してください';
  }

  return errors;
}

export function LoginForm() {
  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      // 実際のログイン処理をここで行う
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('ログイン成功', values.email);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <Card padding="lg" shadow="md">
        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label="ログインフォーム"
        >
          <h1 className="login-form__title">ログイン</h1>

          <div className="login-form__fields">
            <Input
              label="メールアドレス"
              type="email"
              placeholder="example@example.com"
              value={values.email}
              onChange={(value) => setValues((prev) => ({ ...prev, email: value }))}
              error={errors.email}
              disabled={isLoading}
            />

            <Input
              label="パスワード"
              type="password"
              placeholder="8文字以上"
              value={values.password}
              onChange={(value) => setValues((prev) => ({ ...prev, password: value }))}
              error={errors.password}
              disabled={isLoading}
            />
          </div>

          <div className="login-form__forgot">
            <a
              href="/forgot-password"
              className="login-form__forgot-link"
            >
              パスワードを忘れた方はこちら
            </a>
          </div>

          <Button
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={isLoading}
            onClick={() => {}}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>
      </Card>
    </main>
  );
}

export default LoginForm;
