import React, { useState, useEffect, useCallback } from 'react';
import API from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', padding: '1rem', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
    <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
    <div style={{ fontSize: '28px', fontWeight: 800, color, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
    <div style={{ fontSize: '12px', color: '#5a7a60', marginTop: '4px' }}>{label}</div>
  </div>
);

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [pendingPosts, setPendingPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const [dashRes, postsRes] = await Promise.all([
        API.get('/admin/dashboard'),
        API.get('/posts/admin/pending'),
      ]);
      setStats(dashRes.data.stats || {});
      setPayments(dashRes.data.recentPayments || []);
      setPendingPosts(postsRes.data.posts || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadUsers = async (search = '') => {
    try {
      const { data } = await API.get('/admin/users', { params: { search, limit: 30 } });
      setUsers(data.users || []);
    } catch { toast.error('Failed to load users'); }
  };

  useEffect(() => {
    if (tab === 'users') loadUsers(userSearch);
  }, [tab, userSearch]);

  const moderate = async (postId, action, reason) => {
    try {
      await API.put(`/posts/${postId}/moderate`, { action, reason });
      setPendingPosts(prev => prev.filter(p => p._id !== postId));
      toast.success(`Post ${action}d successfully`);
    } catch { toast.error('Action failed'); }
  };

  const toggleBan = async (userId, ban) => {
    try {
      await API.put(`/admin/users/${userId}/ban`, { ban });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: ban } : u));
      toast.success(ban ? 'User banned' : 'User unbanned');
    } catch { toast.error('Action failed'); }
  };

  const TABS = [
    { k: 'overview',  l: '📊 Overview' },
    { k: 'posts',     l: `📝 Pending${pendingPosts.length > 0 ? ` (${pendingPosts.length})` : ''}` },
    { k: 'users',     l: '👥 Users' },
    { k: 'payments',  l: '💰 Payments' },
  ];

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem 1.5rem' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#0d1a0f,#1f3a23)', borderRadius: '14px', padding: '1.25rem 1.5rem', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', marginBottom: '4px' }}>⚙️ Admin Dashboard</h1>
          <p style={{ opacity: 0.7, fontSize: '13px' }}>Mtaa Connect Control Panel</p>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: '#4ade80' }}>{stats.totalUsers?.toLocaleString() || 0}</div>
            <div style={{ opacity: 0.7 }}>Total Users</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: '#f1c40f' }}>KSh {(stats.revenue || 0).toLocaleString()}</div>
            <div style={{ opacity: 0.7 }}>Revenue</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '22px', color: '#fb923c' }}>{stats.pendingPosts || 0}</div>
            <div style={{ opacity: 0.7 }}>Pending Posts</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1rem' }}>
        {TABS.map(t => <button key={t.k} className={`tab ${tab===t.k?'active':''}`} onClick={() => setTab(t.k)}>{t.l}</button>)}
      </div>

      {/* ── OVERVIEW ─────────────────────────────── */}
      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '1rem' }}>
            <StatCard icon="👥" label="Total Users"       value={stats.totalUsers||0}        color="#1a5fa8" />
            <StatCard icon="📖" label="Live Posts"         value={stats.approvedPosts||0}      color="#1a7a4a" />
            <StatCard icon="⏳" label="Pending Review"     value={stats.pendingPosts||0}       color="#e67e22" />
            <StatCard icon="💼" label="Active Jobs"         value={stats.activeJobs||0}         color="#6c3483" />
            <StatCard icon="🏪" label="Businesses"          value={stats.activeBusinesses||0}   color="#1a7a4a" />
            <StatCard icon="🚨" label="Active Emergencies"  value={stats.activeEmergencies||0}  color="#c0392b" />
            <StatCard icon="📢" label="Open Reports"        value={stats.openReports||0}        color="#e67e22" />
            <StatCard icon="💰" label="Revenue (KSh)"       value={stats.revenue||0}            color="#9a7d0a" />
          </div>

          {payments.length > 0 && (
            <div className="card card-pad">
              <div className="font-syne" style={{ marginBottom: '12px' }}>💰 Recent Payments</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead><tr style={{ borderBottom: '2px solid var(--border)', color: '#5a7a60', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>User</th>
                    <th style={{ padding: '8px' }}>Purpose</th>
                    <th style={{ padding: '8px' }}>Amount</th>
                    <th style={{ padding: '8px' }}>M-Pesa Code</th>
                    <th style={{ padding: '8px' }}>Date</th>
                  </tr></thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px' }}>{p.user?.name}<br /><span style={{ color: '#5a7a60', fontSize: '11px' }}>{p.user?.phone}</span></td>
                        <td style={{ padding: '8px' }}><span className="badge badge-green" style={{ textTransform: 'capitalize' }}>{(p.purpose||'').replace(/_/g,' ')}</span></td>
                        <td style={{ padding: '8px', fontWeight: 700, color: 'var(--green)' }}>KSh {p.amount?.toLocaleString()}</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '11px', color: '#5a7a60' }}>{p.mpesaCode||'—'}</td>
                        <td style={{ padding: '8px', color: '#5a7a60' }}>{formatDistanceToNow(new Date(p.createdAt),{addSuffix:true})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PENDING POSTS ─────────────────────────── */}
      {tab === 'posts' && (
        pendingPosts.length === 0
          ? <div className="empty card card-pad"><div className="ei">✅</div><h3>All clear! No pending posts.</h3></div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingPosts.map(post => (
                <div key={post._id} className="card card-pad">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem' }}>{post.title}</h3>
                      <div style={{ fontSize: '12px', color: '#5a7a60', marginTop: '2px' }}>
                        By: <strong>{post.author?.name}</strong> · {post.author?.phone} · {post.author?.area} · {formatDistanceToNow(new Date(post.createdAt),{addSuffix:true})}
                      </div>
                    </div>
                    <span className="badge badge-amber" style={{ textTransform: 'capitalize' }}>{post.category}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.6, marginBottom: '12px', borderLeft: '3px solid var(--border)', paddingLeft: '12px' }}>
                    {post.content?.slice(0, 400)}{post.content?.length > 400 ? '…' : ''}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => moderate(post._id, 'approve')}>✅ Approve</button>
                    <button className="btn btn-sm" style={{ background: '#fef9e7', color: '#9a7d0a', border: '1px solid #f1c40f' }} onClick={() => moderate(post._id, 'feature')}>⭐ Feature</button>
                    <button className="btn btn-danger btn-sm" onClick={() => { const r = window.prompt('Reason for rejection (shown to author):'); if (r !== null) moderate(post._id, 'reject', r); }}>❌ Reject</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => moderate(post._id, 'pin')}>📌 Pin</button>
                  </div>
                </div>
              ))}
            </div>
      )}

      {/* ── USERS ─────────────────────────────────── */}
      {tab === 'users' && (
        <>
          <input className="form-input" style={{ marginBottom: '12px' }} placeholder="🔍  Search by name, phone, or username…"
            value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          <div className="card card-pad" style={{ overflowX: 'auto' }}>
            {users.length === 0
              ? <div className="flex-center" style={{ height: 100 }}><div className="spinner" /></div>
              : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead><tr style={{ borderBottom: '2px solid var(--border)', color: '#5a7a60', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>User</th>
                    <th style={{ padding: '8px' }}>Phone</th>
                    <th style={{ padding: '8px' }}>Area</th>
                    <th style={{ padding: '8px' }}>Role</th>
                    <th style={{ padding: '8px' }}>Status</th>
                    <th style={{ padding: '8px' }}>Joined</th>
                    <th style={{ padding: '8px' }}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: '8px', color: '#5a7a60' }}>{u.phone}</td>
                        <td style={{ padding: '8px' }}>{u.area}</td>
                        <td style={{ padding: '8px' }}><span className={`badge ${u.role==='super_admin'?'badge-gold':u.role==='admin'?'badge-green':'badge-blue'}`} style={{ textTransform: 'capitalize' }}>{u.role?.replace('_',' ')}</span></td>
                        <td style={{ padding: '8px' }}><span className={`badge ${u.isBanned?'badge-red':'badge-green'}`}>{u.isBanned?'Banned':'Active'}</span></td>
                        <td style={{ padding: '8px', color: '#5a7a60', fontSize: '12px' }}>{formatDistanceToNow(new Date(u.createdAt),{addSuffix:true})}</td>
                        <td style={{ padding: '8px' }}>
                          <button className={`btn btn-sm ${u.isBanned?'btn-secondary':'btn-danger'}`} onClick={() => toggleBan(u._id, !u.isBanned)}>
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </>
      )}

      {/* ── PAYMENTS ──────────────────────────────── */}
      {tab === 'payments' && (
        <div className="card card-pad" style={{ overflowX: 'auto' }}>
          <div className="font-syne" style={{ marginBottom: '12px' }}>💰 All Payments</div>
          {payments.length === 0
            ? <div className="empty"><div className="ei">💳</div><h3>No payments yet</h3></div>
            : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr style={{ borderBottom: '2px solid var(--border)', color: '#5a7a60', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>User</th>
                  <th style={{ padding: '8px' }}>Purpose</th>
                  <th style={{ padding: '8px' }}>Amount</th>
                  <th style={{ padding: '8px' }}>M-Pesa</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Date</th>
                </tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px' }}>{p.user?.name}</td>
                      <td style={{ padding: '8px', textTransform: 'capitalize' }}>{(p.purpose||'').replace(/_/g,' ')}</td>
                      <td style={{ padding: '8px', fontWeight: 700, color: 'var(--green)' }}>KSh {p.amount?.toLocaleString()}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '11px' }}>{p.mpesaCode||'—'}</td>
                      <td style={{ padding: '8px' }}><span className={`badge ${p.status==='completed'?'badge-green':p.status==='failed'?'badge-red':'badge-amber'}`}>{p.status}</span></td>
                      <td style={{ padding: '8px', color: '#5a7a60', fontSize: '12px' }}>{formatDistanceToNow(new Date(p.createdAt),{addSuffix:true})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}
    </div>
  );
}
