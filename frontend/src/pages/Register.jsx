import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.password_confirmation);
      navigate('/');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors).flat().join(' '));
      } else {
        setError(err.response?.data?.message || 'Gagal mendaftar.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <h1>💰 Keuangan</h1>
          <p>Buat akun untuk mulai mengelola keuangan</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
            <input type="text" name="name" className="form-input" value={form.name} onChange={handleChange} placeholder="Nama Anda" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" name="email" className="form-input" value={form.email} onChange={handleChange} placeholder="nama@email.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-input" value={form.password} onChange={handleChange} placeholder="Min. 6 karakter" required />
          </div>
          <div className="form-group">
            <label className="form-label">Konfirmasi Password</label>
            <input type="password" name="password_confirmation" className="form-input" value={form.password_confirmation} onChange={handleChange} placeholder="Ulangi password" required />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading} style={{width:'100%'}}>
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <div className="auth-footer">
          Sudah punya akun? <Link to="/login">Masuk di sini</Link>
        </div>
      </div>
    </div>
  );
}
