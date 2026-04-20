import React, { useState, useEffect, useCallback } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const CATS = [
  {key:'all',label:'💼 All'},{key:'casual',label:'🔧 Casual'},{key:'cleaning',label:'🧹 Cleaning'},
  {key:'construction',label:'🏗️ Construction'},{key:'househelp',label:'🏠 Househelp'},
  {key:'driving',label:'🚗 Driving'},{key:'security',label:'🔒 Security'},{key:'other',label:'📍 Other'},
];

function JobCard({ job, onApply }) {
  const { user } = useAuth();
  const hasApplied = job.applicants?.some(a => a === user?._id || a?._id === user?._id);
  const isFeatured = job.tier === 'featured' || job.tier === 'sponsored';
  return (
    <div style={{ background: isFeatured ? '#fef9e7' : 'white', borderRadius: '14px', border: `2px solid ${isFeatured ? '#f1c40f' : 'var(--border)'}`, padding: '1.1rem', marginBottom: '10px', boxShadow: 'var(--shadow)' }}>
      {isFeatured && <span className="badge badge-gold" style={{ marginBottom: '8px', display: 'inline-block' }}>⭐ {job.tier === 'sponsored' ? 'SPONSORED' : 'FEATURED'}</span>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem' }}>{job.title}</h3>
        <div style={{ fontWeight: 800, color: 'var(--green)', fontSize: '15px', flexShrink: 0, marginLeft: '8px' }}>{job.pay}</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', fontSize: '12px', color: '#5a7a60' }}>
        <span>📍 {job.location}</span>
        <span>👥 {job.slots || 1} slot(s)</span>
        <span className="badge badge-green">{job.category}</span>
        <span className="badge badge-blue">{job.payType || 'daily'}</span>
      </div>
      <p style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.6, marginBottom: '10px' }}>{job.description?.slice(0, 200)}{job.description?.length > 200 ? '…' : ''}</p>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
        <div style={{ flex: 1, fontSize: '12px', color: '#5a7a60' }}>{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}{job.applicants?.length > 0 ? ` · ${job.applicants.length} applied` : ''}</div>
        <button className="btn btn-primary btn-sm" onClick={() => onApply(job._id)} disabled={hasApplied} style={{ background: hasApplied ? 'var(--border)' : '', color: hasApplied ? '#5a7a60' : '' }}>
          {hasApplied ? '✓ Applied' : 'Apply →'}
        </button>
        {job.contact && <a href={`tel:${job.contact}`} className="btn btn-ghost btn-sm">📞</a>}
      </div>
    </div>
  );
}

