import React, { useState } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TYPES = [
  { k: 'domestic_abuse',  icon: '🏠', l: 'Domestic Abuse / Violence' },
  { k: 'child_neglect',   icon: '👶', l: 'Child Neglect' },
  { k: 'gbv',             icon: '🛡️', l: 'Gender-Based Violence' },
  { k: 'child_labour',    icon: '⚠️', l: 'Child Labour' },
  { k: 'harassment',      icon: '🚫', l: 'Sexual Harassment' },
  { k: 'other',           icon: '📋', l: 'Other Safety Issue' },
];

const HOTLINES = [
  { label: 'Police Emergency', number: '999',          icon: '🚔' },
  { label: 'GBV Hotline',      number: '1195',         icon: '📞' },
  { label: 'Childline Kenya',  number: '116',           icon: '👶' },
  { label: 'Ambulance',        number: '0721 225 225', icon: '🚑' },
  { label: 'FIDA Kenya',       number: '0718 598 100', icon: '⚖️' },
];

export default function Safety() {
  const { user } = useAuth();
  const [form, setForm] = useState({ type: '', location: '', description: '', contact: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!user) { toast.error('Please login to submit a safety report'); return; }
    if (!form.type || !form.location || !form.description) {
      toast.error('Please fill in the type, location, and description');
      return;
    }
    setLoading(true);
    try {
      await API.post('/safety', form);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-grid">
      {/* Left sidebar */}
      <div className="left-sidebar">
        <div className="menu-section">Emergency Contacts</div>
        {HOTLINES.map(h => (
          <a key={h.number} href={`tel:${h.number}`} className="menu-item" style={{ textDecoration: 'none' }}>
            {h.icon} {h.label}: <strong style={{ marginLeft: 4 }}>{h.number}</strong>
          </a>
        ))}
        <div className="divider" />
        <div style={{ padding: '0 14px' }}>
          <div style={{ background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: '10px', padding: '12px', fontSize: '13px', color: 'var(--red)' }}>
            <strong>In immediate danger?</strong><br />Call <strong>999</strong> now. Do not wait.
          </div>
        </div>
      </div>

      {/* Center */}
      <div className="feed-col">
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #6c3483, #4a235a)', borderRadius: '14px', padding: '1.5rem', color: 'white' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', marginBottom: '6px' }}>🛡️ Women & Child Safety</h1>
          <p style={{ opacity: 0.85, fontSize: '13px' }}>
            Confidential support for abuse, gender violence, and child neglect. Your identity is protected and will never be shared without your consent.
          </p>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { icon: '🚔', label: 'Call Police',     sub: '999 (free)',        color: '#c0392b', tel: '999' },
            { icon: '📞', label: 'GBV Hotline',     sub: '1195 (free)',       color: '#6c3483', tel: '1195' },
            { icon: '👶', label: 'Childline',       sub: '116 (free)',         color: '#1a5fa8', tel: '116' },
            { icon: '🚑', label: 'Ambulance',       sub: '0721 225 225',      color: '#1a7a4a', tel: '0721225225' },
          ].map(btn => (
            <a key={btn.label} href={`tel:${btn.tel}`}
              style={{ background: btn.color, color: 'white', border: 'none', borderRadius: '12px', padding: '1rem', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'block', transition: 'opacity 0.18s' }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}>
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>{btn.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '14px', fontFamily: 'Syne, sans-serif' }}>{btn.label}</div>
              <div style={{ fontSize: '12px', opacity: 0.85 }}>{btn.sub}</div>
            </a>
          ))}
        </div>

        {/* Report form or confirmation */}
        {submitted ? (
          <div className="card card-pad" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: '8px', color: '#6c3483' }}>Report Received</h2>
            <p style={{ color: '#5a7a60', fontSize: '14px', lineHeight: 1.7, marginBottom: '16px' }}>
              A trained support officer will reach out within 24 hours. Your report is <strong>completely confidential</strong>.<br /><br />
              If you are in immediate danger, please call <strong>999</strong> right now.
            </p>
            <div style={{ background: 'var(--purple-light)', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#6c3483', marginBottom: '16px' }}>
              You can also contact <strong>GBV Hotline: 1195</strong> or <strong>Childline: 116</strong> for immediate support.
            </div>
            <button className="btn btn-primary" onClick={() => { setSubmitted(false); setForm({ type:'', location:'', description:'', contact:'' }); }}>Submit Another Report</button>
          </div>
        ) : (
          <div className="card card-pad">
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>🔒 Confidential Safety Report</div>
            <div style={{ background: 'var(--purple-light)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#6c3483', marginBottom: '14px' }}>
              This report is seen only by trained support officers. Your identity will never be shared.
            </div>

            {/* Type selection */}
            <div className="form-group">
              <label className="form-label">Type of Case *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {TYPES.map(t => (
                  <label key={t.k} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', cursor: 'pointer', border: `1.5px solid ${form.type === t.k ? '#6c3483' : 'var(--border)'}`, background: form.type === t.k ? 'var(--purple-light)' : 'white', transition: 'all 0.15s' }}>
                    <input type="radio" name="stype" value={t.k} checked={form.type === t.k} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} />
                    <span style={{ fontSize: '18px' }}>{t.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: form.type === t.k ? 600 : 400 }}>{t.l}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Location of Incident *</label>
              <input className="form-input" placeholder="Area / nearest landmark" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">What happened? * (share as much or as little as you want)</label>
              <textarea className="form-input" rows={4} placeholder="You don't need to share everything — even a little information helps us respond…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Contact number for follow-up (optional — you can stay anonymous)</label>
              <input className="form-input" placeholder="Phone number or leave blank" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} />
            </div>

            <button
              style={{ width: '100%', padding: '12px', background: loading ? '#9ca3af' : '#6c3483', color: 'white', border: 'none', borderRadius: '9px', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'background 0.2s' }}
              onClick={submit} disabled={loading}>
              {loading ? '⏳ Submitting…' : '🔒 Submit Confidentially'}
            </button>
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="right-sidebar">
        <div className="card card-pad" style={{ background: 'linear-gradient(135deg,#6c3483,#4a235a)', color: 'white' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: '10px' }}>📞 Emergency Numbers</div>
          {HOTLINES.map(h => (
            <a key={h.number} href={`tel:${h.number}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none', color: 'white', fontSize: '13px' }}>
              <span style={{ opacity: 0.85 }}>{h.icon} {h.label}</span>
              <strong>{h.number}</strong>
            </a>
          ))}
        </div>

        <div className="card card-pad">
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: '#6c3483' }}>🛡️ Know Your Rights</div>
          {[
            'You have the right to report violence without fear',
            'All reports are treated with complete confidentiality',
            'Free medical help is available at any public hospital',
            'You can get a restraining order at the nearest court',
            'Children can call Childline 116 for free, anytime',
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '12px', color: '#5a7a60' }}>
              <span style={{ color: '#6c3483', fontWeight: 700 }}>✓</span> {r}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
