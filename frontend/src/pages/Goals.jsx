import { useState, useEffect } from 'react';
import { goalApi, allocationApi } from '../api/client';
import { formatRupiah, formatDate, getGoalTypeLabel, getGoalTypeColor } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { Plus, Trash2, Edit3, PiggyBank, Zap, Target } from 'lucide-react';

export default function Goals() {
  const toast = useToast();
  const [goals, setGoals] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [goalForm, setGoalForm] = useState({ name: '', type: 'custom', target_amount: '', deadline: '', color: '#00D4FF' });
  const [depositForm, setDepositForm] = useState({ amount: '', note: '' });
  const [distributeAmount, setDistributeAmount] = useState('');
  const [distributeNote, setDistributeNote] = useState('');
  const [allocationForm, setAllocationForm] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [goalsRes, allocRes] = await Promise.all([goalApi.getAll(), allocationApi.getAll()]);
      setGoals(goalsRes.data);
      setAllocations(allocRes.data);
      setAllocationForm(goalsRes.data.map(g => ({
        goal_id: g.id,
        name: g.name,
        percentage: allocRes.data.find(a => a.goal_id === g.id)?.percentage || 0,
      })));
    } catch (e) {} finally { setLoading(false); }
  };

  const handleSaveGoal = async () => {
    try {
      const payload = { ...goalForm, target_amount: parseFloat(goalForm.target_amount) };
      if (editId) {
        await goalApi.update(editId, payload);
        toast.success('Target diperbarui');
      } else {
        await goalApi.create(payload);
        toast.success('Target baru ditambahkan');
      }
      setShowGoalModal(false);
      setEditId(null);
      setGoalForm({ name: '', type: 'custom', target_amount: '', deadline: '', color: '#00D4FF' });
      loadData();
    } catch (e) { toast.error('Gagal menyimpan'); }
  };

  const handleDeposit = async () => {
    try {
      await goalApi.deposit(selectedGoal.id, { amount: parseFloat(depositForm.amount), note: depositForm.note });
      toast.success('Setoran berhasil');
      setShowDepositModal(false);
      setDepositForm({ amount: '', note: '' });
      loadData();
    } catch (e) { toast.error('Gagal menyetor'); }
  };

  const handleDistribute = async () => {
    try {
      const res = await goalApi.distribute({ amount: parseFloat(distributeAmount), note: distributeNote });
      toast.success(`Distribusi berhasil: ${res.data.distributions?.length || 0} target`);
      setShowDistributeModal(false);
      setDistributeAmount('');
      setDistributeNote('');
      loadData();
    } catch (e) { toast.error(e.response?.data?.message || 'Gagal'); }
  };

  const handleSaveAllocations = async () => {
    try {
      const rules = allocationForm.filter(a => a.percentage > 0).map(a => ({ goal_id: a.goal_id, percentage: parseFloat(a.percentage) }));
      await allocationApi.sync({ rules });
      toast.success('Aturan alokasi disimpan');
      loadData();
    } catch (e) { toast.error(e.response?.data?.message || 'Gagal menyimpan'); }
  };

  const handleDeleteGoal = async (id) => {
    if (!confirm('Hapus target ini?')) return;
    try {
      await goalApi.delete(id);
      toast.success('Target dihapus');
      loadData();
    } catch (e) { toast.error('Gagal menghapus'); }
  };

  const totalAllocation = allocationForm.reduce((sum, a) => sum + (parseFloat(a.percentage) || 0), 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎯 Kantong Target</h1>
          <p className="page-subtitle">Sisihkan uang untuk tujuan masa depan</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button className="btn btn-ghost" onClick={() => setShowDistributeModal(true)}>
            <Zap size={16} /> Distribusi
          </button>
          <button className="btn btn-primary" onClick={() => { setEditId(null); setGoalForm({ name: '', type: 'custom', target_amount: '', deadline: '', color: '#00D4FF' }); setShowGoalModal(true); }}>
            <Plus size={16} /> Target Baru
          </button>
        </div>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-auto stagger-children" style={{ marginBottom: 'var(--spacing-xl)' }}>
        {loading ? (
          [1,2,3].map(i => <div key={i} className="goal-card"><div className="skeleton" style={{height:150}} /></div>)
        ) : goals.length === 0 ? (
          <div className="card" style={{gridColumn:'1/-1', textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>
            <Target size={48} style={{opacity:0.3, marginBottom:'1rem'}} />
            <p>Belum ada target. Buat target pertama Anda!</p>
          </div>
        ) : (
          goals.map(goal => (
            <div className="goal-card" key={goal.id} style={{ borderTop: `3px solid ${goal.color}` }}>
              <div className="goal-card-header">
                <div>
                  <div className="goal-card-name">{goal.name}</div>
                  {goal.deadline && <div className="goal-card-deadline">Target: {formatDate(goal.deadline)}</div>}
                </div>
                <span className="goal-card-type badge" style={{ background: getGoalTypeColor(goal.type) + '20', color: getGoalTypeColor(goal.type) }}>
                  {getGoalTypeLabel(goal.type)}
                </span>
              </div>

              <div className="goal-card-amounts">
                <span className="goal-card-current" style={{ color: goal.color }}>{formatRupiah(goal.current_amount)}</span>
                <span className="goal-card-target">/ {formatRupiah(goal.target_amount)}</span>
              </div>

              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${goal.progress_percentage}%`, background: goal.color }} />
              </div>
              <div className="goal-card-percentage" style={{ color: goal.color }}>{goal.progress_percentage}%</div>

              <div className="goal-card-actions">
                <button className="btn btn-sm btn-primary" onClick={() => { setSelectedGoal(goal); setShowDepositModal(true); }}>
                  <PiggyBank size={14} /> Setor
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => {
                  setEditId(goal.id);
                  setGoalForm({ name: goal.name, type: goal.type, target_amount: goal.target_amount, deadline: goal.deadline?.split('T')[0] || '', color: goal.color });
                  setShowGoalModal(true);
                }}>
                  <Edit3 size={14} />
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => handleDeleteGoal(goal.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Allocation Rules */}
      {goals.length > 0 && (
        <div className="distributor-card">
          <div className="distributor-title"><Zap size={20} /> Aturan Distribusi Otomatis</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)' }}>
            Atur persentase pembagian otomatis untuk setiap pendapatan tambahan yang masuk.
          </p>

          {allocationForm.map((a, i) => (
            <div className="allocation-row" key={a.goal_id}>
              <span className="allocation-name">{a.name}</span>
              <input
                type="number"
                className="form-input allocation-input"
                value={a.percentage}
                onChange={e => {
                  const newForm = [...allocationForm];
                  newForm[i] = { ...newForm[i], percentage: e.target.value };
                  setAllocationForm(newForm);
                }}
                min="0"
                max="100"
              />
              <span className="allocation-percent">%</span>
            </div>
          ))}

          <div className="total-allocation">
            <span>Total</span>
            <span className={`mono ${totalAllocation > 100 ? 'text-red' : totalAllocation === 100 ? 'text-green' : 'text-amber'}`}>
              {totalAllocation}%
            </span>
          </div>

          <button className="btn btn-primary" onClick={handleSaveAllocations} disabled={totalAllocation > 100} style={{ width: '100%', marginTop: 'var(--spacing-md)' }}>
            Simpan Aturan
          </button>
        </div>
      )}

      {/* Goal Modal */}
      <Modal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} title={editId ? 'Edit Target' : 'Target Baru'}
        footer={<><button className="btn btn-ghost" onClick={() => setShowGoalModal(false)}>Batal</button><button className="btn btn-primary" onClick={handleSaveGoal}>Simpan</button></>}>
        <div className="auth-form">
          <div className="form-group"><label className="form-label">Nama Target</label><input type="text" className="form-input" value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} placeholder="Contoh: DP Rumah" /></div>
          <div className="form-group"><label className="form-label">Tipe</label>
            <select className="form-select" value={goalForm.type} onChange={e => setGoalForm({...goalForm, type: e.target.value})}>
              <option value="education">Pendidikan</option><option value="asset">Aset</option><option value="working_capital">Modal Kerja</option><option value="custom">Lainnya</option>
            </select></div>
          <div className="form-group"><label className="form-label">Target Nominal</label><input type="number" className="form-input mono" value={goalForm.target_amount} onChange={e => setGoalForm({...goalForm, target_amount: e.target.value})} placeholder="0" min="0" /></div>
          <div className="form-group"><label className="form-label">Deadline</label><input type="date" className="form-input" value={goalForm.deadline} onChange={e => setGoalForm({...goalForm, deadline: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Warna</label><input type="color" value={goalForm.color} onChange={e => setGoalForm({...goalForm, color: e.target.value})} style={{width:50,height:36,border:'none',background:'transparent',cursor:'pointer'}} /></div>
        </div>
      </Modal>

      {/* Deposit Modal */}
      <Modal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} title={`Setor ke ${selectedGoal?.name || ''}`}
        footer={<><button className="btn btn-ghost" onClick={() => setShowDepositModal(false)}>Batal</button><button className="btn btn-primary" onClick={handleDeposit}>Setor</button></>}>
        <div className="auth-form">
          <div className="form-group"><label className="form-label">Nominal Setoran</label><input type="number" className="form-input mono" value={depositForm.amount} onChange={e => setDepositForm({...depositForm, amount: e.target.value})} placeholder="0" min="1" /></div>
          <div className="form-group"><label className="form-label">Catatan (opsional)</label><input type="text" className="form-input" value={depositForm.note} onChange={e => setDepositForm({...depositForm, note: e.target.value})} placeholder="Sumber dana" /></div>
        </div>
      </Modal>

      {/* Distribute Modal */}
      <Modal isOpen={showDistributeModal} onClose={() => setShowDistributeModal(false)} title="Distribusi Pendapatan"
        footer={<><button className="btn btn-ghost" onClick={() => setShowDistributeModal(false)}>Batal</button><button className="btn btn-primary" onClick={handleDistribute}>Distribusikan</button></>}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
          Masukkan total pendapatan tambahan. Dana akan otomatis dibagi sesuai aturan alokasi.
        </p>
        <div className="auth-form">
          <div className="form-group"><label className="form-label">Total Pendapatan</label><input type="number" className="form-input mono" value={distributeAmount} onChange={e => setDistributeAmount(e.target.value)} placeholder="0" min="1" /></div>
          <div className="form-group"><label className="form-label">Sumber/Keterangan Pendapatan</label><input type="text" className="form-input" value={distributeNote} onChange={e => setDistributeNote(e.target.value)} placeholder="Contoh: Bonus Proyek Akhir Tahun" /></div>
        </div>
      </Modal>
    </div>
  );
}
