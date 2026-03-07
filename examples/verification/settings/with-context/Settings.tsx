import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import './Settings.css';

// コンテキストあり: design-system.context.md を参照した出力
// - 登録済みコンポーネント（Button, Input, Card）を正しく使用
// - デザイントークンのみ使用（生の値なし）
// - アクセシビリティ対応済み（labelはInputコンポーネントが担保、トグルにはaria属性付与）

interface SettingsFormState {
  displayName: string;
  email: string;
  bio: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SettingsErrors {
  displayName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function Settings() {
  const [form, setForm] = useState<SettingsFormState>({
    displayName: '',
    email: '',
    bio: '',
    emailNotifications: true,
    pushNotifications: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const validate = (): SettingsErrors => {
    const newErrors: SettingsErrors = {};
    if (!form.displayName.trim()) {
      newErrors.displayName = '表示名を入力してください';
    }
    if (!form.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!form.email.includes('@')) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    if (form.newPassword || form.currentPassword || form.confirmPassword) {
      if (!form.currentPassword) {
        newErrors.currentPassword = '現在のパスワードを入力してください';
      }
      if (!form.newPassword) {
        newErrors.newPassword = '新しいパスワードを入力してください';
      } else if (form.newPassword.length < 8) {
        newErrors.newPassword = 'パスワードは8文字以上で入力してください';
      }
      if (!form.confirmPassword) {
        newErrors.confirmPassword = '確認用パスワードを入力してください';
      } else if (form.newPassword !== form.confirmPassword) {
        newErrors.confirmPassword = '新しいパスワードと一致しません';
      }
    }
    return newErrors;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSaving(true);
    try {
      // 保存処理（実際のAPIコールはここに実装）
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      displayName: '',
      email: '',
      bio: '',
      emailNotifications: true,
      pushNotifications: false,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
  };

  const handleToggle = (field: 'emailNotifications' | 'pushNotifications') => {
    setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="settings-container">
      <h1 className="settings-page-title">アカウント設定</h1>

      <form onSubmit={handleSave} className="settings-form" noValidate>

        {/* プロフィールセクション */}
        <Card padding="lg" shadow="sm">
          <section aria-labelledby="section-profile">
            <h2 id="section-profile" className="settings-section-title">プロフィール</h2>
            <p className="settings-section-desc">公開プロフィール情報を編集できます。</p>

            <div className="settings-fields">
              <Input
                label="表示名"
                type="text"
                value={form.displayName}
                onChange={(v) => setForm((prev) => ({ ...prev, displayName: v }))}
                placeholder="例: 山田 太郎"
                error={errors.displayName}
              />

              <Input
                label="メールアドレス"
                type="email"
                value={form.email}
                onChange={(v) => setForm((prev) => ({ ...prev, email: v }))}
                placeholder="example@example.com"
                error={errors.email}
              />

              <div className="settings-field">
                <label htmlFor="bio" className="settings-label">自己紹介</label>
                <textarea
                  id="bio"
                  className="settings-textarea"
                  value={form.bio}
                  onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="自己紹介を入力してください"
                  rows={4}
                  aria-describedby="bio-hint"
                />
                <p id="bio-hint" className="settings-field-hint">200文字以内で入力してください。</p>
              </div>
            </div>
          </section>
        </Card>

        {/* 通知設定セクション */}
        <Card padding="lg" shadow="sm">
          <section aria-labelledby="section-notifications">
            <h2 id="section-notifications" className="settings-section-title">通知設定</h2>
            <p className="settings-section-desc">通知の受け取り方法を設定できます。</p>

            <div className="settings-toggles">
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">メール通知</span>
                  <span className="settings-toggle-desc">重要なお知らせをメールでお届けします。</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.emailNotifications}
                  aria-label="メール通知"
                  className={`settings-toggle ${form.emailNotifications ? 'settings-toggle--on' : 'settings-toggle--off'}`}
                  onClick={() => handleToggle('emailNotifications')}
                >
                  <span className="settings-toggle-thumb" />
                </button>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">プッシュ通知</span>
                  <span className="settings-toggle-desc">ブラウザのプッシュ通知を受け取ります。</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.pushNotifications}
                  aria-label="プッシュ通知"
                  className={`settings-toggle ${form.pushNotifications ? 'settings-toggle--on' : 'settings-toggle--off'}`}
                  onClick={() => handleToggle('pushNotifications')}
                >
                  <span className="settings-toggle-thumb" />
                </button>
              </div>
            </div>
          </section>
        </Card>

        {/* パスワード変更セクション */}
        <Card padding="lg" shadow="sm">
          <section aria-labelledby="section-password">
            <h2 id="section-password" className="settings-section-title">パスワード変更</h2>
            <p className="settings-section-desc">パスワードを変更する場合のみ入力してください。</p>

            <div className="settings-fields">
              <Input
                label="現在のパスワード"
                type="password"
                value={form.currentPassword}
                onChange={(v) => setForm((prev) => ({ ...prev, currentPassword: v }))}
                placeholder="現在のパスワード"
                error={errors.currentPassword}
              />

              <Input
                label="新しいパスワード"
                type="password"
                value={form.newPassword}
                onChange={(v) => setForm((prev) => ({ ...prev, newPassword: v }))}
                placeholder="8文字以上"
                error={errors.newPassword}
              />

              <Input
                label="新しいパスワード（確認）"
                type="password"
                value={form.confirmPassword}
                onChange={(v) => setForm((prev) => ({ ...prev, confirmPassword: v }))}
                placeholder="パスワードを再入力"
                error={errors.confirmPassword}
              />
            </div>
          </section>
        </Card>

        {/* アクションボタン */}
        <div className="settings-actions">
          <Button
            variant="secondary"
            size="md"
            onClick={handleCancel}
          >
            キャンセル
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={isSaving}
          >
            変更を保存
          </Button>
        </div>

      </form>
    </div>
  );
}
