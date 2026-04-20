import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const NEEDS_ICONS = { food:'🍚', clothes:'👕', medicine:'💊', school_supplies:'📚', hospital_fees:'🏥', shelter:'🏠', other:'🤝' };
const URGENCY = { low:{label:'Low',color:'var(--green)',bg:'var(--green-light)'}, medium:{label:'Medium',color:'var(--amber)',bg:'var(--amber-light)'}, urgent:{label:'URGENT',color:'var(--red)',bg:'var(--red-light)'} };

export default function Donations() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ area: user?.area||'', familySize:'', situation:'', needs:[], urgency:'medium', isAnonymous:false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { API.get('/donations').then(({data}) => { setDonations(data.donations||[]); setLoading(false); }).catch(()=>setLoading(false)); }, []);

  const toggleNeed = n => setForm(p => ({ ...p, needs: p.needs.includes(n) ? p.needs.filter(x=>x!==n) : [...p.needs,n] }));

  const submit = async () => {
    if (!user) { toast.error('Login to request support'); return; }
    if (!form.situation.trim()||form.needs.length===0) { toast.error('Describe your situation and select what you need'); return; }
    setSubmitting(true);
    try {
      const { data } = await API.post('/donations', form);
      toast.success('Request submitted! A community leader will verify it.');
      setDonations(prev => [data.donation, ...prev]);
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message||'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const respond = async (id, type) => {
    if (!user) { toast.error('Login to respond'); return; }
    try {
      if (type === 'donor') { toast.success('Thank you! Contact details sent.'); return; }
      const msg = window.prompt('Message to the family (optional):');
      await API.post(`/donations/${id}/respond`, { message: msg||'We can help.' });
      toast.success('Response recorded! The family will be contacted.');
    } catch { toast.error('Failed to respond'); }
  };

  const filtered = filter==='all' ? donations : donations.filter(d=>d.urgency===filter);

  return (
    <div className="page-grid">
      <div className="left-sidebar">
        <div className="menu-section">Filter</div>
        {[{k:'all',l:'🌍 All'},{k:'urgent',l:'🔴 Urgent'},{k:'medium',l:'🟡 Medium'},{k:'low',l:'🟢 Low'}].map(f=>(
          <button key={f.k} className={`menu-item ${filter===f.k?'active':''}`} onClick={()=>setFilter(f.k)}>{f.l}</button>
        ))}
        <div className="divider" />
        <div style={{ padding:'0 14px' }}><button className="btn btn-amber btn-full" onClick={()=>setShowModal(true)}>Request Support</button></div>
      </div>
      <div className="feed-col">
        <div style={{ background:'linear-gradient(135deg,#e67e22,#ca6f1e)', borderRadius:'14px', padding:'1.25rem', color:'white', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
          <div><h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem' }}>🤝 Food & Donations</h1><p style={{ opacity:.85, fontSize:'13px' }}>Connect families in need with NGOs and generous donors</p></div>
          <button className="btn btn-lg" style={{ background:'white', color:'var(--amber)', fontWeight:700 }} onClick={()=>setShowModal(true)}>Request Help</button>
        </div>
        <div style={{ background:'var(--green-light)', border:'1px solid var(--green)', borderRadius:'10px', padding:'12px', fontSize:'13px', color:'var(--green)' }}>
          <strong>For NGOs and Donors:</strong> Browse verified requests below and click "Respond as NGO" to offer help.
        </div>
        <div className="tabs">{[{k:'all',l:'🌍 All'},{k:'urgent',l:'🔴 Urgent'},{k:'medium',l:'🟡 Medium'},{k:'low',l:'🟢 Low'}].map(f=><button key={f.k} className={`tab ${filter===f.k?'active':''}`} onClick={()=>setFilter(f.k)}>{f.l}</button>)}</div>
        {loading ? <div className="flex-center" style={{ height:200 }}><div className="spinner" /></div>
          : filtered.length===0 ? <div className="empty card card-pad"><div className="ei">🤝</div><h3>No active requests</h3><p>All caught up!</p></div>
          : filtered.map(d => {
            const urg = URGENCY[d.urgency]||URGENCY.medium;
            return (
              <div key={d._id} style={{ background:'white', borderRadius:'14px', border:`2px solid ${urg.color}33`, padding:'1.1rem', boxShadow:'var(--shadow)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                  <div style={{ fontSize:'32px' }}>{NEEDS_ICONS[d.needs?.[0]]||'🤝'}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:'14px' }}>Family of {d.familySize||'?'} — {d.area}</div>
                    <div style={{ fontSize:'12px', color:'#5a7a60' }}>{formatDistanceToNow(new Date(d.createdAt),{addSuffix:true})}{d.status==='verified'&&<span style={{ marginLeft:'6px', color:'var(--green)', fontWeight:600 }}>✓ Verified</span>}</div>
                  </div>
                  <span style={{ padding:'3px 9px', borderRadius:'5px', fontSize:'11px', fontWeight:700, background:urg.bg, color:urg.color }}>{urg.label}</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', marginBottom:'8px' }}>
                  {d.needs?.map(n=><span key={n} style={{ background:'var(--amber-light)', color:'var(--amber)', padding:'2px 8px', borderRadius:'5px', fontSize:'11px', fontWeight:600 }}>{NEEDS_ICONS[n]} {n.replace('_',' ')}</span>)}
                </div>
                <p style={{ fontSize:'13px', color:'#4a5568', lineHeight:1.6, marginBottom:'10px' }}>{d.situation}</p>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button className="btn btn-amber btn-sm" onClick={()=>respond(d._id,'ngo')}>🤝 Respond as NGO</button>
                  <button className="btn btn-primary btn-sm" onClick={()=>respond(d._id,'donor')}>💝 Donate Directly</button>
                </div>
              </div>
            );
          })}
      </div>
      <div className="right-sidebar">
        <div className="card card-pad"><div className="font-syne" style={{ fontSize:'14px', marginBottom:'10px' }}>📊 Overview</div>
          {[{l:'Total Requests',v:donations.length,c:'var(--amber)'},{l:'Urgent',v:donations.filter(d=>d.urgency==='urgent').length,c:'var(--red)'},{l:'Responded to',v:donations.filter(d=>d.responses?.length>0).length,c:'var(--green)'}].map(s=>(
            <div key={s.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:'13px' }}>
              <span style={{ color:'#5a7a60' }}>{s.l}</span><span style={{ fontWeight:700, color:s.c }}>{s.v}</span>
            </div>
          ))}
        </div>
        <div className="card card-pad" style={{ background:'linear-gradient(135deg,#e67e22,#ca6f1e)', color:'white' }}>
          <div className="font-syne" style={{ marginBottom:'6px' }}>💝 Are you an NGO?</div>
          <p style={{ fontSize:'12px', opacity:.85, marginBottom:'12px' }}>Register to see all verified requests and connect directly with families.</p>
          <button className="btn btn-lg btn-full" style={{ background:'white', color:'var(--amber)', fontWeight:700 }} onClick={()=>setShowModal(true)}>Register as NGO →</button>
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setShowModal(false)}>×</button>
            <div className="modal-title">🤝 Request Community Support</div>
            <div style={{ background:'var(--green-light)', borderRadius:'8px', padding:'10px', fontSize:'13px', color:'var(--green)', marginBottom:'14px' }}>Your request will be verified by a community leader before going live. Your privacy is protected.</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <div className="form-group"><label className="form-label">Area *</label><input className="form-input" placeholder="Your location" value={form.area} onChange={e=>setForm(p=>({...p,area:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Family Size</label><input className="form-input" type="number" placeholder="e.g. 5" value={form.familySize} onChange={e=>setForm(p=>({...p,familySize:e.target.value}))} /></div>
            </div>
            <div className="form-group"><label className="form-label">What do you need? *</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'6px' }}>
                {Object.entries(NEEDS_ICONS).map(([k,icon])=>(
                  <button key={k} onClick={()=>toggleNeed(k)} style={{ padding:'5px 10px', borderRadius:'7px', border:`2px solid ${form.needs.includes(k)?'var(--amber)':'var(--border)'}`, background:form.needs.includes(k)?'var(--amber-light)':'white', color:form.needs.includes(k)?'var(--amber)':'#5a7a60', cursor:'pointer', fontSize:'12px', fontWeight:600, fontFamily:'DM Sans,sans-serif' }}>{icon} {k.replace('_',' ')}</button>
                ))}
              </div>
            </div>
            <div className="form-group"><label className="form-label">Your situation *</label><textarea className="form-input" rows={4} placeholder="Describe your situation and why you need help..." value={form.situation} onChange={e=>setForm(p=>({...p,situation:e.target.value}))} /></div>
            <div style={{ display:'flex', gap:'12px', marginBottom:'14px' }}>
              {['low','medium','urgent'].map(u=><label key={u} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'13px', cursor:'pointer', color:URGENCY[u].color, fontWeight:600 }}><input type="radio" name="urgency" value={u} checked={form.urgency===u} onChange={e=>setForm(p=>({...p,urgency:e.target.value}))} />{u.charAt(0).toUpperCase()+u.slice(1)}</label>)}
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', cursor:'pointer', marginBottom:'14px' }}><input type="checkbox" checked={form.isAnonymous} onChange={e=>setForm(p=>({...p,isAnonymous:e.target.checked}))} />Post anonymously</label>
            <button className="btn btn-amber btn-full" onClick={submit} disabled={submitting}>{submitting?'…':'Submit Request →'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
