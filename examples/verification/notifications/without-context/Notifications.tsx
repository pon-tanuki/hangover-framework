import React, { useState } from "react";
import "./Notifications.css";

// --- 型定義 ---

type NotificationIcon = "info" | "success" | "warning" | "error" | "message";

interface Notification {
  id: string;
  icon: NotificationIcon;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

// --- モックデータ ---

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-001",
    icon: "message",
    title: "新しいメッセージ",
    body: "田中 美咲さんからメッセージが届きました。",
    time: "5分前",
    read: false,
  },
  {
    id: "notif-002",
    icon: "success",
    title: "注文が完了しました",
    body: "ORD-0123 の配送が完了しました。ご利用ありがとうございます。",
    time: "1時間前",
    read: false,
  },
  {
    id: "notif-003",
    icon: "warning",
    title: "ストレージ容量の警告",
    body: "使用容量が 80% を超えました。不要なファイルを削除してください。",
    time: "3時間前",
    read: false,
  },
  {
    id: "notif-004",
    icon: "info",
    title: "システムメンテナンスのお知らせ",
    body: "3月10日 02:00〜04:00 にシステムメンテナンスを実施します。",
    time: "昨日",
    read: true,
  },
  {
    id: "notif-005",
    icon: "error",
    title: "ログインに失敗しました",
    body: "不明なデバイスからのログイン試行が検出されました。心当たりがない場合はパスワードを変更してください。",
    time: "2日前",
    read: true,
  },
];

// --- アイコンコンポーネント ---

const ICON_SYMBOLS: Record<NotificationIcon, string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  error: "✕",
  message: "✉",
};

const ICON_LABELS: Record<NotificationIcon, string> = {
  info: "情報",
  success: "成功",
  warning: "警告",
  error: "エラー",
  message: "メッセージ",
};

interface NotificationIconBadgeProps {
  type: NotificationIcon;
}

const NotificationIconBadge: React.FC<NotificationIconBadgeProps> = ({ type }) => (
  <span
    className={`notif-icon notif-icon--${type}`}
    aria-label={ICON_LABELS[type]}
    role="img"
  >
    <span aria-hidden="true">{ICON_SYMBOLS[type]}</span>
  </span>
);

// --- 通知アイテムコンポーネント ---

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onDelete,
}) => {
  const { id, icon, title, body, time, read } = notification;

  return (
    <li
      className={`notif-item ${read ? "notif-item--read" : "notif-item--unread"}`}
      aria-label={`${read ? "既読" : "未読"}: ${title}`}
    >
      <div className="notif-item__icon-col">
        <NotificationIconBadge type={icon} />
      </div>
      <div className="notif-item__content">
        <div className="notif-item__header">
          <h3 className="notif-item__title">{title}</h3>
          <div className="notif-item__meta">
            {!read && (
              <span className="notif-item__unread-badge" aria-label="未読">
                未読
              </span>
            )}
            <time className="notif-item__time" dateTime={time}>
              {time}
            </time>
          </div>
        </div>
        <p className="notif-item__body">{body}</p>
        <div className="notif-item__actions">
          {!read && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => onMarkRead(id)}
              aria-label={`「${title}」を既読にする`}
            >
              既読にする
            </button>
          )}
          <button
            type="button"
            className="btn btn--ghost btn--sm btn--danger"
            onClick={() => onDelete(id)}
            aria-label={`「${title}」を削除する`}
          >
            削除
          </button>
        </div>
      </div>
    </li>
  );
};

// --- 空状態コンポーネント ---

const EmptyState: React.FC = () => (
  <div className="notif-empty" role="status" aria-live="polite">
    <span className="notif-empty__icon" aria-hidden="true">🔔</span>
    <p className="notif-empty__title">通知はありません</p>
    <p className="notif-empty__body">新しい通知が届くとここに表示されます。</p>
  </div>
);

// --- メイン通知センターコンポーネント ---

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(
    INITIAL_NOTIFICATIONS
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="notif-page">
      {/* ヘッダー */}
      <header className="notif-page__header">
        <div className="notif-page__header-inner">
          <div className="notif-page__title-wrap">
            <h1 className="notif-page__title">通知センター</h1>
            {unreadCount > 0 && (
              <span
                className="notif-page__count-badge"
                aria-label={`未読 ${unreadCount} 件`}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn--outline"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            aria-label="すべての通知を既読にする"
          >
            すべて既読にする
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="notif-page__main" id="main-content">
        <div className="notif-page__container">
          {notifications.length === 0 ? (
            <EmptyState />
          ) : (
            <section aria-labelledby="notif-list-heading">
              <h2 id="notif-list-heading" className="visually-hidden">
                通知一覧
              </h2>
              <ul className="notif-list" aria-label="通知一覧">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
