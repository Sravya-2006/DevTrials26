import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Policy({ worker, token }) {
  const [activePolicy, setActivePolicy] = useState(null);
  const [premium, setPremium] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [selectedTier, setSelectedTier] = useState('medium');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [policyRes, premiumRes, historyRes] = await Promise.all([
      api.get('/policy/current', token),
      api.get('/premium/calculate', token),
      api.get('/policy/history', token)
    ]);
    if (policyRes.active_policy) setActivePolicy(policyRes.active_policy);
    if (premiumRes.riskLevel) { setPremium(premiumRes); setSelectedTier(premiumRes.riskLevel); }
    if (historyRes.policies) setHistory(historyRes.policies);
    setLoading(false);
  };

  const activatePolicy = async () => {
    setActivating(true);
    const res = await api.post('/policy/activate', { risk_level: selectedTier }, token);
    setActivating(false);
    if (res.policy) {
      setMessage(res.message);
      setActivePolicy(res.policy);
    } else {
      setMessage(res.error || 'Activation failed');
    }
  };

  const tiers = [
    { level: 'low', premium: 25, payout: 1000, label: 'Stable zone, dry season', color: '#22c55e', icon: '🟢' },
    { level: 'medium', premium: 45, payout: 2500, label: 'Metro city, monsoon', color: '#f59e0b', icon: '🟡' },
    { level: 'high', premium: 80, payout: 4500, label: 'Flood-prone, curfew history', color: '#ef4444', icon: '🔴' }
  ];

  if (loading) return <div style={styles.loading}>Loading policy details...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Insurance Policy</h2>

      {message && (
        <div style={styles.messageBanner}>{message}</div>
      )}

      {activePolicy ? (
        <div style={styles.activeCard}>
          <div style={styles.activeHeader}>
            <span style={{ fontSize: 32 }}>🛡️</span>
            <div>
              <p style={styles.activeLabel}>Active this week</p>
              <p style={styles.activeWeek}>
                {new Date(activePolicy.week_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} to {new Date(activePolicy.week_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <div style={styles.liveDot} />
          </div>
          <div style={styles.activeGrid}>
            <div style={styles.activeGridItem}>
              <p style={styles.gridVal}>₹{activePolicy.weekly_premium}</p>
              <p style={styles.gridLabel}>Premium paid</p>
            </div>
            <div style={styles.activeGridItem}>
              <p style={styles.gridVal}>₹{activePolicy.max_payout}</p>
              <p style={styles.gridLabel}>Max payout</p>
            </div>
            <div style={styles.activeGridItem}>
              <p style={{ ...styles.gridVal, textTransform: 'capitalize' }}>{activePolicy.risk_level}</p>
              <p style={styles.gridLabel}>Risk level</p>
            </div>
            <div style={styles.activeGridItem}>
              <p style={styles.gridVal}>{activePolicy.risk_score}/100</p>
              <p style={styles.gridLabel}>Risk score</p>
            </div>
          </div>
          <p style={styles.renewNote}>
            Renews next Sunday. You will get a reminder to confirm.
          </p>
        </div>
      ) : (
        <>
          {premium && (
            <div style={styles.aiCard}>
              <p style={styles.aiTitle}>🤖 AI Premium Analysis</p>
              <p style={styles.aiText}>Based on your zone, earning history and this week's weather forecast, your recommended tier is <strong style={{ textTransform: 'capitalize' }}>{premium.riskLevel}</strong>.</p>
              <div style={styles.breakdown}>
                {Object.entries(premium.breakdown).map(([key, val]) => (
                  <div key={key} style={styles.breakdownRow}>
                    <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                    <strong>{String(val)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3 style={styles.subTitle}>Select your plan</h3>
          {tiers.map(t => (
            <div key={t.level}
              style={{ ...styles.tierCard, border: selectedTier === t.level ? `2px solid ${t.color}` : '2px solid #e5e7eb', background: selectedTier === t.level ? t.color + '08' : '#fff' }}
              onClick={() => setSelectedTier(t.level)}>
              <div style={styles.tierLeft}>
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                <div>
                  <p style={{ ...styles.tierLevel, color: t.color }}>{t.level.toUpperCase()} RISK</p>
                  <p style={styles.tierLabel}>{t.label}</p>
                </div>
              </div>
              <div style={styles.tierRight}>
                <p style={styles.tierPremium}>₹{t.premium}<span style={styles.tierPer}>/wk</span></p>
                <p style={styles.tierPayout}>Up to ₹{t.payout}</p>
              </div>
            </div>
          ))}

          <button style={styles.activateBtn} onClick={activatePolicy} disabled={activating}>
            {activating ? 'Activating...' : '🛡️ Activate Weekly Shield'}
          </button>
        </>
      )}

      {history.length > 0 && (
        <div style={styles.historySection}>
          <h3 style={styles.subTitle}>Policy History</h3>
          {history.map(p => (
            <div key={p.id} style={styles.historyRow}>
              <div>
                <p style={styles.historyWeek}>
                  {new Date(p.week_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} to {new Date(p.week_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
                <p style={styles.historyMeta}>{p.risk_level} risk · ₹{p.weekly_premium}/week</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ ...styles.historyStatus, color: p.is_active ? '#22c55e' : '#6b7280' }}>
                  {p.is_active ? 'Active' : 'Expired'}
                </p>
                <p style={styles.historyPaid}>₹{Math.round(p.total_paid || 0)} received</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '20px 16px 80px', fontFamily: 'system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh' },
  loading: { textAlign: 'center', padding: 40, color: '#6b7280' },
  title: { margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#111827' },
  messageBanner: { background: '#ecfdf5', color: '#065f46', padding: '12px 14px', borderRadius: 10, marginBottom: 16, fontWeight: 500, fontSize: 14 },
  activeCard: { background: '#1e3a5f', borderRadius: 16, padding: 20, marginBottom: 20, color: '#fff' },
  activeHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  activeLabel: { margin: 0, fontSize: 12, opacity: 0.7 },
  activeWeek: { margin: 0, fontWeight: 600 },
  liveDot: { width: 10, height: 10, borderRadius: '50%', background: '#22c55e', marginLeft: 'auto', boxShadow: '0 0 8px #22c55e' },
  activeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14 },
  activeGridItem: { textAlign: 'center' },
  gridVal: { margin: 0, fontSize: 20, fontWeight: 700 },
  gridLabel: { margin: 0, fontSize: 11, opacity: 0.7 },
  renewNote: { margin: '14px 0 0', fontSize: 12, opacity: 0.7, textAlign: 'center' },
  aiCard: { background: '#eff6ff', borderRadius: 14, padding: 16, marginBottom: 20 },
  aiTitle: { margin: '0 0 8px', fontWeight: 700, color: '#1e40af' },
  aiText: { margin: '0 0 12px', fontSize: 14, color: '#374151' },
  breakdown: { background: '#fff', borderRadius: 10, padding: 12 },
  breakdownRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f3f4f6' },
  subTitle: { margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#111827' },
  tierCard: { borderRadius: 12, padding: 14, marginBottom: 12, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' },
  tierLeft: { display: 'flex', gap: 10, alignItems: 'center' },
  tierLevel: { margin: 0, fontWeight: 700, fontSize: 13 },
  tierLabel: { margin: 0, fontSize: 12, color: '#6b7280' },
  tierRight: { textAlign: 'right' },
  tierPremium: { margin: 0, fontWeight: 700, fontSize: 20 },
  tierPer: { fontSize: 12, fontWeight: 400 },
  tierPayout: { margin: 0, fontSize: 12, color: '#6b7280' },
  activateBtn: { width: '100%', padding: 14, borderRadius: 12, background: '#2563eb', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: 24 },
  historySection: { background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  historyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' },
  historyWeek: { margin: 0, fontWeight: 600, fontSize: 13 },
  historyMeta: { margin: 0, fontSize: 12, color: '#6b7280', textTransform: 'capitalize' },
  historyStatus: { margin: 0, fontSize: 12, fontWeight: 700 },
  historyPaid: { margin: 0, fontSize: 12, color: '#6b7280' }
};
