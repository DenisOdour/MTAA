import React from 'react';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';

const EM_ICONS = { violence: '⚔️', fire: '🔥', medical: '🏥', missing_child: '👶', flood: '💧', other: '⚠️' };

export default function EmergencyBanner() {
  const { activeEmergency, setActiveEmergency } = useSocket();
  if (!activeEmergency) return null;

  return (
    <div className="em-banner">
      <div className="em-dot" />
      <span style={{ fontSize: '18px' }}>{EM_ICONS[activeEmergency.type] || '🚨'}</span>
      <div style={{ flex: 1 }}>
        <strong>EMERGENCY: {(activeEmergency.type || '').replace('_', ' ').toUpperCase()}</strong>
        {' — '}{activeEmergency.area || activeEmergency.location || 'your area'}
        {activeEmergency.timestamp && (
          <span style={{ opacity: 0.8, fontSize: '12px', marginLeft: '8px' }}>
            {formatDistanceToNow(new Date(activeEmergency.timestamp), { addSuffix: true })}
          </span>
        )}
        {activeEmergency.description && (
          <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>{activeEmergency.description}</div>
        )}
      </div>
      <button onClick={() => setActiveEmergency(null)}
        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px', flexShrink: 0, fontFamily: 'DM Sans' }}>
        Dismiss
      </button>
    </div>
  );
}
