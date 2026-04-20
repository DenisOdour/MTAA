import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const TYPES = [
  {k:'drainage',icon:'🚰',l:'Blocked Drainage'},{k:'garbage',icon:'🗑️',l:'Garbage Dumping'},
  {k:'water',icon:'💧',l:'Water Shortage'},{k:'drug_hotspot',icon:'💊',l:'Drug Hotspot'},
  {k:'power',icon:'🔌',l:'Power Outage'},{k:'road',icon:'🚧',l:'Road Damage'},
  {k:'noise',icon:'📢',l:'Noise Pollution'},{k:'crime',icon:'🚨',l:'Crime/Insecurity'},{k:'other',icon:'⚠️',l:'Other'}
];
const STATUS = { open:{l:'Open',c:'var(--red)',bg:'var(--red-light)'}, in_progress:{l:'In Progress',c:'var(--amber)',bg:'var(--amber-light)'}, resolved:{l:'✓ Resolved',c:'var(--green)',bg:'var(--green-light)'}, closed:{l:'Closed',c:'#5a7a60',bg:'var(--bg)'} };

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type:'', description:'', location:'', isAnonymous:true });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { API.get('/reports').then(({data})=>{ setReports(data.reports||[]); setLoading(false); }).catch(()=>setLoading(false)); }, []);

  const submit = async () => {
    if (!user) { toast.error('Login to submit a report'); return; }
    if (!form.type||!form.description||!form.location) { toast.error('Fill in type, description, and location'); return; }
    setSubmitting(true);
    try {
      const { data } = await API.post('/reports', form);
      toast.success('Report submitted! Local leaders notified ✓');
      setReports(prev => [data.report, ...prev]);
      setForm({ type:'', description:'', location:'', isAnonymous:true });
    } catch (err) { toast.error(err.response?.data?.message||'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const upvote = async (id) => {
    if (!user) { toast.error('Login to upvote'); return; }
    try {
      const { data } = await API.post(`/reports/${id}/upvote`);
      setReports(prev => prev.map(r => r._id===id ? {...r, upvotes: Array(data.upvotes).fill('')} : r));
    } catch {}
  };

  return (
    <div className="page-grid">
      <div className="left-sidebar">
        <div className="menu-section">Report Type</div>
        {TYPES.map(t=><button key={t.k} className={`menu-item ${form.type===t.k?'active':''}`} onClick={()=>setForm(p=>({...p,type:t.k}))}>{t.icon} {t.l}</button>)}
      </div>
      <div className="feed-col">
        <div style={{ background:'linear-gradient(135deg,#c0392b,#922b21)', borderRadius:'14px', padding:'1.25rem', color:'white' }}>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem' }}>📢 Community Problem Reporting</h1>
          <p style={{ opacity:.85, fontSize:'13px' }}>Reports go directly to local leaders and relevant authorities. You can report anonymously.</p>
        </div>
        <div className="card card-pad">
          <div className="font-syne" style={{ marginBottom:'12px' }}>Submit a New Report</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'12px' }}>
            {TYPES.map(t=><button key={t.k} onClick={()=>setForm(p=>({...p,type:t.k}))} style={{ padding:'6px 12px', borderRadius:'7px', border:`2px solid ${form.type===t.k?'var(--red)':'var(--border)'}`, background:form.type===t.k?'var(--red-light)':'white', color:form.type===t.k?'var(--red)':'#5a7a60', cursor:'pointer', fontWeight:600, fontSize:'12px', fontFamily:'DM Sans,sans-serif' }}>{t.icon} {t.l}</button>)}
          </div>
          <div className="form-group"><label className="form-label">Location / Landmark *</label><input className="form-input" placeholder="Where exactly? e.g. Near Kibera Line 7 junction" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} /></div>
          <div className="form-group"><label className="form-label">Describe the problem *</label><textarea className="form-input" rows={3} placeholder="What did you see?" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} /></div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', cursor:'pointer' }}><input type="checkbox" checked={form.isAnonymous} onChange={e=>setForm(p=>({...p,isAnonymous:e.target.checked}))} />Report anonymously</label>
            <button className="btn btn-danger btn-sm" style={{ marginLeft:'auto' }} onClick={submit} disabled={submitting}>{submitting?'…':'Submit Report →'}</button>
          </div>
        </div>
        <div className="font-syne" style={{ fontSize:'15px' }}>Recent Reports ({reports.length})</div>
        {loading ? <div className="flex-center" style={{ height:150 }}><div className="spinner" /></div>
          : reports.length===0 ? <div className="empty card card-pad"><div className="ei">📢</div><h3>No open reports</h3></div>
          : reports.map(r => {
            const rt = TYPES.find(t=>t.k===r.type);
            const st = STATUS[r.status]||STATUS.open;
            return (
              <div key={r._id} style={{ background:'white', borderRadius:'12px', border:'1px solid var(--border)', padding:'1rem', borderLeft:`4px solid ${r.status==='resolved'?'var(--green)':'var(--red)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'6px' }}>
                  <div style={{ fontWeight:700, fontSize:'14px' }}>{rt?.icon} {rt?.l||r.type} — {r.location}</div>
                  <span style={{ padding:'2px 8px', borderRadius:'5px', fontSize:'11px', fontWeight:700, background:st.bg, color:st.c, flexShrink:0, marginLeft:'8px' }}>{st.l}</span>
                </div>
                <p style={{ fontSize:'13px', color:'#4a5568', lineHeight:1.6, marginBottom:'8px' }}>{r.description}</p>
                {r.resolution&&<div style={{ background:'var(--green-light)', borderRadius:'6px', padding:'6px 10px', fontSize:'12px', color:'var(--green)', marginBottom:'8px' }}>Resolution: {r.resolution}</div>}
                <div style={{ display:'flex', alignItems:'center', gap:'10px', fontSize:'12px', color:'#5a7a60' }}>
                  <span>{formatDistanceToNow(new Date(r.createdAt),{addSuffix:true})}</span>
                  <button onClick={()=>upvote(r._id)} style={{ display:'flex', alignItems:'center', gap:'4px', background:'none', border:'1px solid var(--border)', borderRadius:'5px', padding:'3px 8px', cursor:'pointer', fontSize:'12px', color:'#5a7a60', fontFamily:'DM Sans' }}>👍 {r.upvotes?.length||0}</button>
                </div>
              </div>
            );
          })}
      </div>
      <div className="right-sidebar">
        <div className="card card-pad">
          <div className="font-syne" style={{ fontSize:'14px', marginBottom:'10px' }}>📊 Stats</div>
          {[{l:'Open',v:reports.filter(r=>r.status==='open').length,c:'var(--red)'},{l:'In Progress',v:reports.filter(r=>r.status==='in_progress').length,c:'var(--amber)'},{l:'Resolved',v:reports.filter(r=>r.status==='resolved').length,c:'var(--green)'}].map(s=>(
            <div key={s.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:'13px' }}><span style={{ color:'#5a7a60' }}>{s.l}</span><span style={{ fontWeight:700, color:s.c }}>{s.v}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
