import { useState, useEffect } from 'react';
import { dashboardApi } from '../api/client';
import { formatRupiah, formatDate, getProgressColor } from '../utils/formatters';
import { Wallet, TrendingUp, TrendingDown, Bell, DollarSign, Activity } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await dashboardApi.getSummary();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="page-header"><h1 className="page-title">Dashboard</h1></div>
        <div className="dashboard-hero"><div className="skeleton" style={{ height: 60, width: 300 }} /></div>
        <div className="grid grid-4">
          {[1,2,3,4].map(i => <div key={i} className="stat-card"><div className="skeleton" style={{ height: 60 }} /></div>)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const sparklineData = {
    labels: data.sparkline?.map(s => {
      const d = new Date(s.date);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }) || [],
    datasets: [{
      data: data.sparkline?.map(s => s.amount) || [],
      borderColor: '#FF0055',
      backgroundColor: 'rgba(255, 0, 85, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: '#FF0055',
    }],
  };

  const sparklineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      callbacks: {
        label: (ctx) => formatRupiah(ctx.raw),
      },
      backgroundColor: '#1E1E1E',
      borderColor: '#333',
      borderWidth: 1,
      titleColor: '#A0A0A0',
      bodyColor: '#FFF',
      bodyFont: { family: 'JetBrains Mono' },
    }},
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="page-subtitle">Ringkasan keuangan Anda hari ini</p>
        </div>
      </div>

      {/* Hero: Daily Safe Balance */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-label">
          <Wallet size={16} /> Sisa Saldo Aman Hari Ini
        </div>
        <div className={`dashboard-hero-value ${data.daily_remaining < 0 ? 'text-red' : ''}`}
             style={{ color: data.daily_remaining < 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
          {formatRupiah(data.daily_remaining)}
        </div>
        <div className="dashboard-hero-sub">
          Jatah harian {formatRupiah(data.daily_budget)} — Terpakai{' '}
          <span>{formatRupiah(data.today_expense)}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-4 stagger-children" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="stat-card">
          <div className="stat-label"><div className="card-icon green"><TrendingUp size={18} /></div> Pemasukan</div>
          <div className="stat-value text-green">{formatRupiah(data.monthly_income)}</div>
          <div className="stat-change text-muted">Bulan ini</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><div className="card-icon red"><TrendingDown size={18} /></div> Pengeluaran</div>
          <div className="stat-value text-red">{formatRupiah(data.monthly_expense)}</div>
          <div className="stat-change text-muted">Bulan ini</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><div className="card-icon cyan"><DollarSign size={18} /></div> Net</div>
          <div className={`stat-value ${data.monthly_net >= 0 ? 'text-green' : 'text-red'}`}>
            {formatRupiah(data.monthly_net)}
          </div>
          <div className="stat-change text-muted">Bulan ini</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><div className="card-icon amber"><Activity size={18} /></div> Sampingan</div>
          <div className="stat-value text-amber">{formatRupiah(data.side_income)}</div>
          <div className="stat-change text-muted">Bulan ini</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Budget Progress */}
        <div className="card">
          <div className="dashboard-section-title">
            <TrendingUp size={16} /> Progress Anggaran Bulan Ini
          </div>
          {data.budget_progress?.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Belum ada anggaran. Atur di menu Pengaturan → Anggaran.
            </p>
          ) : (
            data.budget_progress?.map(b => (
              <div className="budget-item" key={b.id}>
                <div className="budget-item-header">
                  <div className="budget-item-name">
                    <span className="category-dot" style={{ background: b.category?.color }} />
                    {b.category?.name}
                  </div>
                  <div className="budget-item-values">
                    {formatRupiah(b.spent)} / {formatRupiah(b.limit)}
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${getProgressColor(b.percentage)}`}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upcoming Bills */}
        <div className="card">
          <div className="dashboard-section-title">
            <Bell size={16} /> Tagihan Mendatang
          </div>
          {data.upcoming_bills?.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Tidak ada tagihan dalam 7 hari ke depan. 🎉
            </p>
          ) : (
            data.upcoming_bills?.map(bill => (
              <div className="bill-item" key={bill.id}>
                <div className="bill-info">
                  <span className="bill-name">{bill.name}</span>
                  <span className="bill-category">{bill.category?.name || '-'}</span>
                </div>
                <div className="bill-right">
                  <div className="bill-amount">{formatRupiah(bill.amount)}</div>
                  <div className="bill-countdown">
                    {bill.days_until <= 0 ? 'Hari ini!' : `H-${bill.days_until}`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sparkline */}
      {data.sparkline?.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
          <div className="dashboard-section-title">
            <Activity size={16} /> Pengeluaran 7 Hari Terakhir
          </div>
          <div className="sparkline-chart">
            <Line data={sparklineData} options={sparklineOptions} />
          </div>
        </div>
      )}
    </div>
  );
}
