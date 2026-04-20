import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

// Fix Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const mkIcon = (emoji, bg) => L.divIcon({
  html: `<div style="background:${bg};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${emoji}</div>`,
  className: '', iconSize: [34, 34], iconAnchor: [17, 17],
});

const ICONS = {
  myLocation: mkIcon('📍', '#c0392b'),
  job:        mkIcon('💼', '#1a5fa8'),
  report:     mkIcon('📢', '#e67e22'),
  user:       mkIcon('👤', '#6c3483'),
  admin:      mkIcon('👮', '#1a7a4a'),
  biz: {
    food: mkIcon('🍗','#e67e22'), salon: mkIcon('💇','#e91e8c'),
    tech: mkIcon('📱','#1a5fa8'), barbershop: mkIcon('✂️','#1a7a4a'),
    default: mkIcon('🏪','#1a7a4a'),
  },
  em: {
    violence: mkIcon('⚔️','#c0392b'), fire: mkIcon('🔥','#e74c3c'),
    medical:  mkIcon('🏥','#2980b9'), missing_child: mkIcon('👶','#8e44ad'),
    default:  mkIcon('🚨','#c0392b'),
  },
};

function LocateMe({ onFound }) {
  const map = useMap();
  useEffect(() => {
    map.locate({ setView: false });
    map.on('locationfound', e => onFound([e.latlng.lat, e.latlng.lng]));
  }, [map, onFound]);
  return null;
}

const DEFAULT_CENTER = [-1.2921, 36.8219];

