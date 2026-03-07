import React, { useState } from "react";
import "./Settings.css";

// --- 型定義 ---

interface ProfileState {
  displayName: string;
  email: string;
  bio: string;
}

interface NotificationState {
  emailNotification: boolean;
  pushNotification: boolean;
}

interface PasswordState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  displayName?: string;
  email?: string;
  newPassword?: string;
  confirmPassword?: string;
  currentPassword?: string;
}

// --- トグルスイッチコンポーネント ---

interface ToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ id, label, description, checked, onChange }) => (
  <div className="toggle-row">
    <div className="toggle-row__info">
      <label htmlFor={id} className="toggle-row__label">
        {label}
      </label>
      {description && (
        <p id={`${id}-desc`} className="toggle-row__description">
          {description}
        </p>
      )}
    </div>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={description ? `${id}-desc` : undefined}
      className={`toggle-switch${checked ? " toggle-switch--on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-switch__thumb" aria-hidden="true" />
      <span className="visually-hidden">{checked ? "オン" : "オフ"}</span>
    </button>
  </div>
);

// --- フォームフィールドコンポーネント ---

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ id, label, error, required, children }) => (
  <div className="form-field">
    <label htmlFor={id} className="form-field__label">
      {label}
      {required && (
        <span className="form-field__required" aria-hidden="true">
          {" "}*
        </span>
      )}
    </label>
    {children}
    {error && (
      <p id={`${id}-error`} className="form-field__error" role="alert">
        {error}
      </p>
    )}
  </div>
);

// --- メインコンポーネント ---

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<ProfileState>({
    displayName: "山田 太郎",
    email: "taro.yamada@example.com",
    bio: "",
  });

  const [notifications, setNotifications] = useState<NotificationState>({
    emailNotification: true,
    pushNotification: false,
  });

  const [passwords, setPasswords] = useState<PasswordState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};

    if (!profile.displayName.trim()) {
      errs.displayName = "表示名を入力してください。";
    }

    if (!profile.email.trim()) {
      errs.email = "メールアドレスを入力してください。";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errs.email = "有効なメールアドレスを入力してください。";
    }

    const hasPasswordInput =
      passwords.currentPassword || passwords.newPassword || passwords.confirmPassword;

    if (hasPasswordInput) {
      if (!passwords.currentPassword) {
        errs.currentPassword = "現在のパスワードを入力してください。";
      }
      if (!passwords.newPassword) {
        errs.newPassword = "新しいパスワードを入力してください。";
      } else if (passwords.newPassword.length < 8) {
        errs.newPassword = "パスワードは8文字以上で入力してください。";
      }
      if (!passwords.confirmPassword) {
        errs.confirmPassword = "確認用パスワードを入力してください。";
      } else if (passwords.newPassword !== passwords.confirmPassword) {
        errs.confirmPassword = "新しいパスワードと一致しません。";
      }
    }

    return errs;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);

    if (Object.keys(errs).length > 0) return;

    // 実際の実装ではAPIを呼び出す
    setSavedMessage("設定を保存しました。");
    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });

    setTimeout(() => setSavedMessage(null), 4000);
  };

  const handleCancel = () => {
    setProfile({ displayName: "山田 太郎", email: "taro.yamada@example.com", bio: "" });
    setNotifications({ emailNotification: true, pushNotification: false });
    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setErrors({});
    setSavedMessage(null);
  };

  return (
    <div className="settings-page">
      <a href="#main-content" className="skip-link">
        メインコンテンツへスキップ
      </a>

      {/* ヘッダー */}
      <header className="settings-page__header" role="banner">
        <div className="settings-page__header-inner">
          <div className="settings-page__logo">
            <span className="settings-page__logo-icon" aria-hidden="true">
              ◈
            </span>
            <span className="settings-page__logo-text">AdminPanel</span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main id="main-content" className="settings-page__main" tabIndex={-1}>
        <div className="settings-page__container">
          <div className="settings-page__heading-block">
            <h1 className="settings-page__title">アカウント設定</h1>
            <p className="settings-page__subtitle">
              プロフィール・通知・セキュリティの設定を管理します。
            </p>
          </div>

          {/* 保存完了メッセージ */}
          {savedMessage && (
            <div
              className="alert alert--success"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span aria-hidden="true">✓</span> {savedMessage}
            </div>
          )}

          <form
            className="settings-form"
            onSubmit={handleSave}
            noValidate
            aria-label="アカウント設定フォーム"
          >
            {/* =========================================
                プロフィールセクション
               ========================================= */}
            <section className="settings-section" aria-labelledby="profile-heading">
              <div className="settings-section__header">
                <h2 id="profile-heading" className="settings-section__title">
                  プロフィール
                </h2>
                <p className="settings-section__description">
                  公開プロフィール情報を設定します。
                </p>
              </div>

              <div className="settings-section__body">
                <Field
                  id="displayName"
                  label="表示名"
                  error={errors.displayName}
                  required
                >
                  <input
                    id="displayName"
                    type="text"
                    className={`form-input${errors.displayName ? " form-input--error" : ""}`}
                    value={profile.displayName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, displayName: e.target.value }))
                    }
                    aria-required="true"
                    aria-invalid={!!errors.displayName}
                    aria-describedby={errors.displayName ? "displayName-error" : undefined}
                    autoComplete="name"
                    placeholder="例: 山田 太郎"
                  />
                </Field>

                <Field id="email" label="メールアドレス" error={errors.email} required>
                  <input
                    id="email"
                    type="email"
                    className={`form-input${errors.email ? " form-input--error" : ""}`}
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    autoComplete="email"
                    placeholder="例: taro@example.com"
                  />
                </Field>

                <Field id="bio" label="自己紹介">
                  <textarea
                    id="bio"
                    className="form-textarea"
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, bio: e.target.value }))
                    }
                    rows={4}
                    maxLength={400}
                    placeholder="自己紹介を入力してください（任意）"
                    aria-describedby="bio-hint"
                  />
                  <p id="bio-hint" className="form-field__hint">
                    最大400文字。現在 {profile.bio.length} 文字。
                  </p>
                </Field>
              </div>
            </section>

            {/* =========================================
                通知設定セクション
               ========================================= */}
            <section className="settings-section" aria-labelledby="notification-heading">
              <div className="settings-section__header">
                <h2 id="notification-heading" className="settings-section__title">
                  通知設定
                </h2>
                <p className="settings-section__description">
                  受け取る通知の種類を選択します。
                </p>
              </div>

              <div className="settings-section__body">
                <div className="toggle-list" role="group" aria-labelledby="notification-heading">
                  <Toggle
                    id="emailNotification"
                    label="メール通知"
                    description="重要なお知らせやアクティビティをメールでお知らせします。"
                    checked={notifications.emailNotification}
                    onChange={(val) =>
                      setNotifications((n) => ({ ...n, emailNotification: val }))
                    }
                  />
                  <Toggle
                    id="pushNotification"
                    label="プッシュ通知"
                    description="ブラウザのプッシュ通知でリアルタイムにお知らせします。"
                    checked={notifications.pushNotification}
                    onChange={(val) =>
                      setNotifications((n) => ({ ...n, pushNotification: val }))
                    }
                  />
                </div>
              </div>
            </section>

            {/* =========================================
                パスワード変更セクション
               ========================================= */}
            <section className="settings-section" aria-labelledby="password-heading">
              <div className="settings-section__header">
                <h2 id="password-heading" className="settings-section__title">
                  パスワード変更
                </h2>
                <p className="settings-section__description">
                  変更する場合のみ入力してください。8文字以上を推奨します。
                </p>
              </div>

              <div className="settings-section__body">
                <Field
                  id="currentPassword"
                  label="現在のパスワード"
                  error={errors.currentPassword}
                >
                  <input
                    id="currentPassword"
                    type="password"
                    className={`form-input${errors.currentPassword ? " form-input--error" : ""}`}
                    value={passwords.currentPassword}
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, currentPassword: e.target.value }))
                    }
                    aria-invalid={!!errors.currentPassword}
                    aria-describedby={
                      errors.currentPassword ? "currentPassword-error" : undefined
                    }
                    autoComplete="current-password"
                    placeholder="現在のパスワードを入力"
                  />
                </Field>

                <Field
                  id="newPassword"
                  label="新しいパスワード"
                  error={errors.newPassword}
                >
                  <input
                    id="newPassword"
                    type="password"
                    className={`form-input${errors.newPassword ? " form-input--error" : ""}`}
                    value={passwords.newPassword}
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, newPassword: e.target.value }))
                    }
                    aria-invalid={!!errors.newPassword}
                    aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
                    autoComplete="new-password"
                    placeholder="新しいパスワードを入力（8文字以上）"
                  />
                </Field>

                <Field
                  id="confirmPassword"
                  label="新しいパスワード（確認）"
                  error={errors.confirmPassword}
                >
                  <input
                    id="confirmPassword"
                    type="password"
                    className={`form-input${errors.confirmPassword ? " form-input--error" : ""}`}
                    value={passwords.confirmPassword}
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))
                    }
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                      errors.confirmPassword ? "confirmPassword-error" : undefined
                    }
                    autoComplete="new-password"
                    placeholder="新しいパスワードを再入力"
                  />
                </Field>
              </div>
            </section>

            {/* =========================================
                アクションボタン
               ========================================= */}
            <div className="settings-actions">
              <button type="button" className="btn btn--secondary" onClick={handleCancel}>
                キャンセル
              </button>
              <button type="submit" className="btn btn--primary">
                設定を保存
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Settings;
