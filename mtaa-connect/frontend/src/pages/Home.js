import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '📖', label: 'Community Stories',  desc: 'Share experiences, successes and challenges' },
  { icon: '💼', label: 'Job Alerts',          desc: 'Casual, construction, househelp & more' },
  { icon: '🗺️', label: 'Live Community Map',  desc: 'See jobs, businesses & emergencies near you' },
  { icon: '🆘', label: 'Emergency SOS',        desc: 'One tap alerts the whole community' },
  { icon: '🤝', label: 'Food & Donations',     desc: 'Connect families with NGOs & donors' },
  { icon: '🎓', label: 'Free Skills Training', desc: 'Tailoring, coding, baking & more' },
  { icon: '🏪', label: 'Business Directory',   desc: 'Discover local shops & get listed' },
  { icon: '🛡️', label: 'Safety Support',       desc: 'Confidential help for GBV & abuse' },
];

const STATS = [
  { value: '10,000+', label: 'Community Members' },
  { value: '500+',    label: 'Jobs Posted Monthly' },
  { value: '50+',     label: 'NGO Partners' },
  { value: '6',       label: 'Nairobi Estates' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0d1a0f 0%, #1a7a4a 55%, #0d4a2e 100%)' }}>
      {/* Nav */}
      <nav style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem' }}>
          <span style={{ color: '#4ade80' }}>Mtaa</span><span style={{ color: '#f1c40f' }}>Connect</span>
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/login"    style={{ padding: '8px 16px', borderRadius: '8px', color: '#9ca3af', border: '1px solid #374151', textDecoration: 'none', fontSize: '14px' }}>Login</Link>
          <Link to="/register" style={{ padding: '8px 16px', borderRadius: '8px', background: '#1a7a4a', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Join Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 1.5rem 2rem', textAlign: 'center', color: 'white' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(2.2rem, 7vw, 4.5rem)', lineHeight: 1.1, marginBottom: '1rem' }}>
          The Community Platform<br />Built for the <span style={{ color: '#f1c40f' }}>Mtaa</span>
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.85, maxWidth: 580, margin: '0 auto 2rem', lineHeight: 1.75 }}>
          Jobs, emergency alerts, food donations, skills training, a live community map, and more — completely free for communities across Kenya.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <button className="btn btn-gold btn-lg" onClick={() => navigate('/register')}>Join Free — Get Started →</button>
          <button className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }} onClick={() => navigate('/feed')}>Browse Stories</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '3rem' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', backdropFilter: 'blur(6px)' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: '#4ade80' }}>{s.value}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {FEATURES.map(f => (
            <div key={f.label}
              onClick={() => navigate('/register')}
              style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1.25rem', backdropFilter: 'blur(6px)', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{f.icon}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{f.label}</div>
              <div style={{ fontSize: '12px', opacity: 0.75 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '3rem', opacity: 0.5, fontSize: '13px' }}>
          Serving Kibera · Mathare · Korogocho · Mukuru · Huruma · Dandora and all slum communities across Kenya
        </div>
      </div>
    </div>
  );
}