export default function MapPage() {
  const { user, isAdmin } = useAuth();
  const { liveLocations, emitLocation } = useSocket();
  const [data, setData] = useState({ businesses:[], jobs:[], emergencies:[], reports:[], users:[] });
  const [myPos, setMyPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(user?.shareLocation || false);
  const [layers, setLayers] = useState({ businesses:true, jobs:true, emergencies:true, reports:true, users:true });

  const loadMap = useCallback(async (lat, lng) => {
    try {
      const { data: res } = await API.get('/maps/overview', {
        params: { lat: lat || DEFAULT_CENTER[0], lng: lng || DEFAULT_CENTER[1], radius: 15000 }
      });
      setData(res.layers || {});
    } catch { /* show empty map */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => { const { latitude: lat, longitude: lng } = pos.coords; setMyPos([lat, lng]); loadMap(lat, lng); },
      () => loadMap()
    );
  }, [loadMap]);

  const toggleSharing = async () => {
    if (!user) { toast.error('Login to share your location'); return; }
    const next = !sharing;
    try {
      if (myPos) {
        await API.post('/maps/update-location', { lat: myPos[0], lng: myPos[1], shareLocation: next });
        if (next) emitLocation(myPos[0], myPos[1]);
      }
      setSharing(next);
      toast.success(next ? '📍 Location sharing enabled' : '📍 Location sharing disabled');
    } catch { toast.error('Failed to update location settings'); }
  };

  const allUsers = [
    ...(data.users || []),
    ...Object.values(liveLocations).filter(l =>
      !(data.users||[]).find(u => u.id === l.userId)
    )
  ];

  const LAYER_DEFS = [
    { key: 'businesses',  icon: '🏪', label: 'Businesses', count: (data.businesses||[]).length },
    { key: 'jobs',        icon: '💼', label: 'Jobs',        count: (data.jobs||[]).length },
    { key: 'emergencies', icon: '🚨', label: 'Emergencies', count: (data.emergencies||[]).length },
    { key: 'reports',     icon: '📢', label: 'Reports',     count: (data.reports||[]).length },
    { key: 'users',       icon: '👥', label: 'People',      count: allUsers.length },
  ];

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '1rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem' }}>🗺️ Community Map</h1>
          <p style={{ color: '#5a7a60', fontSize: '13px' }}>Live view of jobs, businesses, reports & emergencies in your mtaa</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {isAdmin && (
            <span style={{ background: '#e8f5ee', color: '#1a7a4a', padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600 }}>
              👁️ Admin: viewing {allUsers.length} user(s)
            </span>
          )}
          <button onClick={toggleSharing} className={`btn btn-sm ${sharing ? 'btn-danger' : 'btn-secondary'}`}>
            {sharing ? '🔴 Stop Sharing' : '📍 Share My Location'}
          </button>
        </div>
      </div>

      {/* Layer toggles */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {LAYER_DEFS.map(layer => (
          <button key={layer.key} onClick={() => setLayers(prev => ({ ...prev, [layer.key]: !prev[layer.key] }))}
            style={{
              padding: '6px 12px', borderRadius: '7px', border: '1.5px solid', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
              borderColor: layers[layer.key] ? '#1a7a4a' : 'var(--border)',
              background:  layers[layer.key] ? 'var(--green-light)' : 'white',
              color:       layers[layer.key] ? '#1a7a4a' : '#5a7a60',
            }}>
            {layer.icon} {layer.label}
            <span style={{ marginLeft: 5, background: layers[layer.key] ? '#1a7a4a' : 'var(--border)', color: layers[layer.key] ? 'white' : '#5a7a60', borderRadius: '4px', padding: '0px 5px', fontSize: '10px' }}>
              {layer.count}
            </span>
          </button>
        ))}
      </div>

      {/* Map + Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '12px' }}>
        <div className="map-wrap">
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: '12px' }}>
              <div className="spinner" />
              <p style={{ color: '#5a7a60', fontSize: '14px' }}>Loading community map…</p>
            </div>
          ) : (
            <MapContainer center={myPos || DEFAULT_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              <LocateMe onFound={pos => { setMyPos(pos); loadMap(pos[0], pos[1]); }} />

              {/* My location */}
              {myPos && (
                <>
                  <Marker position={myPos} icon={ICONS.myLocation}>
                    <Popup><strong>📍 You are here</strong><br />{user?.area || 'Your location'}</Popup>
                  </Marker>
                  <Circle center={myPos} radius={300} pathOptions={{ color: '#1a7a4a', fillOpacity: 0.05 }} />
                </>
              )}

              {/* Businesses */}
              {layers.businesses && (data.businesses||[]).map(b => {
                if (!b.coordinates?.length) return null;
                const pos = [b.coordinates[1], b.coordinates[0]];
                return (
                  <Marker key={b.id} position={pos} icon={ICONS.biz[b.category] || ICONS.biz.default}>
                    <Popup>
                      <strong>{b.name}</strong><br />
                      <span style={{ color: '#5a7a60', fontSize: '12px' }}>{b.category} · {b.location}</span>
                      {b.rating > 0 && <><br />⭐ {b.rating?.toFixed(1)}</>}
                      {b.plan === 'premium' && <span style={{ marginLeft: 6, background: '#fef9e7', color: '#9a7d0a', fontSize: '10px', padding: '1px 5px', borderRadius: '3px' }}>PREMIUM</span>}
                    </Popup>
                  </Marker>
                );
              })}

              {/* Jobs */}
              {layers.jobs && (data.jobs||[]).map(j => {
                if (!j.coordinates?.length) return null;
                return (
                  <Marker key={j.id} position={[j.coordinates[1], j.coordinates[0]]} icon={ICONS.job}>
                    <Popup>
                      <strong>💼 {j.title}</strong><br />
                      <span style={{ color: '#1a7a4a', fontWeight: 700 }}>{j.pay}</span><br />
                      <span style={{ fontSize: '12px', color: '#5a7a60' }}>{j.location} · {j.category}</span>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Emergencies */}
              {layers.emergencies && (data.emergencies||[]).map(e => {
                if (!e.coordinates?.length) return null;
                const pos = [e.coordinates[1], e.coordinates[0]];
                return (
                  <React.Fragment key={e.id}>
                    <Marker position={pos} icon={ICONS.em[e.emergencyType] || ICONS.em.default}>
                      <Popup>
                        <strong style={{ color: '#c0392b' }}>🚨 {(e.emergencyType||'').replace('_',' ').toUpperCase()}</strong><br />
                        <span style={{ fontSize: '12px', color: '#5a7a60' }}>{e.area} · Severity: {e.severity}</span>
                      </Popup>
                    </Marker>
                    <Circle center={pos} radius={400} pathOptions={{ color: '#c0392b', fillColor: '#c0392b', fillOpacity: 0.08 }} />
                  </React.Fragment>
                );
              })}

              {/* Community Reports */}
              {layers.reports && (data.reports||[]).map(r => {
                if (!r.coordinates?.length) return null;
                return (
                  <Marker key={r.id} position={[r.coordinates[1], r.coordinates[0]]} icon={ICONS.report}>
                    <Popup>
                      <strong>📢 {(r.reportType||'').replace('_',' ')}</strong><br />
                      <span style={{ fontSize: '12px', color: '#5a7a60' }}>{r.location}</span><br />
                      <span style={{ fontSize: '11px' }}>👍 {r.upvotes} upvotes · {r.status}</span>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Live users */}
              {layers.users && allUsers.map(u => {
                const coords = u.coordinates || u.location?.coordinates;
                if (!coords?.length) return null;
                return (
                  <Marker key={u.id || u.userId} position={[coords[1], coords[0]]} icon={u.role === 'admin' || u.role === 'super_admin' ? ICONS.admin : ICONS.user}>
                    <Popup>
                      <strong>{u.name}</strong><br />
                      <span style={{ fontSize: '12px', color: '#5a7a60' }}>📍 {u.area}</span>
                      {(u.role === 'admin' || u.role === 'super_admin') && (
                        <><br /><span style={{ fontSize: '10px', background: '#e8f5ee', color: '#1a7a4a', padding: '1px 5px', borderRadius: '3px' }}>ADMIN</span></>
                      )}
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Legend */}
          <div className="card card-pad">
            <div className="font-syne" style={{ fontSize: '14px', marginBottom: '10px' }}>Map Legend</div>
            {[
              { icon: '📍', label: 'My Location',      color: '#c0392b' },
              { icon: '🏪', label: 'Businesses',        color: '#1a7a4a' },
              { icon: '💼', label: 'Jobs',               color: '#1a5fa8' },
              { icon: '🚨', label: 'Emergency Alerts',  color: '#c0392b' },
              { icon: '📢', label: 'Community Reports', color: '#e67e22' },
              { icon: '👥', label: 'Community Members', color: '#6c3483' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                <span>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              </div>
            ))}
          </div>

          {/* Area Stats */}
          <div className="card card-pad">
            <div className="font-syne" style={{ fontSize: '14px', marginBottom: '10px' }}>📊 Area Stats</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Businesses', value: (data.businesses||[]).length, color: '#1a7a4a' },
                { label: 'Open Jobs',  value: (data.jobs||[]).length,       color: '#1a5fa8' },
                { label: 'Alerts',     value: (data.emergencies||[]).length, color: '#c0392b' },
                { label: 'Reports',    value: (data.reports||[]).length,     color: '#e67e22' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, fontFamily: 'Syne, sans-serif' }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: '#5a7a60' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active emergencies */}
          {(data.emergencies||[]).length > 0 && (
            <div className="card card-pad" style={{ borderLeft: '3px solid #c0392b' }}>
              <div className="font-syne" style={{ fontSize: '13px', color: '#c0392b', marginBottom: '8px' }}>🚨 Active Alerts</div>
              {(data.emergencies||[]).slice(0, 3).map(e => (
                <div key={e.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--red-light)', fontSize: '12px' }}>
                  <strong>{(e.emergencyType||'').replace('_',' ').toUpperCase()}</strong> — {e.area}
                  <div style={{ color: '#5a7a60', textTransform: 'capitalize' }}>{e.status} · {e.severity}</div>
                </div>
              ))}
            </div>
          )}

          {/* Location sharing status */}
          <div style={{ background: sharing ? 'var(--green-light)' : 'var(--bg)', border: `1px solid ${sharing ? '#1a7a4a' : 'var(--border)'}`, borderRadius: '10px', padding: '12px', fontSize: '13px' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px', color: sharing ? '#1a7a4a' : '#5a7a60' }}>
              {sharing ? '📍 Sharing: ON' : '📍 Sharing: OFF'}
            </div>
            <p style={{ fontSize: '12px', color: '#5a7a60' }}>
              {sharing
                ? 'Your location is visible to community admins on this map.'
                : 'Enable to help admins find you during emergencies.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
