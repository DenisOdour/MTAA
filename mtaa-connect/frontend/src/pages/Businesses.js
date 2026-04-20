import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATS = [{k:'all',l:'🏪 All'},{k:'food',l:'🍗 Food'},{k:'salon',l:'💇 Salon'},{k:'barbershop',l:'✂️ Barber'},{k:'tech',l:'📱 Tech'},{k:'tailoring',l:'🧵 Tailoring'},{k:'health',l:'💊 Health'},{k:'transport',l:'🚗 Transport'},{k:'hardware',l:'🔨 Hardware'}];
const BIZ_ICON = {food:'🍗',salon:'💇',barbershop:'✂️',tech:'📱',tailoring:'🧵',health:'💊',transport:'🚗',hardware:'🔨',other:'🏪'};
const PLAN_STYLE = {basic:{l:'Basic',c:'#5a7a60',bg:'var(--bg)'},standard:{l:'Standard',c:'var(--blue)',bg:'var(--blue-light)'},premium:{l:'⭐ Premium',c:'#9a7d0a',bg:'#fef9e7'}};

export default function Businesses() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', category:'food', location:'', phone:'', description:'', plan:'basic' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    API.get('/businesses', { params:{ category: cat!=='all' ? cat : undefined } })
      .then(({data})=>{ setBusinesses(data.businesses||[]); setLoading(false); })
      .catch(()=>setLoading(false));
  }, [cat]);

  const listBiz = async () => {
    if (!user) { toast.error('Login to list your business'); return; }
    if (!form.name||!form.location||!form.phone) { toast.error('Fill required fields'); return; }
    setSubmitting(true);
    try {
      const { data } = await API.post('/businesses', form);
      const prices = {basic:500, standard:1200, premium:2000};
      await API.post('/payments/initiate', { phone:user.phone, amount:prices[form.plan], purpose:'business_listing', metadata:{ businessId:data.business._id, plan:form.plan } });
      toast.success('Business submitted! Pay via M-Pesa to activate listing.');
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message||'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const review = async (id) => {
    if (!user) { toast.error('Login to leave a review'); return; }
    const rating = window.prompt('Rate 1–5:');
    const comment = window.prompt('Comment (optional):');
    if (!rating||isNaN(parseInt(rating))) return;
    try {
      await API.post(`/businesses/${id}/review`, { rating:parseInt(rating), comment });
      toast.success('Review submitted!');
    } catch (err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  const filtered = search ? businesses.filter(b => b.name?.toLowerCase().includes(search.toLowerCase())||b.location?.toLowerCase().includes(search.toLowerCase())) : businesses;

  return (
    <div className="page-grid">
      <div className="left-sidebar">
        <div className="menu-section">Category</div>
        {CATS.map(c=><button key={c.k} className={`menu-item ${cat===c.k?'active':''}`} onClick={()=>setCat(c.k)}>{c.l}</button>)}
        <div className="divider" />
        <div style={{padding:'0 14px'}}><button className="btn btn-primary btn-full" onClick={()=>setShowModal(true)}>+ List Business</button></div>
      </div>
      <div className="feed-col">
        <div style={{background:'linear-gradient(135deg,#1a7a4a,#0d4a2e)',borderRadius:'14px',padding:'1.25rem',color:'white',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
          <div><h1 style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'1.3rem'}}>🏪 Local Business Directory</h1><p style={{opacity:.85,fontSize:'13px'}}>Discover and support local businesses in your mtaa</p></div>
          <button className="btn btn-gold" onClick={()=>setShowModal(true)}>+ List Yours</button>
        </div>
        <input className="form-input" placeholder="🔍  Search businesses…" value={search} onChange={e=>setSearch(e.target.value)} />
        <div className="tabs">{CATS.map(c=><button key={c.k} className={`tab ${cat===c.k?'active':''}`} onClick={()=>setCat(c.k)}>{c.l}</button>)}</div>
        {loading ? <div className="flex-center" style={{height:200}}><div className="spinner" /></div>
          : filtered.length===0 ? <div className="empty card card-pad"><div className="ei">🏪</div><h3>No businesses listed</h3><p>Be the first to list your business!</p><button className="btn btn-primary mt-1" onClick={()=>setShowModal(true)}>List Your Business →</button></div>
          : <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {filtered.map(b=>{
                const plan = PLAN_STYLE[b.plan]||PLAN_STYLE.basic;
                return (
                  <div key={b._id} style={{background:'white',borderRadius:'14px',border:`1px solid ${b.plan==='premium'?'#f1c40f':'var(--border)'}`,padding:'1rem',display:'flex',gap:'12px',boxShadow:'var(--shadow)'}}>
                    <div style={{width:50,height:50,borderRadius:'10px',background:'var(--green-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',flexShrink:0}}>{BIZ_ICON[b.category]||'🏪'}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'2px'}}>
                        <div style={{fontWeight:700,fontSize:'14px'}}>{b.name}</div>
                        {b.isVerified&&<span className="badge badge-green">✓</span>}
                        <span style={{marginLeft:'auto',fontSize:'10px',padding:'1px 7px',borderRadius:'3px',fontWeight:700,background:plan.bg,color:plan.c}}>{plan.l}</span>
                      </div>
                      <div style={{fontSize:'12px',color:'#5a7a60',marginBottom:'4px'}}>📍 {b.location} · {b.category}</div>
                      {b.description&&<p style={{fontSize:'13px',color:'#4a5568',marginBottom:'6px'}}>{b.description?.slice(0,80)}</p>}
                      <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                        {b.averageRating>0&&<span style={{fontSize:'12px',color:'var(--amber)'}}>⭐ {b.averageRating.toFixed(1)} ({b.reviewCount})</span>}
                        {b.phone&&<a href={`tel:${b.phone}`} className="btn btn-ghost btn-sm">📞 Call</a>}
                        <button className="btn btn-secondary btn-sm" onClick={()=>review(b._id)}>★ Review</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>}
      </div>
      <div className="right-sidebar">
        <div className="card card-pad" style={{background:'linear-gradient(135deg,#1a7a4a,#0d4a2e)',color:'white'}}>
          <div className="font-syne" style={{marginBottom:'6px'}}>💼 Grow Your Business</div>
          <p style={{fontSize:'12px',opacity:.85,marginBottom:'12px'}}>Get discovered by thousands in your community. From KSh 500/month.</p>
          <button className="btn btn-gold btn-full" onClick={()=>setShowModal(true)}>List Your Business →</button>
        </div>
        <div className="card card-pad">
          <div className="font-syne" style={{fontSize:'13px',marginBottom:'8px'}}>💰 Listing Plans</div>
          {[{p:'Basic',pr:'KSh 500/mo',f:'Listed in directory'},{p:'Standard',pr:'KSh 1,200/mo',f:'Photos + Reviews'},{p:'⭐ Premium',pr:'KSh 2,000/mo',f:'Top featured + Verified'}].map(item=>(
            <div key={item.p} style={{padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:'12px'}}><div style={{fontWeight:700}}>{item.p} — {item.pr}</div><div style={{color:'#5a7a60'}}>{item.f}</div></div>
          ))}
        </div>
      </div>
      {showModal&&(
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setShowModal(false)}>×</button>
            <div className="modal-title">🏪 List Your Business</div>
            {[{k:'name',l:'Business Name *',ph:'Your business name'},{k:'location',l:'Location *',ph:'Area/Estate'},{k:'phone',l:'Contact Number *',ph:'+254 700 000 000'}].map(({k,l,ph})=>(
              <div key={k} className="form-group"><label className="form-label">{l}</label><input className="form-input" placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} /></div>
            ))}
            <div className="form-group"><label className="form-label">Category</label><select className="form-input" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>{CATS.filter(c=>c.k!=='all').map(c=><option key={c.k} value={c.k}>{c.l}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} /></div>
            <div style={{background:'var(--bg)',borderRadius:'10px',padding:'12px',marginBottom:'14px'}}>
              <div style={{fontWeight:700,fontSize:'13px',marginBottom:'8px'}}>Choose Plan</div>
              {[{k:'basic',l:'Basic — KSh 500/mo',f:'Listed in directory'},{k:'standard',l:'Standard — KSh 1,200/mo',f:'Photos + reviews'},{k:'premium',l:'⭐ Premium — KSh 2,000/mo',f:'Top featured + verified'}].map(plan=>(
                <label key={plan.k} style={{display:'flex',gap:'10px',alignItems:'center',padding:'8px',borderRadius:'8px',cursor:'pointer',background:form.plan===plan.k?'var(--green-light)':'transparent',marginBottom:'3px'}}>
                  <input type="radio" name="bizplan" checked={form.plan===plan.k} onChange={()=>setForm(p=>({...p,plan:plan.k}))} />
                  <div><div style={{fontWeight:600,fontSize:'13px'}}>{plan.l}</div><div style={{fontSize:'11px',color:'#5a7a60'}}>{plan.f}</div></div>
                </label>
              ))}
            </div>
            <button className="btn btn-primary btn-full" onClick={listBiz} disabled={submitting}>{submitting?'…':'Submit & Pay via M-Pesa →'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
