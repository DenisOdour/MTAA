import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AREAS = ['Kibera', 'Mathare', 'Korogocho', 'Mukuru kwa Njenga', 'Mukuru kwa Ruben', 'Huruma', 'Dandora', 'Kawangware', 'Kangemi', 'Githurai', 'Kayole', 'Embakasi', 'Zimmerman', 'Other'];

export default function Register() {
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirmPassword: '', area: '', bio: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Enter your full name'); return; }
    if (!form.phone.trim()) { toast.error('Enter your phone number'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (!form.area) { toast.error('Select your area / estate'); return; }

    setLoading(true);
    try {
      const payload = { name: form.name.trim(), phone: form.phone.trim(), password: form.password, area: form.area };
      if (form.bio.trim()) payload.bio = form.bio.trim();
      await register(payload);
      toast.success('Welcome to Mtaa Connect! 🎉');
      navigate('/feed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d1a0f 0%, #1a7a4a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem' }}>
            <span style={{ color: '#1a7a4a' }}>Mtaa</span><span style={{ color: '#e67e22' }}>Connect</span>
          </div>
          <p style={{ color: '#5a7a60', fontSize: '14px', marginTop: '4px' }}>Join your community — it's completely free!</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#5a7a60', marginBottom: '5px' }}>Full Name *</label>
            <input type="text" placeholder="Your full name" value={form.name} onChange={e => update('name', e.target.value)} required
              style={{ width: '100%', border: '1.5px solid #d4e6d8', borderRadius: '9px', padding: '11px 14px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#1a7a4a'} onBlur={e => e.target.style.borderColor = '#d4e6d8'} />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#5a7a60', marginBottom: '5px' }}>Phone Number *</label>
            <input type="tel" placeholder="+254 700 000 000" value={form.phone} onChange={e => update('phone', e.target.value)} required
              style={{ width: '100%', border: '1.5px solid #d4e6d8', borderRadius: '9px', padding: '11px 14px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#1a7a4a'} onBlur={e => e.target.style.borderColor = '#d4e6d8'} />
          </div>

          {/* Area */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#5a7a60', marginBottom: '5px' }}>Your Estate / Area *</label>
            <select value={form.area} onChange={e => update('area', e.target.value)} required
              style={{ width: '100%', border: '1.5px solid #d4e6d8', borderRadius: '9px', padding: '11px 14px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', outline: 'none', background: 'white', boxSizing: 'border-box', cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = '#1a7a4a'} onBlur={e => e.target.style.borderColor = '#d4e6d8'}>
              <option value="">Select your area...</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#5a7a60', marginBottom: '5px' }}>Password * (min 6 characters)</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={form.password} onChange={e => update('password', e.target.value)} required
                style={{ width: '100%', border: '1.5px solid #d4e6d8', borderRadius: '9px', padding: '11px 44px 11px 14px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#1a7a4a'} onBlur={e => e.target.style.borderColor = '#d4e6d8'} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#5a7a60', marginBottom: '5px' }}>Confirm Password *</label>
            <input type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required
              style={{ width: '100%', border: `1.5px solid ${form.confirmPassword && form.confirmPassword !== form.password ? '#c0392b' : '#d4e6d8'}`, borderRadius: '9px', padding: '11px 14px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#1a7a4a'} onBlur={e => e.target.style.borderColor = form.confirmPassword !== form.password ? '#c0392b' : '#d4e6d8'} />
            {form.confirmPassword && form.confirmPassword !== form.password && (
              <div style={{ color: '#c0392b', fontSize: '12px', marginTop: '4px' }}>Passwords do not match</div>
            )}
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#5a7a60', marginBottom: '5px' }}>About You (optional)</label>
            <textarea placeholder="Tell the community a bit about yourself..." value={form.bio} onChange={e => update('bio', e.target.value)} rows={2}
              style={{ width: '100%', border: '1.5px solid #d4e6d8', borderRadius: '9px', padding: '11px 14px', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#1a7a4a'} onBlur={e => e.target.style.borderColor = '#d4e6d8'} />
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', background: loading ? '#9ca3af' : '#1a7a4a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'background 0.2s' }}>
            {loading ? '⏳ Creating account...' : 'Create Free Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '14px', color: '#5a7a60' }}>
          Have an account?{' '}
          <Link to="/login" style={{ color: '#1a7a4a', fontWeight: 700, textDecoration: 'none' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}
