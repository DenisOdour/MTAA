import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem', background: 'var(--bg)' }}>
      <div>
        <div style={{ fontSize: '72px', marginBottom: '16px' }}>🗺️</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '2rem', marginBottom: '8px' }}>Page Not Found</h1>
        <p style={{ color: '#5a7a60', marginBottom: '20px', fontSize: '15px' }}>This road doesn't exist in the mtaa.</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>Go Home →</button>
      </div>
    </div>
  );
}
