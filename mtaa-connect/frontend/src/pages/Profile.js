import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const AV_COLORS = ['#1a7a4a','#1a5fa8','#6c3483','#c0392b','#e67e22'];
const avColor = name => AV_COLORS[(name?.charCodeAt(0)||0) % AV_COLORS.length];

const ADMIN_PLANS = [
  { k:'jobs',               l:'💼 Jobs Admin',               price:2000,  desc:'Approve job posts, feature listings, manage employers.' },
  { k:'business_directory', l:'🏪 Business Directory Admin', price:3500,  desc:'Verify businesses, collect listing fees, run promotions.' },
  { k:'skills',             l:'🎓 Skills Training Admin',    price:1500,  desc:'Approve courses, onboard mentors, earn from enrollments.' },
  { k:'stories',            l:'📖 Stories/Community Admin',  price:1000,  desc:'Moderate content, approve posts, feature top stories.' },
  { k:'donations',          l:'🤝 Donations/NGO Admin',      price:800,   desc:'Verify requests, coordinate NGO responses.' },
];

function AdminModal({ onClose }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const buy = async () => {
    if (!plan) { toast.error('Select a plan'); return; }
    setLoading(true);
    try {
      await API.post('/payments/initiate', {
        phone: user.phone, amount: plan.price,
        purpose: 'admin_subscription',
        metadata: { category: plan.k }
      });
      toast.success(`M-Pesa prompt sent! Pay KSh ${plan.price.toLocaleString()} to activate ${plan.l}.`);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Payment failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-title">⚙️ Become a Category Admin</div>
        <div style={{ background: 'var(--green-light)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: 'var(--green)', marginBottom: '14px' }}>
          As a category admin you moderate content, approve listings, and earn revenue from paid listings in your section.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {ADMIN_PLANS.map(p => (
            <label key={p.k} style={{ display: 'flex', gap: '12px', alignItems: 'start', padding: '12px', borderRadius: '10px', cursor: 'pointer', border: `2px solid ${plan?.k===p.k?'#1a7a4a':'var(--border)'}`, background: plan?.k===p.k?'var(--green-light)':'white', transition: 'all 0.15s' }}>
              <input type="radio" name="aplan" checked={plan?.k===p.k} onChange={() => setPlan(p)} style={{ marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{p.l}</div>
                <div style={{ fontSize: '12px', color: '#5a7a60', marginTop: '2px' }}>{p.desc}</div>
              </div>
              <div style={{ fontWeight: 800, color: 'var(--green)', fontSize: '15px', flexShrink: 0 }}>KSh {p.price.toLocaleString()}/mo</div>
            </label>
          ))}
        </div>
        <button className="btn btn-primary btn-full btn-lg" onClick={buy} disabled={!plan || loading}>
          {loading ? '⏳ Processing…' : plan ? `Pay KSh ${plan.price.toLocaleString()} via M-Pesa →` : 'Select a Plan →'}
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const load = async () => {
      try {
        const { data } = await API.get('/auth/me');
        setProfile(data.user);
        setEditForm({ name: data.user.name, bio: data.user.bio||'', area: data.user.area, shareLocation: data.user.shareLocation });
      } catch { toast.error('Failed to load profile'); }
    };
    load();
  }, [user, navigate]);

  useEffect(() => {
    if (!user || tab !== 'posts') return;
    API.get('/posts', { params: { page:1, limit:6 } }).then(({ data }) => {
      setPosts((data.posts||[]).filter(p => (p.author?._id||p.author) === user._id));
    }).catch(() => {});
  }, [user, tab]);

  useEffect(() => {
    if (!user || tab !== 'notifications') return;
    API.get('/notifications').then(({ data }) => setNotifications(data.notifications||[])).catch(() => {});
  }, [user, tab]);

  useEffect(() => {
    if (!user || tab !== 'payments') return;
    API.get('/payments/history').then(({ data }) => setPayments(data.payments||[])).catch(() => {});
  }, [user, tab]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await API.put('/auth/profile', editForm);
      updateUser(editForm);
      setProfile(prev => ({ ...prev, ...editForm }));
      setEditing(false);
      toast.success('Profile updated ✓');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  if (!profile) return <div className="page-loader"><div className="spinner" /></div>;

  const color = avColor(profile.name);
  const initials = profile.name?.slice(0, 2).toUpperCase();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1rem 1.5rem' }}>
      {/* Profile header card */}
      <div className="card card-pad" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'start', flexWrap: 'wrap' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
            {profile.avatar ? <img src={profile.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem' }}>{profile.name}</h2>
              {profile.role === 'super_admin' && <span className="badge badge-gold">⭐ SUPER ADMIN</span>}
              {profile.role === 'admin' && <span className="badge badge-green">ADMIN</span>}
              {profile.isVerified && <span className="badge badge-blue">✓ Verified</span>}
            </div>
            {profile.username && <div style={{ fontSize: '13px', color: '#5a7a60', marginBottom: '4px' }}>@{profile.username}</div>}
            <div style={{ fontSize: '13px', color: '#5a7a60', marginBottom: '6px' }}>📍 {profile.area} · 📱 {profile.phone}</div>
            {profile.bio && <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.6, marginBottom: '8px' }}>{profile.bio}</p>}
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#5a7a60' }}>
              <span><strong style={{ color: 'var(--text)' }}>{profile.postsCount||0}</strong> posts</span>
              <span><strong style={{ color: 'var(--text)' }}>{profile.followersCount||0}</strong> followers</span>
              <span><strong style={{ color: 'var(--text)' }}>{profile.followingCount||0}</strong> following</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)}>✏️ Edit Profile</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdminModal(true)}>⚙️ Become Admin</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>🚪 Logout</button>
          </div>
        </div>

        {/* Admin categories */}
        {profile.adminCategories?.length > 0 && (
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#5a7a60', marginBottom: '6px', letterSpacing: '0.5px' }}>ADMIN CATEGORIES</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {profile.adminCategories.map(cat => (
                <span key={cat} className="badge badge-green" style={{ textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</span>
              ))}
            </div>
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <input className="form-input" value={editForm.name||''} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Area / Estate</label>
                <input className="form-input" value={editForm.area||''} onChange={e => setEditForm(p => ({...p, area: e.target.value}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={2} value={editForm.bio||''} onChange={e => setEditForm(p => ({...p, bio: e.target.value}))} placeholder="Tell the community about yourself…" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--bg)', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>📍 Share my location on the map</div>
                <div style={{ fontSize: '12px', color: '#5a7a60' }}>When enabled, you appear on the community map for admins and others.</div>
              </div>
              <button onClick={() => setEditForm(p => ({...p, shareLocation: !p.shareLocation}))}
                style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 700, fontSize: '13px', background: editForm.shareLocation ? '#1a7a4a' : 'var(--border)', color: editForm.shareLocation ? 'white' : '#5a7a60', transition: 'all 0.18s' }}>
                {editForm.shareLocation ? 'ON' : 'OFF'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? '⏳ Saving…' : 'Save Changes'}</button>
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '12px' }}>
        {[
          { k:'posts',         l:'📖 My Posts' },
          { k:'notifications', l:`🔔 Notifications${notifications.filter(n=>!n.isRead).length>0?` (${notifications.filter(n=>!n.isRead).length})`:''}` },
          { k:'payments',      l:'💰 Payments' },
        ].map(t => <button key={t.k} className={`tab ${tab===t.k?'active':''}`} onClick={() => setTab(t.k)}>{t.l}</button>)}
      </div>

      {/* Posts */}
      {tab === 'posts' && (
        posts.length === 0
          ? <div className="empty card card-pad"><div className="ei">📖</div><h3>No posts yet</h3><p>Share your first story!</p><button className="btn btn-primary mt-1" onClick={() => navigate('/feed')}>Write a Story →</button></div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {posts.map(post => (
                <div key={post._id} className="card card-pad">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem' }}>{post.title}</h3>
                    <span className={`badge ${post.status==='approved'||post.status==='featured'?'badge-green':post.status==='rejected'?'badge-red':'badge-amber'}`}>{post.status}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.6, marginBottom: '8px' }}>{post.content?.slice(0, 150)}…</p>
                  <div style={{ fontSize: '12px', color: '#5a7a60', display: 'flex', gap: '12px' }}>
                    <span>❤️ {post.likesCount||0}</span>
                    <span>💬 {post.commentsCount||0}</span>
                    <span>👁️ {post.views||0}</span>
                    <span style={{ marginLeft: 'auto' }}>{formatDistanceToNow(new Date(post.createdAt),{addSuffix:true})}</span>
                  </div>
                </div>
              ))}
            </div>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        notifications.length === 0
          ? <div className="empty card card-pad"><div className="ei">🔔</div><h3>No notifications</h3><p>You're all caught up!</p></div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map(n => (
                <div key={n._id} style={{ background: n.isRead ? 'white' : 'var(--green-light)', borderRadius: '10px', border: '1px solid var(--border)', padding: '12px', display: 'flex', gap: '10px', alignItems: 'start' }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{n.type==='like'?'❤️':n.type==='comment'?'💬':n.type==='post_approved'?'✅':n.type==='follow'?'👤':'🔔'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{n.title}</div>
                    <div style={{ fontSize: '13px', color: '#4a5568', marginTop: '2px' }}>{n.body}</div>
                    <div style={{ fontSize: '11px', color: '#5a7a60', marginTop: '4px' }}>{formatDistanceToNow(new Date(n.createdAt),{addSuffix:true})}</div>
                  </div>
                  {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, marginTop: 6 }} />}
                </div>
              ))}
            </div>
      )}

      {/* Payments */}
      {tab === 'payments' && (
        payments.length === 0
          ? <div className="empty card card-pad"><div className="ei">💳</div><h3>No payments yet</h3><p>Payments appear here after you list a business, post a featured job, or subscribe as an admin.</p></div>
          : <div className="card card-pad" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ borderBottom: '2px solid var(--border)', color: '#5a7a60', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Purpose</th>
                  <th style={{ padding: '8px' }}>Amount</th>
                  <th style={{ padding: '8px' }}>M-Pesa Code</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Date</th>
                </tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px', textTransform: 'capitalize' }}>{(p.purpose||'').replace(/_/g,' ')}</td>
                      <td style={{ padding: '8px', fontWeight: 700, color: 'var(--green)' }}>KSh {p.amount?.toLocaleString()}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#5a7a60' }}>{p.mpesaCode||'—'}</td>
                      <td style={{ padding: '8px' }}><span className={`badge ${p.status==='completed'?'badge-green':p.status==='failed'?'badge-red':'badge-amber'}`}>{p.status}</span></td>
                      <td style={{ padding: '8px', color: '#5a7a60' }}>{formatDistanceToNow(new Date(p.createdAt),{addSuffix:true})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      )}

      {showAdminModal && <AdminModal onClose={() => setShowAdminModal(false)} />}
    </div>
  );
}
