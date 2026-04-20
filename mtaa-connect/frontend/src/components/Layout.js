// ── Layout.js ─────────────────────────────────────
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import EmergencyModal from './EmergencyModal';

export default function Layout() {
  const [showEmergency, setShowEmergency] = useState(false);
  return (
    <>
      <Navbar onEmergency={() => setShowEmergency(true)} />
      <Outlet />
      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}
    </>
  );
}
