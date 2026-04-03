import { useState, useEffect } from 'react';
import { transactionApi, categoryApi, billApi } from '../api/client';
import { formatRupiah, formatDate, todayString } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { Plus, Trash2, Edit3, SplitSquareHorizontal, Search } from 'lucide-react';

export default function Transactions() {
  const toast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, net: 0 });
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [filters, setFilters] = useState({ type: '', category_id: '', date_from: '', date_to: '', search: '' });
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    transaction_date: todayString(),
    amount: '',
    type: 'expense',
    category_id: '',
    note: '',
    is_split: false,
    splits: [],
    bill_id: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadCategories = async () => {
    try {
      const [catRes, billRes] = await Promise.all([
        categoryApi.getAll(),
        billApi.getAll()
      ]);
      setCategories(catRes.data);
      setBills(billRes.data);
    } catch (e) {}
  };

  const loadTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const params = { ...filters, page, per_page: 15 };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await transactionApi.getAll(params);
      setTransactions(res.data.transactions.data);
      setPagination({
        current_page: res.data.transactions.current_page,
        last_page: res.data.transactions.last_page,
      });
      setSummary(res.data.summary);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ transaction_date: todayString(), amount: '', type: 'expense', category_id: '', note: '', is_split: false, splits: [], bill_id: '' });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        category_id: form.is_split ? null : (form.category_id || null),
        splits: form.is_split ? form.splits.map(s => ({ ...s, amount: parseFloat(s.amount) })) : [],
      };

      if (editId) {
        await transactionApi.update(editId, payload);
        toast.success('Transaksi berhasil diperbarui');
      } else {
        await transactionApi.create(payload);
        toast.success('Transaksi berhasil ditambahkan');
        
        // Auto increment bill if selected
        if (form.bill_id && !form.is_split) {
          const bill = bills.find(b => b.id == form.bill_id);
          if (bill) {
            try { await billApi.update(bill.id, { ...bill, paid_installments: (bill.paid_installments || 0) + 1 }); } catch(err) {}
          }
        }
      }

      resetForm();
      setShowForm(false);
      loadTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan transaksi');
    }
  };

  const handleEdit = (tx) => {
    setForm({
      transaction_date: tx.transaction_date?.split('T')[0] || todayString(),
      amount: tx.amount,
      type: tx.type,
      category_id: tx.category_id || '',
      note: tx.note || '',
      is_split: tx.is_split,
      splits: tx.splits?.map(s => ({ category_id: s.category_id, amount: s.amount, note: s.note || '' })) || [],
    });
    setEditId(tx.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      await transactionApi.delete(id);
      toast.success('Transaksi dihapus');
      loadTransactions(pagination.current_page);
    } catch (e) {
      toast.error('Gagal menghapus');
    }
  };

  const addSplit = () => {
    setForm({ ...form, splits: [...form.splits, { category_id: '', amount: '', note: '' }] });
  };

  const updateSplit = (index, field, value) => {
    const newSplits = [...form.splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setForm({ ...form, splits: newSplits });
  };

  const removeSplit = (index) => {
    setForm({ ...form, splits: form.splits.filter((_, i) => i !== index) });
  };

  const filteredCategories = categories.filter(c => !form.type || c.type === form.type);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Transaksi</h1>
          <p className="page-subtitle">Catat dan kelola arus kas Anda</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={16} /> Catat Transaksi
        </button>
      </div>

      {/* Summary Bar */}
      <div className="summary-bar">
        <div className="summary-item">
          <span className="label">Pemasukan</span>
          <span className="value text-green mono">{formatRupiah(summary.total_income)}</span>
        </div>
        <div className="summary-item">
          <span className="label">Pengeluaran</span>
          <span className="value text-red mono">{formatRupiah(summary.total_expense)}</span>
        </div>
        <div className="summary-item">
          <span className="label">Net</span>
          <span className={`value mono ${summary.net >= 0 ? 'text-green' : 'text-red'}`}>
            {formatRupiah(summary.net)}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="form-group">
          <label className="form-label">Tipe</label>
          <select className="form-select" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
            <option value="">Semua</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Kategori</label>
          <select className="form-select" value={filters.category_id} onChange={e => setFilters({...filters, category_id: e.target.value})}>
            <option value="">Semua</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Dari</label>
          <input type="date" className="form-input" value={filters.date_from} onChange={e => setFilters({...filters, date_from: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Sampai</label>
          <input type="date" className="form-input" value={filters.date_to} onChange={e => setFilters({...filters, date_to: e.target.value})} />
        </div>
        <div className="form-group">
          <label className="form-label">Cari</label>
          <input type="text" className="form-input" placeholder="Cari catatan..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Kategori</th>
              <th>Catatan</th>
              <th style={{textAlign:'right'}}>Masuk</th>
              <th style={{textAlign:'right'}}>Keluar</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Memuat...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Belum ada transaksi</td></tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx.id} className={tx.type === 'income' ? 'ledger-row-income' : 'ledger-row-expense'}>
                  <td>{formatDate(tx.transaction_date)}</td>
                  <td>
                    <div className="category-label">
                      <span className="category-dot" style={{ background: tx.category?.color || '#666' }} />
                      {tx.is_split ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <SplitSquareHorizontal size={14} /> Split
                        </span>
                      ) : (
                        tx.category?.name || '-'
                      )}
                    </div>
                  </td>
                  <td>
                    <span>{tx.note || '-'}</span>
                    {tx.is_split && tx.splits?.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {tx.splits.map(s => `${s.category?.name}: ${formatRupiah(s.amount)}`).join(' · ')}
                      </div>
                    )}
                  </td>
                  <td className="mono-cell" style={{textAlign:'right'}}>
                    {tx.type === 'income' ? formatRupiah(tx.amount) : ''}
                  </td>
                  <td className="mono-cell" style={{textAlign:'right'}}>
                    {tx.type === 'expense' ? formatRupiah(tx.amount) : ''}
                  </td>
                  <td>
                    <div className="transaction-actions">
                      <button className="btn btn-icon btn-ghost" onClick={() => handleEdit(tx)}><Edit3 size={14} /></button>
                      <button className="btn btn-icon btn-ghost" onClick={() => handleDelete(tx.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="pagination">
          <button disabled={pagination.current_page <= 1} onClick={() => loadTransactions(pagination.current_page - 1)}>← Prev</button>
          <span className="current-page">{pagination.current_page} / {pagination.last_page}</span>
          <button disabled={pagination.current_page >= pagination.last_page} onClick={() => loadTransactions(pagination.current_page + 1)}>Next →</button>
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title={editId ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); resetForm(); }}>Batal</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editId ? 'Simpan' : 'Tambah'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{marginBottom:'var(--spacing-md)'}}>
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input type="date" className="form-input" value={form.transaction_date} onChange={e => setForm({...form, transaction_date: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Nominal</label>
              <input type="number" className="form-input mono" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0" required min="0" />
            </div>
          </div>

          <div className="form-group" style={{marginBottom:'var(--spacing-md)'}}>
            <label className="form-label">Tipe</label>
            <div className="toggle-group">
              <button type="button" className={`toggle-btn ${form.type === 'income' ? 'active' : ''}`} onClick={() => setForm({...form, type: 'income', category_id: ''})}>
                Pemasukan
              </button>
              <button type="button" className={`toggle-btn ${form.type === 'expense' ? 'active expense' : ''}`} onClick={() => setForm({...form, type: 'expense', category_id: ''})}>
                Pengeluaran
              </button>
            </div>
          </div>

          {!form.is_split && (
            <div className="form-group" style={{marginBottom:'var(--spacing-md)'}}>
              <label className="form-label">Kategori</label>
              <select className="form-select" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value, bill_id: ''})}>
                <option value="">Pilih kategori</option>
                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {!form.is_split && form.category_id && bills.filter(b => b.category_id == form.category_id).length > 0 && (
            <div className="form-group" style={{marginBottom:'var(--spacing-md)', padding: '1rem', background: 'rgba(0, 212, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 212, 255, 0.2)'}}>
              <label className="form-label text-cyan" style={{display:'flex', alignItems:'center', gap:'4px'}}>
                <Search size={14}/> Tagihan Terkait Ditemukan
              </label>
              <select className="form-select" style={{ borderColor: 'var(--accent-cyan)' }} value={form.bill_id || ''} onChange={e => {
                const bId = e.target.value;
                const bill = bills.find(b => b.id == bId);
                if (bill) {
                   setForm({...form, bill_id: bId, amount: bill.amount, note: `Bayar Tagihan: ${bill.name}`});
                } else {
                   setForm({...form, bill_id: ''});
                }
              }}>
                <option value="">-- Pilih Jika Membayar Tagihan --</option>
                {bills.filter(b => b.category_id == form.category_id).map(b => (
                  <option key={b.id} value={b.id}>{b.name} - {formatRupiah(b.amount)}</option>
                ))}
              </select>
              <p style={{fontSize: '0.75rem', color:'var(--text-muted)', marginTop:'8px'}}>
                Memilih tagihan akan otomatis mengisi nominal & mencatat (+1) pada progress pembayaran tagihan bulan ini.
              </p>
            </div>
          )}

          <div className="form-group" style={{marginBottom:'var(--spacing-md)'}}>
            <label className="form-label">Catatan</label>
            <input type="text" className="form-input" value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Opsional" />
          </div>

          <div className="form-group" style={{marginBottom:'var(--spacing-md)'}}>
            <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'0.85rem', color:'var(--text-secondary)'}}>
              <input type="checkbox" checked={form.is_split} onChange={e => setForm({...form, is_split: e.target.checked, splits: e.target.checked ? [{ category_id: '', amount: '', note: '' }] : []})} />
              <SplitSquareHorizontal size={14} /> Split transaksi ke beberapa kategori
            </label>
          </div>

          {form.is_split && (
            <div style={{marginBottom:'var(--spacing-md)'}}>
              {form.splits.map((split, i) => (
                <div className="split-row" key={i}>
                  <div className="form-group">
                    <select className="form-select" value={split.category_id} onChange={e => updateSplit(i, 'category_id', e.target.value)}>
                      <option value="">Kategori</option>
                      {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <input type="text" className="form-input" value={split.note} onChange={e => updateSplit(i, 'note', e.target.value)} placeholder="Catatan" />
                  </div>
                  <div className="form-group">
                    <input type="number" className="form-input mono" value={split.amount} onChange={e => updateSplit(i, 'amount', e.target.value)} placeholder="Nominal" min="0" />
                  </div>
                  <button type="button" className="btn btn-icon btn-ghost" onClick={() => removeSplit(i)}><Trash2 size={14} /></button>
                </div>
              ))}
              <button type="button" className="add-split-btn" onClick={addSplit}>
                <Plus size={14} /> Tambah baris
              </button>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
