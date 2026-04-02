import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', icon: '🏠', label: 'Home' },
  { path: '/policy', icon: '🛡️', label: 'Policy' },
  { path: '/trigger', icon: '⚡', label: 'Triggers' },
  { path: '/claims', icon: '📋', label: 'Claims' },
  { path: '/admin', icon: '⚙️', label: 'Admin' }
];

export default function BottomNav({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={styles.nav}>
      {NAV_ITEMS.map(item => {
        const active = location.pathname === item.path;
        return (
          <button key={item.path} style={styles.navItem} onClick={() => navigate(item.path)}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ ...styles.navLabel, color: active ? '#2563eb' : '#9ca3af', fontWeight: active ? 700 : 400 }}>
              {item.label}
            </span>
            {active && <div style={styles.activeLine} />}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-around', padding: '8px 0 12px', zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' },
  navItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '4px 8px' },
  navLabel: { fontSize: 10 },
  activeLine: { position: 'absolute', top: -9, left: '20%', right: '20%', height: 3, background: '#2563eb', borderRadius: '0 0 3px 3px' }
};
