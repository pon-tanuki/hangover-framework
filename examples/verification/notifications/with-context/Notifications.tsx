import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import './Notifications.css';

// コンテキストあり: design-system.context.md を参照した出力
// - 登録済みコンポーネント（Button, Card）を正しく使用
// - デザイントークンのみ使用（生の値なし）
// - aria-live による動的更新のアクセシビリティ対応

// --- 型定義 ---

type NotificationIcon = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  icon: NotificationIcon;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
}

// --- サンプルデータ ---

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    icon: 'info',
    title: 'システムメンテナンスのお知らせ',
    body: '2026年3月10日（火）午前2時〜4時の間、システムメンテナンスを実施します。この間はサービスをご利用いただけません。',
    timestamp: '5分前',
    isRead: false,
  },
  {
    id: 'notif-2',
    icon: 'success',
    title: 'ファイルのエクスポートが完了しました',
    body: 'リクエストされたレポート（2026年2月分）のエクスポートが完了しました。ダウンロードリンクからご確認ください。',
    timestamp: '1時間前',
    isRead: false,
  },
  {
    id: 'notif-3',
    icon: 'warning',
    title: 'ストレージ容量が上限に近づいています',
    body: '現在の使用量がプランの上限（90%）に達しています。プランのアップグレードをご検討ください。',
    timestamp: '昨日 14:32',
    isRead: false,
  },
  {
    id: 'notif-4',
    icon: 'info',
    title: '新しいコメントが追加されました',
    body: '田中 太郎さんがプロジェクト「デザインシステム刷新」にコメントを追加しました。',
    timestamp: '2日前',
    isRead: true,
  },
  {
    id: 'notif-5',
    icon: 'error',
    title: 'データの同期に失敗しました',
    body: '外部サービスとのデータ同期中にエラーが発生しました。設定を確認し、再度お試しください。',
    timestamp: '3日前',
    isRead: true,
  },
];

// --- アイコンコンポーネント ---

const ICON_LABEL: Record<NotificationIcon, string> = {
  info: '情報',
  success: '成功',
  warning: '警告',
  error: 'エラー',
};

function NotificationIcon({ type }: { type: NotificationIcon }) {
  const symbols: Record<NotificationIcon, string> = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✕',
  };

  return (
    <span
      className={`notif-icon notif-icon--${type}`}
      role="img"
      aria-label={ICON_LABEL[type]}
    >
      {symbols[type]}
    </span>
  );
}

// --- 通知アイテムコンポーネント ---

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  return (
    <li
      className={`notif-item ${notification.isRead ? 'notif-item--read' : 'notif-item--unread'}`}
      aria-label={`${notification.isRead ? '既読' : '未読'}: ${notification.title}`}
    >
      <Card padding="md" shadow="sm">
        <div className="notif-item__inner">
          <div className="notif-item__icon-col">
            <NotificationIcon type={notification.icon} />
          </div>
          <div className="notif-item__content">
            <div className="notif-item__header">
              <h3 className="notif-item__title">{notification.title}</h3>
              {!notification.isRead && (
                <span className="notif-item__unread-badge" aria-hidden="true" />
              )}
            </div>
            <p className="notif-item__body">{notification.body}</p>
            <div className="notif-item__footer">
              <time className="notif-item__timestamp" dateTime={notification.timestamp}>
                {notification.timestamp}
              </time>
              <div className="notif-item__actions">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    既読にする
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(notification.id)}
                >
                  削除
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </li>
  );
}

// --- 空状態コンポーネント ---

function EmptyState() {
  return (
    <div className="notif-empty" role="status" aria-live="polite">
      <span className="notif-empty__icon" aria-hidden="true">🔔</span>
      <p className="notif-empty__title">通知はありません</p>
      <p className="notif-empty__body">新しい通知が届くとここに表示されます。</p>
    </div>
  );
}

// --- メインコンポーネント ---

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [statusMessage, setStatusMessage] = useState('');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setStatusMessage('通知を既読にしました');
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setStatusMessage('通知を削除しました');
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setStatusMessage('すべての通知を既読にしました');
  };

  return (
    <div className="notif-page">
      {/* スクリーンリーダー向け動的ステータス通知 */}
      <div aria-live="polite" aria-atomic="true" className="visually-hidden">
        {statusMessage}
      </div>

      <div className="notif-container">
        <header className="notif-page-header">
          <div className="notif-page-header__title-group">
            <h1 className="notif-page-header__title">通知センター</h1>
            {unreadCount > 0 && (
              <span
                className="notif-page-header__badge"
                aria-label={`未読通知 ${unreadCount} 件`}
              >
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={handleMarkAllRead}>
              すべて既読にする
            </Button>
          )}
        </header>

        <main aria-labelledby="notif-list-heading">
          <h2 id="notif-list-heading" className="visually-hidden">
            通知一覧
          </h2>

          {notifications.length === 0 ? (
            <EmptyState />
          ) : (
            <ul
              className="notif-list"
              aria-label={`通知一覧（全${notifications.length}件、未読${unreadCount}件）`}
            >
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}

export default Notifications;
