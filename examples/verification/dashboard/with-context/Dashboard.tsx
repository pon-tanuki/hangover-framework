import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import './Dashboard.css';

// --- 型定義 ---

interface KpiCardData {
  title: string;
  value: string;
  trend: string;
  trendPositive: boolean;
}

interface Order {
  id: string;
  customer: string;
  amount: string;
  status: 'completed' | 'pending' | 'cancelled';
}

// --- サンプルデータ ---

const KPI_CARDS: KpiCardData[] = [
  { title: '今月の売上', value: '¥4,820,000', trend: '+12.5%', trendPositive: true },
  { title: '新規ユーザー数', value: '1,284', trend: '+8.3%', trendPositive: true },
  { title: 'コンバージョン率', value: '3.62%', trend: '-0.4%', trendPositive: false },
];

const ALL_ORDERS: Order[] = [
  { id: '#ORD-0091', customer: '田中 太郎', amount: '¥128,000', status: 'completed' },
  { id: '#ORD-0090', customer: '鈴木 花子', amount: '¥54,500', status: 'pending' },
  { id: '#ORD-0089', customer: '佐藤 一郎', amount: '¥230,000', status: 'completed' },
  { id: '#ORD-0088', customer: '山田 さくら', amount: '¥12,800', status: 'cancelled' },
  { id: '#ORD-0087', customer: '伊藤 健二', amount: '¥88,000', status: 'completed' },
  { id: '#ORD-0086', customer: '渡辺 美咲', amount: '¥44,000', status: 'pending' },
  { id: '#ORD-0085', customer: '中村 拓也', amount: '¥195,000', status: 'completed' },
  { id: '#ORD-0084', customer: '小林 奈々', amount: '¥67,000', status: 'cancelled' },
];

const PAGE_SIZE = 4;

// --- ステータスラベル ---

const STATUS_LABEL: Record<Order['status'], string> = {
  completed: '完了',
  pending: '処理中',
  cancelled: 'キャンセル',
};

// --- コンポーネント ---

interface DashboardProps {
  userName?: string;
  onLogout?: () => void;
}

export function Dashboard({ userName = '管理者', onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(ALL_ORDERS.length / PAGE_SIZE);
  const pagedOrders = ALL_ORDERS.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <div className="dashboard">
      {/* ヘッダー */}
      <header className="dashboard-header" role="banner">
        <span className="dashboard-header__logo">Dashboard</span>
        <div className="dashboard-header__user">
          <span className="dashboard-header__username" aria-label={`ログイン中: ${userName}`}>
            {userName}
          </span>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            ログアウト
          </Button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* KPIカード */}
        <section aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="dashboard-section-title">概要</h2>
          <div className="kpi-grid">
            {KPI_CARDS.map((kpi) => (
              <Card key={kpi.title} padding="lg" shadow="md">
                <p className="kpi-card__title">{kpi.title}</p>
                <p className="kpi-card__value">{kpi.value}</p>
                <p
                  className={`kpi-card__trend ${kpi.trendPositive ? 'kpi-card__trend--positive' : 'kpi-card__trend--negative'}`}
                  aria-label={`前月比 ${kpi.trend}`}
                >
                  {kpi.trend}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* 注文テーブル */}
        <section aria-labelledby="orders-heading" className="orders-section">
          <h2 id="orders-heading" className="dashboard-section-title">最近の注文</h2>
          <Card padding="sm" shadow="sm">
            <div className="table-wrapper">
              <table className="orders-table" aria-label="最近の注文一覧">
                <caption className="visually-hidden">最近の注文一覧</caption>
                <thead>
                  <tr>
                    <th scope="col">注文ID</th>
                    <th scope="col">顧客名</th>
                    <th scope="col">金額</th>
                    <th scope="col">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="orders-table__id">{order.id}</td>
                      <td>{order.customer}</td>
                      <td className="orders-table__amount">{order.amount}</td>
                      <td>
                        <span
                          className={`status-badge status-badge--${order.status}`}
                          aria-label={`ステータス: ${STATUS_LABEL[order.status]}`}
                        >
                          {STATUS_LABEL[order.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ページネーション */}
            <nav
              className="pagination"
              aria-label="注文テーブルのページネーション"
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrev}
                disabled={currentPage === 1}
              >
                前へ
              </Button>
              <span className="pagination__info" aria-live="polite" aria-atomic="true">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                次へ
              </Button>
            </nav>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
