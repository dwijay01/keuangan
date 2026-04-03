import { useState, useEffect } from 'react';
import { categoryApi, budgetApi, billApi, familyApi, settingApi } from '../api/client';
import { formatRupiah, getMonthYear } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import {
  Tag, Sliders, Users, Settings as SettingsIcon, Plus, Trash2,
  Edit3, Download, Upload, Receipt
} from 'lucide-react';

export default function SettingsPage() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [bills, setBills] = useState([]);
  const [family, setFamily] = useState([]);
  const [settings, setSettings] = useState({});
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', type: 'expense', icon: 'circle', color: '#A0A0A0' });
  const [billForm, setBillForm] = useState({ name: '', amount: '', due_day: '', category_id: '', is_recurring: true, total_installments: '', paid_installments: '' });
  const [famForm, setFamForm] = useState({ name: '', birth_date: '', relation: '' });
  const [budgetForm, setBudgetForm] = useState({ category_id: '', monthly_limit: '' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [catRes, billRes, famRes, settRes, budRes] = await Promise.all([
        categoryApi.getAll(), billApi.getAll(), familyApi.getAll(),
        settingApi.getAll(), budgetApi.getAll(getMonthYear()),
      ]);
      setCategories(catRes.data);
      setBills(billRes.data);
      setFamily(famRes.data);
      setSettings(settRes.data);
      setBudgets(budRes.data);
    } catch (e) {} finally { setLoading(false); }
  };

  // Category CRUD
  const saveCategory = async () => {
    try {
      if (editId) { await categoryApi.update(editId, catForm); } else { await categoryApi.create(catForm); }
      toast.success('Kategori disimpan');
      setShowCategoryModal(false);
      setEditId(null);
      setCatForm({ name: '', type: 'expense', icon: 'circle', color: '#A0A0A0' });
      loadAll();
    } catch (e) { toast.error('Gagal'); }
  };
  const deleteCategory = async (id) => {
    if (!confirm('Hapus kategori?')) return;
    try { await categoryApi.delete(id); toast.success('Dihapus'); loadAll(); } catch (e) { toast.error('Gagal'); }
  };

  // Bill CRUD
  const saveBill = async () => {
    try {
      const payload = { ...billForm, amount: parseFloat(billForm.amount), due_day: parseInt(billForm.due_day), total_installments: billForm.total_installments ? parseInt(billForm.total_installments) : null, paid_installments: billForm.paid_installments ? parseInt(billForm.paid_installments) : 0 };
      if (editId) { await billApi.update(editId, payload); } else { await billApi.create(payload); }
      toast.success('Tagihan disimpan');
      setShowBillModal(false);
      setEditId(null);
      setBillForm({ name: '', amount: '', due_day: '', category_id: '', is_recurring: true, total_installments: '', paid_installments: '' });
      loadAll();
    } catch (e) { toast.error('Gagal'); }
  };
  const deleteBill = async (id) => {
    if (!confirm('Hapus?')) return;
    try { await billApi.delete(id); toast.success('Dihapus'); loadAll(); } catch (e) { toast.error('Gagal'); }
  };

  // Family CRUD
  const saveFamily = async () => {
    try {
      if (editId) { await familyApi.update(editId, famForm); } else { await familyApi.create(famForm); }
      toast.success('Disimpan');
      setShowFamilyModal(false);
      setEditId(null);
      setFamForm({ name: '', birth_date: '', relation: '' });
      loadAll();
    } catch (e) { toast.error('Gagal'); }
  };
  const deleteFamily = async (id) => {
    if (!confirm('Hapus?')) return;
    try { await familyApi.delete(id); toast.success('Dihapus'); loadAll(); } catch (e) { toast.error('Gagal'); }
  };

  // Budgets
  const saveBudget = async () => {
    try {
      const { month, year } = getMonthYear();
      await budgetApi.create({ ...budgetForm, monthly_limit: parseFloat(budgetForm.monthly_limit), month, year });
      toast.success('Anggaran disimpan');
      setShowBudgetModal(false);
      setBudgetForm({ category_id: '', monthly_limit: '' });
      loadAll();
    } catch (e) { toast.error('Gagal'); }
  };

  // Settings
  const saveSettings = async (key, value) => {
    try {
      await settingApi.update({ [key]: value });
      setSettings(s => ({ ...s, [key]: value }));
      toast.success('Pengaturan disimpan');
    } catch (e) { toast.error('Gagal'); }
  };

  // Export / Import
  const handleExport = async () => {
    try {
      const res = await settingApi.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `keuangan-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Data berhasil diekspor');
    } catch (e) { toast.error('Gagal'); }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!confirm('Semua data akan ditimpa. Lanjutkan?')) return;
        await settingApi.importData(data);
        toast.success('Data berhasil diimpor');
        loadAll();
      } catch (err) { toast.error('File tidak valid'); }
    };
    reader.readAsText(file);
  };

  // Auto calculate daily budget
  const handleAutoCalculateBudget = () => {
    const income = parseFloat(settings.monthly_income);
    if (!income || income <= 0) {
      toast.error('Masukkan Gaji Bulanan terlebih dahulu (lalu tekan Enter)!');
      return;
    }
    const totalBills = bills.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    
    // Financial Analyst Rule (50/30/20 adapted for Cashflow)
    // 20% locked for savings/investments
    // 80% minus fixed bills = Cash to live per month
    const safeMoney = (income * 0.8) - totalBills;
    
    if (safeMoney <= 0) {
      toast.error('Gaji tidak cukup / Tagihan melebihi batas rasio aman.');
      return;
    }
    
    const daily = Math.floor(safeMoney / 30);
    saveSettings('daily_budget', daily);
    toast.success('Budget harian berhasil dioptimasi!');
    alert(`Rangkuman Analisis 50/30/20:\n\n1. Pendapatan: ${formatRupiah(income)}\n2. Tabungan/Tujuan (20%): ${formatRupiah(income * 0.2)}\n3. Total Tagihan Pasti: ${formatRupiah(totalBills)}\n\nSisa Uang Bebas / 30 Hari = ${formatRupiah(daily)} per hari.\nIni adalah angka paling realistis agar Anda tetap bisa menabung tanpa kurang uang makan.`);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Pengaturan</h1>
          <p className="page-subtitle">Atur logika dan master data aplikasi</p>
        </div>
      </div>

      {/* General Settings */}
      <div className="card settings-section">
        <div className="settings-section-title"><Sliders size={20} /> Pengaturan Umum</div>
        <div className="settings-row">
          <div className="settings-row-label">Gaji Bulanan<small>Pendapatan tetap per bulan</small></div>
          <div className="settings-row-value">
            <input type="number" className="form-input" value={settings.monthly_income || ''} onChange={e => setSettings({...settings, monthly_income: e.target.value})} onBlur={() => saveSettings('monthly_income', settings.monthly_income)} />
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-row-label">Budget Harian<small>Jatah pengeluaran harian maksimal</small></div>
          <div className="settings-row-value" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="number" className="form-input" style={{ width: '150px' }} value={settings.daily_budget || ''} onChange={e => setSettings({...settings, daily_budget: e.target.value})} onBlur={() => saveSettings('daily_budget', settings.daily_budget)} />
            <button className="btn btn-sm btn-ghost" onClick={handleAutoCalculateBudget} style={{ color: 'var(--accent-cyan)' }}>
              ✨ Hitung Otomatis (Rasio 50/30/20)
            </button>
          </div>
        </div>
      </div>

      {/* Budget per Category */}
      <div className="card settings-section">
        <div className="settings-section-title">
          <Sliders size={20} /> Anggaran Bulanan
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => setShowBudgetModal(true)}><Plus size={14} /> Tambah</button>
        </div>
        {budgets.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Belum ada anggaran bulan ini.</p>
        ) : budgets.map(b => (
          <div className="settings-row" key={b.id}>
            <div className="settings-row-label"><span className="category-dot" style={{ background: b.category?.color, display: 'inline-block', marginRight: 8 }} />{b.category?.name}</div>
            <div className="settings-row-value"><span className="mono">{formatRupiah(b.monthly_limit)}</span></div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="card settings-section">
        <div className="settings-section-title">
          <Tag size={20} /> Manajemen Kategori
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { setEditId(null); setCatForm({ name: '', type: 'expense', icon: 'circle', color: '#A0A0A0' }); setShowCategoryModal(true); }}><Plus size={14} /> Tambah</button>
        </div>
        <div className="category-list">
          {categories.map(c => (
            <div className="category-item" key={c.id}>
              <div className="category-item-color" style={{ background: c.color }} />
              <span className="category-item-name">{c.name}</span>
              <span className={`category-item-type badge ${c.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                {c.type === 'income' ? 'Masuk' : 'Keluar'}
              </span>
              <div className="category-item-actions">
                <button className="btn btn-icon btn-ghost" onClick={() => { setEditId(c.id); setCatForm({ name: c.name, type: c.type, icon: c.icon, color: c.color }); setShowCategoryModal(true); }}><Edit3 size={14} /></button>
                <button className="btn btn-icon btn-ghost" onClick={() => deleteCategory(c.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bills */}
      <div className="card settings-section">
        <div className="settings-section-title">
          <Receipt size={20} /> Tagihan & Cicilan
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { setEditId(null); setBillForm({ name: '', amount: '', due_day: '', category_id: '', is_recurring: true, total_installments: '', paid_installments: '' }); setShowBillModal(true); }}><Plus size={14} /> Tambah</button>
        </div>
        {bills.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Belum ada tagihan.</p>
        ) : bills.map(b => (
          <div className="category-item" key={b.id}>
            <span className="category-item-name">{b.name}</span>
            <span className="mono text-secondary" style={{fontSize:'0.85rem'}}>{formatRupiah(b.amount)}</span>
            <span className="badge badge-amber">Tgl {b.due_day}</span>
            {b.total_installments && <span className="badge badge-cyan">{b.paid_installments}/{b.total_installments}</span>}
            <div className="category-item-actions">
              <button className="btn btn-icon btn-ghost" onClick={() => { setEditId(b.id); setBillForm({ name: b.name, amount: b.amount, due_day: b.due_day, category_id: b.category_id || '', is_recurring: b.is_recurring, total_installments: b.total_installments || '', paid_installments: b.paid_installments || '' }); setShowBillModal(true); }}><Edit3 size={14} /></button>
              <button className="btn btn-icon btn-ghost" onClick={() => deleteBill(b.id)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Family Members */}
      <div className="card settings-section">
        <div className="settings-section-title">
          <Users size={20} /> Anggota Keluarga
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { setEditId(null); setFamForm({ name: '', birth_date: '', relation: '' }); setShowFamilyModal(true); }}><Plus size={14} /> Tambah</button>
        </div>
        {family.length === 0 ? (
          <p className="text-muted" style={{fontSize:'0.85rem'}}>Belum ada anggota keluarga.</p>
        ) : family.map(f => (
          <div className="family-item" key={f.id}>
            <div className="family-avatar" style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))' }}>{f.name.charAt(0)}</div>
            <div className="family-info">
              <div className="family-name">{f.name}</div>
              <div className="family-detail">{f.relation} • {f.age_display}</div>
            </div>
            <div className="category-item-actions" style={{ opacity: 1 }}>
              <button className="btn btn-icon btn-ghost" onClick={() => { setEditId(f.id); setFamForm({ name: f.name, birth_date: f.birth_date?.split('T')[0], relation: f.relation }); setShowFamilyModal(true); }}><Edit3 size={14} /></button>
              <button className="btn btn-icon btn-ghost" onClick={() => deleteFamily(f.id)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Backup */}
      <div className="card settings-section">
        <div className="settings-section-title"><Download size={20} /> Backup & Restore</div>
        <div className="backup-section">
          <button className="btn btn-ghost" onClick={handleExport}><Download size={16} /> Ekspor Data (JSON)</button>
          <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> Impor Data
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </label>
        </div>
      </div>

      {/* Category Modal */}
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title={editId ? 'Edit Kategori' : 'Kategori Baru'}
        footer={<><button className="btn btn-ghost" onClick={() => setShowCategoryModal(false)}>Batal</button><button className="btn btn-primary" onClick={saveCategory}>Simpan</button></>}>
        <div className="auth-form">
          <div className="form-group"><label className="form-label">Nama</label><input type="text" className="form-input" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Tipe</label>
            <select className="form-select" value={catForm.type} onChange={e => setCatForm({...catForm, type: e.target.value})}><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></div>
          <div className="form-group"><label className="form-label">Warna</label><input type="color" value={catForm.color} onChange={e => setCatForm({...catForm, color: e.target.value})} style={{width:50,height:36,border:'none',background:'transparent',cursor:'pointer'}} /></div>
        </div>
      </Modal>

      {/* Bill Modal */}
      <Modal isOpen={showBillModal} onClose={() => setShowBillModal(false)} title={editId ? 'Edit Tagihan' : 'Tagihan Baru'}
        footer={<><button className="btn btn-ghost" onClick={() => setShowBillModal(false)}>Batal</button><button className="btn btn-primary" onClick={saveBill}>Simpan</button></>}>
        <div className="auth-form">
          <div className="form-group"><label className="form-label">Nama Tagihan</label><input type="text" className="form-input" value={billForm.name} onChange={e => setBillForm({...billForm, name: e.target.value})} placeholder="WiFi, Listrik, dll" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Nominal</label><input type="number" className="form-input mono" value={billForm.amount} onChange={e => setBillForm({...billForm, amount: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Tanggal Jatuh Tempo</label><input type="number" className="form-input" value={billForm.due_day} onChange={e => setBillForm({...billForm, due_day: e.target.value})} min="1" max="31" /></div>
          </div>
          <div className="form-group"><label className="form-label">Kategori</label>
            <select className="form-select" value={billForm.category_id} onChange={e => setBillForm({...billForm, category_id: e.target.value})}>
              <option value="">Pilih</option>{expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Total Cicilan</label><input type="number" className="form-input" value={billForm.total_installments} onChange={e => setBillForm({...billForm, total_installments: e.target.value})} placeholder="Kosongkan jika recurring" /></div>
            <div className="form-group"><label className="form-label">Sudah Terbayar</label><input type="number" className="form-input" value={billForm.paid_installments} onChange={e => setBillForm({...billForm, paid_installments: e.target.value})} placeholder="0" /></div>
          </div>
        </div>
      </Modal>

      {/* Family Modal */}
      <Modal isOpen={showFamilyModal} onClose={() => setShowFamilyModal(false)} title={editId ? 'Edit Anggota' : 'Anggota Baru'}
        footer={<><button className="btn btn-ghost" onClick={() => setShowFamilyModal(false)}>Batal</button><button className="btn btn-primary" onClick={saveFamily}>Simpan</button></>}>
        <div className="auth-form">
          <div className="form-group"><label className="form-label">Nama</label><input type="text" className="form-input" value={famForm.name} onChange={e => setFamForm({...famForm, name: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Tanggal Lahir</label><input type="date" className="form-input" value={famForm.birth_date} onChange={e => setFamForm({...famForm, birth_date: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Hubungan</label>
            <select className="form-select" value={famForm.relation} onChange={e => setFamForm({...famForm, relation: e.target.value})}>
              <option value="">Pilih</option><option value="Suami">Suami</option><option value="Istri">Istri</option><option value="Anak">Anak</option><option value="Anak Laki-laki">Anak Laki-laki</option><option value="Anak Perempuan">Anak Perempuan</option><option value="Orang Tua">Orang Tua</option><option value="Lainnya">Lainnya</option>
            </select></div>
        </div>
      </Modal>

      {/* Budget Modal */}
      <Modal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} title="Tambah Anggaran"
        footer={<><button className="btn btn-ghost" onClick={() => setShowBudgetModal(false)}>Batal</button><button className="btn btn-primary" onClick={saveBudget}>Simpan</button></>}>
        <div className="auth-form">
          <div className="form-group"><label className="form-label">Kategori</label>
            <select className="form-select" value={budgetForm.category_id} onChange={e => setBudgetForm({...budgetForm, category_id: e.target.value})}>
              <option value="">Pilih</option>{expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Batas Bulanan</label><input type="number" className="form-input mono" value={budgetForm.monthly_limit} onChange={e => setBudgetForm({...budgetForm, monthly_limit: e.target.value})} placeholder="0" /></div>
        </div>
      </Modal>
    </div>
  );
}
