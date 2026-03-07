import React, { useState } from "react";
import "./Dashboard.css";

// --- 型定義 ---

interface KpiCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

interface Order {
  id: string;
  customer: string;
  amount: number;
  status: "completed" | "pending" | "cancelled";
}

// --- モックデータ ---

const ORDERS: Order[] = [
  { id: "ORD-001", customer: "山田 太郎", amount: 12800, status: "completed" },
  { id: "ORD-002", customer: "佐藤 花子", amount: 5400, status: "pending" },
  { id: "ORD-003", customer: "鈴木 一郎", amount: 23100, status: "completed" },
  { id: "ORD-004", customer: "田中 美咲", amount: 8700, status: "cancelled" },
  { id: "ORD-005", customer: "伊藤 健太", amount: 15600, status: "completed" },
  { id: "ORD-006", customer: "渡辺 奈々", amount: 3200, status: "pending" },
  { id: "ORD-007", customer: "中村 翔太", amount: 41000, status: "completed" },
  { id: "ORD-008", customer: "小林 さくら", amount: 9800, status: "pending" },
  { id: "ORD-009", customer: "加藤 隆", amount: 7300, status: "cancelled" },
  { id: "ORD-010", customer: "松本 由紀", amount: 18500, status: "completed" },
  { id: "ORD-011", customer: "井上 浩二", amount: 6100, status: "completed" },
  { id: "ORD-012", customer: "木村 あやか", amount: 29000, status: "pending" },
];

const ORDERS_PER_PAGE = 5;

const STATUS_LABELS: Record<Order["status"], string> = {
  completed: "完了",
  pending: "保留中",
  cancelled: "キャンセル",
};

// --- KPIカードコンポーネント ---

const KpiCard: React.FC<KpiCardProps> = ({ title, value, trend, trendUp }) => (
  <article className="kpi-card" aria-label={title}>
    <p className="kpi-card__title">{title}</p>
    <p className="kpi-card__value">{value}</p>
    {trend && (
      <p
        className={`kpi-card__trend kpi-card__trend--${trendUp ? "up" : "down"}`}
        aria-label={`前月比 ${trend}`}
      >
        <span aria-hidden="true">{trendUp ? "▲" : "▼"}</span> {trend}
      </p>
    )}
  </article>
);

// --- メインダッシュボードコンポーネント ---

const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [username] = useState("管理者 太郎");

  const totalPages = Math.ceil(ORDERS.length / ORDERS_PER_PAGE);
  const pageStart = (currentPage - 1) * ORDERS_PER_PAGE;
  const visibleOrders = ORDERS.slice(pageStart, pageStart + ORDERS_PER_PAGE);

  const handleLogout = () => {
    // 実際の実装ではセッションクリアなどを行う
    alert("ログアウトしました");
  };

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <div className="dashboard">
      {/* ヘッダー */}
      <header className="dashboard__header">
        <div className="dashboard__header-inner">
          <div className="dashboard__logo">
            <span className="dashboard__logo-icon" aria-hidden="true">◈</span>
            <span className="dashboard__logo-text">AdminPanel</span>
          </div>
          <div className="dashboard__header-user">
            <span className="dashboard__username" aria-label={`ログイン中: ${username}`}>
              {username}
            </span>
            <button
              type="button"
              className="btn btn--outline"
              onClick={handleLogout}
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="dashboard__main" id="main-content">
        <div className="dashboard__container">

          {/* KPIセクション */}
          <section aria-labelledby="kpi-heading">
            <h2 id="kpi-heading" className="section-title">今月のサマリー</h2>
            <div className="kpi-grid">
              <KpiCard
                title="今月の売上"
                value="¥2,480,000"
                trend="+12.5%"
                trendUp={true}
              />
              <KpiCard
                title="新規ユーザー数"
                value="1,284 人"
                trend="+8.3%"
                trendUp={true}
              />
              <KpiCard
                title="コンバージョン率"
                value="3.67%"
                trend="-0.4%"
                trendUp={false}
              />
            </div>
          </section>

          {/* 注文テーブルセクション */}
          <section aria-labelledby="orders-heading">
            <h2 id="orders-heading" className="section-title">最近の注文</h2>
            <div className="table-wrapper">
              <table className="orders-table" aria-label="最近の注文一覧">
                <thead>
                  <tr>
                    <th scope="col">注文ID</th>
                    <th scope="col">顧客名</th>
                    <th scope="col">金額</th>
                    <th scope="col">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="orders-table__id">{order.id}</td>
                      <td>{order.customer}</td>
                      <td className="orders-table__amount">
                        ¥{order.amount.toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`status-badge status-badge--${order.status}`}
                          aria-label={`ステータス: ${STATUS_LABELS[order.status]}`}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ページネーション */}
            <nav className="pagination" aria-label="注文一覧のページネーション">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handlePrev}
                disabled={currentPage === 1}
                aria-label="前のページへ"
              >
                ← 前へ
              </button>
              <span className="pagination__info" aria-live="polite" aria-atomic="true">
                {currentPage} / {totalPages} ページ
              </span>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                aria-label="次のページへ"
              >
                次へ →
              </button>
            </nav>
          </section>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
