import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ICONS = { tailoring:'✂️', coding:'💻', carpentry:'🪚', baking:'🧁', online_work:'🌍', masonry:'🧱', agriculture:'🌱', beauty:'💄', other:'🎓' };
const COLORS = { tailoring:'#6c3483', coding:'#1a5fa8', carpentry:'#9a7d0a', baking:'#e67e22', online_work:'#1a7a4a', masonry:'#5d6d7e', agriculture:'#1a7a4a', beauty:'#c0392b', other:'#5a7a60' };

export default function Skills() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [cat, setCat] = useState('all');
  const CATS = [{ key: 'all', label: '🎓 All' }, ...Object.entries(ICONS).map(([k,i]) => ({ key:k, label:`${i} ${k.replace('_',' ')}` }))];

  useEffect(() => {
    API.get('/skills').then(({ data }) => { if (data.courses?.length > 0) setCourses(data.courses); }).catch(() => {});
  }, []);

  const enroll = async (id) => {
    if (!user) { toast.error('Login to enroll'); return; }
    try {
      await API.post(`/skills/${id}/enroll`);
      toast.success('Enrolled! Details will be sent to your phone.');
      setCourses(prev => prev.map(c => c._id === id ? { ...c, enrollCount: (c.enrollCount||0)+1 } : c));
    } catch (err) { toast.error(err.response?.data?.message||'Enrollment failed'); }
  };

  const filtered = cat === 'all' ? courses : courses.filter(c => c.category === cat);

  return (
    <div className="page-grid">
      <div className="left-sidebar">
        <div className="menu-section">Category</div>
        {CATS.map(c => <button key={c.key} className={`menu-item ${cat===c.key?'active':''}`} onClick={()=>setCat(c.key)} style={{ textTransform:'capitalize' }}>{c.label}</button>)}
      </div>
      <div className="feed-col">
        <div style={{ background:'linear-gradient(135deg,#1a7a4a,#0d4a2e)', borderRadius:'14px', padding:'1.5rem', color:'white' }}>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.4rem', marginBottom:'6px' }}>🎓 Free Skills Training</h1>
          <p style={{ opacity:.85, fontSize:'13px', marginBottom:'14px' }}>Learn in-demand skills from local mentors, online videos, and certified training centres near you.</p>
          <div style={{ display:'flex', gap:'10px' }}>
            {[{v:courses.reduce((a,c)=>a+(c.enrollCount||0),0).toLocaleString(),l:'Enrolled'},{v:courses.length,l:'Courses'},{v:'FREE',l:'All Courses'}].map(s=>(
              <div key={s.l} style={{ background:'rgba(255,255,255,0.15)', borderRadius:'8px', padding:'8px 14px', textAlign:'center' }}>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'18px' }}>{s.v}</div>
                <div style={{ fontSize:'11px', opacity:.8 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="tabs">{CATS.slice(0,7).map(c=><button key={c.key} className={`tab ${cat===c.key?'active':''}`} onClick={()=>setCat(c.key)} style={{ textTransform:'capitalize' }}>{c.label}</button>)}</div>
        {filtered.length===0 ? <div className="empty card card-pad"><div className="ei">🎓</div><h3>No courses yet</h3></div>
          : filtered.map(course => {
            const color = COLORS[course.category]||'#1a7a4a';
            const icon = ICONS[course.category]||'🎓';
            return (
              <div key={course._id} style={{ background:'white', borderRadius:'14px', border:'1px solid var(--border)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
                <div style={{ background:`linear-gradient(135deg,${color},${color}cc)`, padding:'1rem', color:'white' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'6px' }}>
                    <span style={{ fontSize:'28px' }}>{icon}</span>
                    <div>
                      <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800 }}>{course.title}</div>
                      <div style={{ opacity:.85, fontSize:'12px', textTransform:'capitalize' }}>{course.category?.replace('_',' ')} · {course.type}</div>
                    </div>
                    <div style={{ marginLeft:'auto' }}><span style={{ background:'rgba(255,255,255,0.2)', padding:'3px 10px', borderRadius:'5px', fontSize:'12px', fontWeight:700 }}>{course.isFree ? 'FREE' : `KSh ${course.price}`}</span></div>
                  </div>
                  <div style={{ display:'flex', gap:'12px', fontSize:'12px', opacity:.9 }}>
                    <span>👥 {course.enrollCount||0} enrolled</span>
                    {course.rating>0&&<span>⭐ {course.rating.toFixed(1)}</span>}
                    {course.location&&<span>📍 {course.location}</span>}
                  </div>
                </div>
                <div style={{ padding:'12px' }}>
                  {course.instructorName&&<div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px', padding:'8px', background:'var(--bg)', borderRadius:'8px' }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'white' }}>{(course.instructorName||'M').slice(0,2).toUpperCase()}</div>
                    <div><div style={{ fontSize:'12px', fontWeight:700 }}>Mentor: {course.instructorName}</div><div style={{ fontSize:'11px', color:'#5a7a60' }}>Community trainer</div></div>
                  </div>}
                  {course.description&&<p style={{ fontSize:'13px', color:'#4a5568', lineHeight:1.6, marginBottom:'10px' }}>{course.description}</p>}
                  {course.videos?.length>0&&<div style={{ marginBottom:'10px' }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#5a7a60', marginBottom:'4px' }}>VIDEO LESSONS ({course.videos.length})</div>
                    {course.videos.slice(0,2).map((v,i)=><div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px', borderRadius:'7px', border:'1px solid var(--border)', marginBottom:'4px', cursor:'pointer' }} onClick={()=>toast.success(`Opening: ${v.title}`)}>
                      <span>▶️</span><div style={{ flex:1 }}><div style={{ fontSize:'12px', fontWeight:600 }}>{v.title}</div>{v.duration&&<div style={{ fontSize:'11px', color:'#5a7a60' }}>{v.duration}</div>}</div>
                    </div>)}
                  </div>}
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button className="btn btn-full" style={{ background:color, color:'white', border:'none' }} onClick={()=>enroll(course._id)}>{course.isFree?`Enroll Free — ${icon}`:`Enroll — KSh ${course.price}`}</button>
                    <button className="btn btn-ghost btn-sm" onClick={()=>toast('Saved for offline reading!')}>📥</button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      <div className="right-sidebar">
        <div className="card card-pad">
          <div className="font-syne" style={{ fontSize:'14px', marginBottom:'10px' }}>🏆 Most Popular</div>
          {[...courses].sort((a,b)=>(b.enrollCount||0)-(a.enrollCount||0)).slice(0,5).map((c,i)=>(
            <div key={c._id} style={{ display:'flex', gap:'8px', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, color:'var(--border)', fontSize:'16px', minWidth:'18px' }}>{i+1}</span>
              <span>{ICONS[c.category]||'🎓'}</span>
              <div style={{ flex:1 }}><div style={{ fontSize:'13px', fontWeight:500 }}>{c.title}</div><div style={{ fontSize:'11px', color:'#5a7a60' }}>👥 {c.enrollCount||0}</div></div>
            </div>
          ))}
        </div>
        <div className="card card-pad" style={{ background:'linear-gradient(135deg,#1a7a4a,#0d4a2e)', color:'white' }}>
          <div className="font-syne" style={{ marginBottom:'6px' }}>👨‍🏫 Become a Mentor</div>
          <p style={{ fontSize:'12px', opacity:.85, marginBottom:'12px' }}>Share your skills with your community. Apply to teach on Mtaa Connect.</p>
          <button className="btn btn-gold btn-full" onClick={()=>toast('Mentor applications coming soon!')}>Apply as Mentor →</button>
        </div>
      </div>
    </div>
  );
}
