import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ sections }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="left-sidebar">
      {sections.map((section, i) => (
        <div key={i}>
          {section.title && <div className="menu-section">{section.title}</div>}
          {section.items.map(item => (
            item.divider ? <div key="div" className="divider" /> :
            item.component ? <div key={item.key}>{item.component}</div> :
            <button key={item.key || item.label}
              className={`menu-item ${(item.active !== undefined ? item.active : location.pathname === item.path) ? 'active' : ''}`}
              onClick={() => item.onClick ? item.onClick() : item.path && navigate(item.path)}>
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
