import { useState, useEffect } from 'react';
import { projectionApi, settingApi } from '../api/client';
import { formatRupiah, formatDate } from '../utils/formatters';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Calendar, Baby, TrendingUp, Clock } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

export default function Projections() {
  const [cashflow, setCashflow] = useState([]);
  const [debtFree, setDebtFree] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [cfRes, dfRes, tlRes, setRes] = await Promise.all([
        projectionApi.getCashflow({ months: 12 }),
        projectionApi.getDebtFree(),
        projectionApi.getChildTimeline(),
        settingApi.getAll(),
      ]);
      setCashflow(cfRes.data);
      setDebtFree(dfRes.data);
      setTimeline(tlRes.data);
      setSettings(setRes.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const chartData = {
    labels: cashflow.map(c => c.month),
    datasets: [
      {
        label: 'Pemasukan',
        data: cashflow.map(c => c.income),
        backgroundColor: 'rgba(0, 255, 102, 0.6)',
        borderColor: '#00FF66',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Pengeluaran',
        data: cashflow.map(c => c.expense),
        backgroundColor: 'rgba(255, 0, 85, 0.6)',
        borderColor: '#FF0055',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#A0A0A0', font: { family: 'Inter', size: 12 }, usePointStyle: true, pointStyle: 'rect' },
      },
      tooltip: {
        callbacks: { label: ctx => `${ctx.dataset.label}: ${formatRupiah(ctx.raw)}` },
        backgroundColor: '#1E1E1E',
        borderColor: '#333',
        borderWidth: 1,
        titleColor: '#A0A0A0',
        bodyColor: '#FFF',
        bodyFont: { family: 'JetBrains Mono' },
      },
    },
    scales: {
      x: { ticks: { color: '#666', font: { size: 11 } }, grid: { color: 'rgba(51,51,51,0.3)' } },
      y: { ticks: { color: '#666', font: { family: 'JetBrains Mono', size: 11 }, callback: v => formatRupiah(v) }, grid: { color: 'rgba(51,51,51,0.3)' } },
    },
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div className="page-header"><h1 className="page-title">📈 Proyeksi & Timeline</h1></div>
        <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Proyeksi & Timeline</h1>
          <p className="page-subtitle">Analisis keuangan dan perencanaan masa depan</p>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="dashboard-section-title"><TrendingUp size={16} /> Grafik Arus Kas (12 Bulan Terakhir)</div>
        <div className="chart-container">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Global Month Selector */}
      {debtFree.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-md)' }}>
          <div style={{ background: 'var(--bg-card)', padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={14} className="text-cyan" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Waktu Proyeksi:</span>
            <select 
              className="form-select" 
              style={{ width: 'auto', padding: '2px 24px 2px 8px', fontSize: '0.85rem', height: 'auto', minHeight: 'unset', border: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer' }} 
              value={monthOffset} 
              onChange={e => setMonthOffset(Number(e.target.value))}
            >
              <option value={0} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Saat Ini</option>
              <option value={1} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Bulan Depan</option>
              <option value={2} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>2 Bulan Lagi</option>
              <option value={3} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>3 Bulan Lagi</option>
              <option value={6} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>6 Bulan Lagi</option>
              <option value={12} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>1 Tahun Lagi</option>
            </select>
          </div>
        </div>
      )}

      {/* Debt Free Analyzer */}

      {settings.monthly_income && parseInt(settings.monthly_income) > 0 && (
        <div className="card" style={{ marginBottom: 'var(--spacing-xl)', borderLeft: '4px solid var(--accent-purple)' }}>
          <div className="dashboard-section-title" style={{ marginBottom: 'var(--spacing-md)' }}>
            <TrendingUp size={16} /> Analisis Kelayakan Kredit & Cicilan Baru
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)' }}>
            Standar sehat analis keuangan: total seluruh cicilan hutang tidak boleh lebih dari 35% gaji bersih (DTI Ratio).
          </p>
          
          {(() => {
            const income = parseFloat(settings.monthly_income);
            const currentDebtLoad = debtFree.filter(d => d.remaining_installments > monthOffset).reduce((sum, d) => sum + parseFloat(d.amount), 0);
            const maxSafeLimit = income * 0.35;
            const availableCapacity = maxSafeLimit - currentDebtLoad;
            const dtiRatio = (currentDebtLoad / income) * 100;
            const isDanger = dtiRatio >= 35;

            return (
              <div className="grid grid-auto stagger-children">
                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Beban Berjalan</div>
                   <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>{formatRupiah(currentDebtLoad)}</div>
                   <div style={{ fontSize: '0.75rem', marginTop: '4px', color: isDanger ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                     {dtiRatio.toFixed(1)}% dari Pendapatan
                   </div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Batas Aman (35%)</div>
                   <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>{formatRupiah(maxSafeLimit)}</div>
                </div>
                <div style={{ background: isDanger ? 'rgba(255,0,85,0.1)' : 'rgba(0,255,102,0.1)', padding: '1rem', borderRadius: '12px', border: `1px solid ${isDanger ? 'var(--accent-red)' : 'var(--accent-green)'}` }}>
                   <div style={{ fontSize: '0.8rem', color: isDanger ? 'var(--accent-red)' : 'var(--accent-green)' }}>Kapasitas Cicilan Baru</div>
                   <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: isDanger ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 'bold' }}>
                     {availableCapacity > 0 ? `+ ${formatRupiah(availableCapacity)}` : 'Rp 0 (OVERLIMIT)'}
                   </div>
                   <div style={{ fontSize: '0.75rem', marginTop: '4px', color: isDanger ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                     {isDanger ? 'DILARANG ambil cicilan baru!' : 'Maksimal aman cicilan baru dlm per-bulan.'}
                   </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="dashboard-section-title" style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Calendar size={16} /> Kalender Bebas Cicilan
          </div>
          {debtFree.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="badge badge-amber" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                Beban Proyeksi: {formatRupiah(debtFree.filter(d => d.remaining_installments > monthOffset).reduce((sum, d) => sum + parseFloat(d.amount), 0))}
              </div>
              <div className="badge badge-red" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                Total Seluruh Sisa: {formatRupiah(debtFree.reduce((sum, d) => sum + (d.amount * d.remaining_installments), 0))}
              </div>
            </div>
          )}
        </div>
        
        {debtFree.length > 0 ? (
          <div className="grid grid-auto stagger-children">
            {debtFree.map(debt => (
              <div className="debt-card" key={debt.id} style={{ position: 'relative', overflow: 'hidden' }}>
                <div className="debt-card-progress" style={{
                  width: `${debt.progress_percentage}%`,
                  background: `linear-gradient(90deg, var(--accent-green), var(--accent-cyan))`,
                }} />
                <div className="debt-card-header" style={{ position: 'relative', zIndex: 1 }}>
                  <div className="debt-card-name">{debt.name}</div>
                  <div className="debt-card-amount">{formatRupiah(debt.amount)}/bln</div>
                </div>
                
                <div style={{ padding: '0 var(--spacing-md)', position: 'relative', zIndex: 1, marginTop: '-5px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Maksimal sisa yang harus dibayar:</div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-red)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    {formatRupiah(debt.amount * debt.remaining_installments)}
                  </div>
                </div>

                <div className="debt-card-stats" style={{ position: 'relative', zIndex: 1 }}>
                  <div className="debt-card-stat">
                    <div className="debt-card-stat-value text-green">{debt.paid_installments}</div>
                    <div className="debt-card-stat-label">Terbayar</div>
                  </div>
                  <div className="debt-card-stat">
                    <div className="debt-card-stat-value text-red">{debt.remaining_installments}</div>
                    <div className="debt-card-stat-label">Sisa bln</div>
                  </div>
                  <div className="debt-card-stat">
                    <div className="debt-card-stat-value text-cyan">{debt.progress_percentage}%</div>
                    <div className="debt-card-stat-label">Progress</div>
                  </div>
                </div>
                <div className="debt-free-date" style={{ position: 'relative', zIndex: 1 }}>
                  <Clock size={14} /> Lunas Estimasi: <strong>{formatDate(debt.estimated_free_date)}</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <Calendar size={32} />
            <div className="empty-state-text">
              Belum ada data cicilan berjalan.<br/>
              <small className="text-muted">Tambahkan tagihan dengan total bulan/tenor di menu Pengaturan untuk melihat hitung mundur pelunasan.</small>
            </div>
          </div>
        )}
      </div>

      {/* Child Timeline */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="dashboard-section-title" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <Baby size={16} /> Timeline Perkembangan Anak
        </div>
        
        {timeline.length > 0 ? (
          <div>
            {timeline.map(member => (
              <div className="timeline-member" key={member.id} style={{ marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--spacing-md)' }}>
                <div className="timeline-member-header">
                  <div className="timeline-avatar" style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))' }}>
                    {member.name.charAt(0)}
                  </div>
                  <div className="timeline-member-info">
                    <h3>{member.name}</h3>
                    <span>{member.age_display} • {member.relation}</span>
                  </div>
                </div>
                <div className="timeline-line">
                  {member.milestones?.map(ms => (
                    <div className="timeline-item" key={ms.id}>
                      <div className={`timeline-dot ${ms.is_completed || ms.is_past ? 'completed' : ms.months_until <= 12 ? 'upcoming' : 'future'}`} />
                      <div className="timeline-content">
                        <div className="timeline-content-name">{ms.name}</div>
                        <div className="timeline-content-date">
                          Usia {ms.age_display} • {formatDate(ms.target_date)}
                        </div>
                        {!ms.is_past && ms.months_until > 0 && (
                          <div className="timeline-content-countdown text-cyan">
                            {ms.months_until} bulan lagi
                          </div>
                        )}
                        {ms.is_past && (
                          <div className="timeline-content-countdown text-green">✓ Sudah lewat</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <Baby size={32} />
            <div className="empty-state-text">
              Belum ada data anak di profil keluarga.<br/>
              <small className="text-muted">Tambahkan Anggota Keluarga sebagai 'Anak' di menu Pengaturan untuk memunculkan otomatis timeline PAUD, TK, SD, dll.</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
