import React, { useState } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const TYPES = [
  { key: 'violence',      icon: '⚔️', label: 'Violence',      color: '#c0392b', bg: '#fdecea' },
  { key: 'fire',          icon: '🔥', label: 'Fire',           color: '#e67e22', bg: '#fef3e2' },
  { key: 'medical',       icon: '🏥', label: 'Medical',        color: '#1a5fa8', bg: '#e8f0fb' },
  { key: 'missing_child', icon: '👶', label: 'Missing Child',  color: '#6c3483', bg: '#f3eaf9' },
  { key: 'flood',         icon: '💧', label: 'Flood / Disaster',color:'#0e6655', bg: '#e8f8f5' },
  { key: 'other',         icon: '⚠️', label: 'Other',          color: '#5d6d7e', bg: '#f2f3f4' },
];

export default function EmergencyModal({ onClose }) {
  const { user } = useAuth();
  const { emitEmergency } = useSocket();
  const [selected, setSelected] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!selected) { toast.error('Please select an emergency type'); return; }
    if (!user) { toast.error('Please login to send an emergency alert'); return; }

    setLoading(true);
    try {
      let coords = null;
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
        );
        coords = [pos.coords.longitude, pos.coords.latitude];
      } catch { /* GPS optional */ }

      const payload = {
        type: selected,
        description: description.trim(),
        location: location.trim() || user.area,
        area: user.area,
        coordinates: coords,
        severity: 'high'
      };

      await API.post('/emergency', payload);
      emitEmergency(payload);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: '8px', color: '#1a7a4a' }}>Alert Sent!</h2>
        <p style={{ color: '#5a7a60', lineHeight: 1.7, marginBottom: '16px' }}>
          Emergency alert broadcast to <strong>all community members online</strong>. Local leaders, security groups, volunteers and hospitals have been notified.
        </p>
        <div style={{ background: '#e8f5ee', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#1a7a4a', marginBottom: '20px' }}>
          <strong>Notified groups:</strong> Local chiefs &amp; elders · Youth groups · Volunteers · Hospitals · Security
        </div>
        <button className="btn btn-primary btn-full" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-title" style={{ color: '#c0392b' }}>🆘 Emergency Alert</div>
        <p style={{ fontSize: '13px', color: '#5a7a60', marginBottom: '14px' }}>
          Tap the type of emergency. Your alert will broadcast instantly to all community members online.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setSelected(t.key)}
              style={{
                padding: '14px 10px', borderRadius: '10px', cursor: 'pointer', border: `2px solid ${selected === t.key ? t.color : '#d4e6d8'}`,
                background: selected === t.key ? t.bg : 'white', color: t.color, fontWeight: 700, fontSize: '14px',
                fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s', transform: selected === t.key ? 'scale(1.03)' : 'scale(1)'
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="form-group">
          <label className="form-label">Location / Landmark (optional)</label>
          <input className="form-input" placeholder={`Area near you (default: ${user?.area || 'your estate'})`}
            value={location} onChange={e => setLocation(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Brief description (optional)</label>
          <textarea className="form-input" rows={2} placeholder="What is happening?"
            value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        <div style={{ background: '#fdecea', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#c0392b', marginBottom: '14px' }}>
          ⚠️ Only use for genuine emergencies. Misuse will result in account suspension.
        </div>

        <button className="btn btn-danger btn-full btn-lg" onClick={handleSend} disabled={!selected || loading}>
          {loading ? '📡 Sending alert...' : '🚨 SEND EMERGENCY ALERT NOW'}
        </button>
      </div>
    </div>
  );
}