function PostModal({ onClose, onPosted }) {
  const { user } = useAuth();
  const [f, setF] = useState({ title:'', description:'', category:'casual', location: user?.area||'', pay:'', contact: user?.phone||'', slots:1, tier:'free' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setF(p => ({...p, [k]: v}));

  const submit = async () => {
    if (!user) { toast.error('Login to post jobs'); return; }
    if (!f.title||!f.location||!f.pay||!f.contact) { toast.error('Fill required fields'); return; }
    setLoading(true);
    try {
      const { data } = await API.post('/jobs', f);
      if (f.tier !== 'free') {
        const amt = f.tier === 'featured' ? 500 : 2000;
        await API.post('/payments/initiate', { phone: user.phone, amount: amt, purpose: 'job_featured', metadata: { jobId: data.job._id, tier: f.tier } });
        toast.success(`Job posted! M-Pesa prompt sent for KSh ${amt}`);
      } else { toast.success('Job posted!'); }
      onPosted(data.job); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to post'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-title">💼 Post a Job</div>
        {[{k:'title',l:'Job Title *',ph:'e.g. House Cleaner, Fundi, Guard'},{k:'location',l:'Location *',ph:'Area/Estate'},{k:'pay',l:'Pay Rate *',ph:'KSh 800/day'},{k:'contact',l:'Contact Number *',ph:'+254 700 000 000'}].map(({k,l,ph}) => (
          <div key={k} className="form-group"><label className="form-label">{l}</label><input className="form-input" placeholder={ph} value={f[k]} onChange={e => set(k, e.target.value)} /></div>
        ))}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          <div className="form-group"><label className="form-label">Category</label><select className="form-input" value={f.category} onChange={e => set('category', e.target.value)}>{CATS.filter(c=>c.key!=='all').map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Slots Needed</label><input className="form-input" type="number" min="1" value={f.slots} onChange={e => set('slots', parseInt(e.target.value))} /></div>
        </div>
        <div className="form-group"><label className="form-label">Description *</label><textarea className="form-input" rows={3} placeholder="What does the job involve?" value={f.description} onChange={e => set('description', e.target.value)} /></div>
        <div style={{ background:'var(--bg)', borderRadius:'10px', padding:'12px', marginBottom:'14px' }}>
          <div style={{ fontWeight:700, fontSize:'13px', marginBottom:'8px' }}>📢 Listing Plan</div>
          {[{k:'free',l:'Free Listing',d:'Standard placement',p:'FREE'},{k:'featured',l:'🔵 Featured — 7 days',d:'Top of feed',p:'KSh 500'},{k:'sponsored',l:'⭐ Sponsored + SMS',d:'Top placement + SMS blast',p:'KSh 2,000'}].map(plan => (
            <label key={plan.k} style={{ display:'flex', gap:'10px', alignItems:'center', padding:'7px', borderRadius:'8px', cursor:'pointer', background: f.tier===plan.k ? 'var(--green-light)' : 'transparent', marginBottom:'3px' }}>
              <input type="radio" name="tier" checked={f.tier===plan.k} onChange={() => set('tier',plan.k)} />
              <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:'13px' }}>{plan.l}</div><div style={{ fontSize:'11px', color:'#5a7a60' }}>{plan.d}</div></div>
              <div style={{ fontWeight:700, color:'var(--green)', fontSize:'13px' }}>{plan.p}</div>
            </label>
          ))}
        </div>
        <button className="btn btn-primary btn-full" onClick={submit} disabled={loading}>{loading ? '…' : f.tier==='free' ? 'Post Job Free →' : 'Post & Pay via M-Pesa →'}</button>
      </div>
    </div>
  );
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const fetch = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const pg = reset ? 1 : page;
      const { data } = await API.get('/jobs', { params: { page: pg, limit: 10, category: cat !== 'all' ? cat : undefined } });
      setJobs(prev => reset ? data.jobs : [...prev, ...data.jobs]);
      setHasMore(pg < data.pages);
      if (!reset) setPage(pg + 1);
    } catch { toast.error('Failed to load jobs'); } finally { setLoading(false); }
  }, [cat, page]);

  useEffect(() => { setPage(1); fetch(true); }, [cat]);

  const apply = async (jobId) => {
    if (!user) { toast.error('Login to apply'); return; }
    try {
      const { data } = await API.post(`/jobs/${jobId}/apply`);
      toast.success(data.message);
      setJobs(prev => prev.map(j => j._id === jobId ? { ...j, applicants: [...(j.applicants||[]), user._id] } : j));
    } catch (err) { toast.error(err.response?.data?.message || 'Could not apply'); }
  };

  return (
    <div className="page-grid">
      <div className="left-sidebar">
        <div className="menu-section">Categories</div>
        {CATS.map(c => <button key={c.key} className={`menu-item ${cat===c.key?'active':''}`} onClick={() => setCat(c.key)}>{c.label}</button>)}
        <div className="divider" />
        <div style={{ padding:'0 14px' }}><button className="btn btn-primary btn-full" onClick={() => setShowModal(true)}>+ Post a Job</button></div>
        <div style={{ background:'var(--blue-light)', borderRadius:'10px', padding:'10px 12px', margin:'6px 14px', fontSize:'12px', color:'var(--blue)' }}>
          <strong>Pricing:</strong><br/>Free · Featured KSh 500/wk<br/>Sponsored+SMS KSh 2,000
        </div>
      </div>
      <div className="feed-col">
        <div style={{ background:'linear-gradient(135deg,#1a5fa8,#0d3d6e)', borderRadius:'14px', padding:'1.25rem', color:'white', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
          <div><h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem' }}>💼 Job Alerts</h1><p style={{ opacity:.85, fontSize:'13px' }}>Casual, construction, househelp & local opportunities</p></div>
          <button className="btn btn-gold" onClick={() => setShowModal(true)}>+ Post Job</button>
        </div>
        <div className="tabs">{CATS.map(c => <button key={c.key} className={`tab ${cat===c.key?'active':''}`} onClick={() => setCat(c.key)}>{c.label}</button>)}</div>
        {loading && jobs.length===0 ? <div className="flex-center" style={{ height:200 }}><div className="spinner" /></div>
          : jobs.length===0 ? <div className="empty card card-pad"><div className="ei">💼</div><h3>No jobs found</h3><p>Try a different category or post one!</p></div>
          : <>{jobs.map(j => <JobCard key={j._id} job={j} onApply={apply} />)}{hasMore && <button className="btn btn-secondary btn-full" onClick={() => fetch(false)} disabled={loading}>{loading?'…':'Load More'}</button>}</>}
      </div>
      <div className="right-sidebar">
        <div className="card card-pad" style={{ background:'linear-gradient(135deg,#1a5fa8,#0d3d6e)', color:'white' }}>
          <div className="font-syne" style={{ marginBottom:'6px' }}>🏢 Hiring?</div>
          <p style={{ fontSize:'12px', opacity:.85, marginBottom:'12px' }}>Reach thousands of job seekers across Nairobi. Free basic listing.</p>
          <button className="btn btn-gold btn-full" onClick={() => setShowModal(true)}>Post a Job Now →</button>
        </div>
        <div className="card card-pad">
          <div className="font-syne" style={{ fontSize:'13px', marginBottom:'8px' }}>💡 Job Tips</div>
          {['Apply early — spots fill fast','Keep your phone available','Carry valid ID to interviews','Be honest about experience'].map((t,i) => (
            <div key={i} style={{ display:'flex', gap:'8px', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:'12px', color:'#5a7a60' }}>
              <span style={{ color:'var(--green)', fontWeight:700 }}>{i+1}.</span>{t}
            </div>
          ))}
        </div>
      </div>
      {showModal && <PostModal onClose={() => setShowModal(false)} onPosted={j => setJobs(prev => [j, ...prev])} />}
    </div>
  );
}
