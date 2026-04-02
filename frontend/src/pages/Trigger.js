import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const TRIGGER_TYPES = [
  { code: 'T1', icon: '🌧️', label: 'Heavy Rain / Flood', event: 'IMD Red Alert - Heavy Rainfall', color: '#2563eb' },
  { code: 'T2', icon: '🌫️', label: 'Severe Pollution AQI 400+', event: 'CPCB Severe Pollution Alert - AQI 450', color: '#7c3aed' },
  { code: 'T3', icon: '🚔', label: 'Curfew / Bandh', event: 'Section 144 Declared - Local Protest', color: '#dc2626' },
  { code: 'T4', icon: '📦', label: 'Platform Suspension', event: 'Amazon Flex Zone Suspension', color: '#d97706' }
];

export default function Trigger({ worker, token }) {
  const [activeTriggers, setActiveTriggers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetchActiveTriggers();
  }, []);

  const fetchActiveTriggers = async () => {
    const res = await api.get(`/triggers/zone/${worker?.zone_pincode || '560001'}`, token);
    if (res.active_triggers) setActiveTriggers(res.active_triggers);
  };

  const fireManualTrigger = async (trigger) => {
    setLoading(true);
    setResult(null);
    const res = await api.post('/claims/trigger-manual', {
      trigger_type: trigger.code,
      trigger_event: trigger.event,
      trigger_zone: worker?.zone_pincode || '560001'
    }, token);
    setLoading(false);
    setResult(res);
  };

  const runAutoCheck = async () => {
    setRunning(true);
    const res = await api.post('/claims/run-trigger-check', {}, token);
    setRunning(false);
    alert(res.message || 'Trigger check complete. Check your claims.');
    fetchActiveTriggers();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Live Trigger Monitor</h2>
      <p style={styles.sub}>Your zone: <strong>{worker?.zone_pincode || '560001'}</strong> · Refreshes every 15 minutes</p>

      {activeTriggers.length > 0 ? (
        <div style={styles.activeAlert}>
          <p style={styles.alertTitle}>🚨 {activeTriggers.length} Active Alert{activeTriggers.length > 1 ? 's' : ''} in Your Zone</p>
          {activeTriggers.map((t, i) => (
            <div key={i} style={styles.alertItem}>
              <strong>{t.name}</strong>
              <p style={styles.alertDesc}>{t.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.allClearBox}>
          <span style={{ fontSize: 36 }}>✅</span>
          <p style={styles.allClearText}>All clear in your zone</p>
          <p style={styles.allClearSub}>No active calamities detected right now</p>
        </div>
      )}

      <button style={styles.autoBtn} onClick={runAutoCheck} disabled={running}>
        {running ? '⏳ Running check...' : '🔄 Run Trigger Check Now'}
      </button>

      <h3 style={styles.sectionTitle}>Simulate a Trigger (Demo)</h3>
      <p style={styles.demoNote}>Use these buttons to simulate what happens when a real calamity hits your zone</p>

      {result && (
        <div style={{ ...styles.resultBox, background: result.claim ? '#ecfdf5' : '#fef2f2', borderColor: result.claim ? '#22c55e' : '#ef4444' }}>
          <p style={styles.resultMessage}>{result.message}</p>
          {result.payout_details && (
            <div style={styles.resultDetails}>
              <div style={styles.resultRow}>
                <span>Estimated loss</span>
                <strong>₹{result.payout_details.estimated_loss}</strong>
              </div>
              <div style={styles.resultRow}>
                <span>Payout amount</span>
                <strong style={{ color: '#22c55e' }}>₹{result.payout_details.payout_amount}</strong>
              </div>
              <div style={styles.resultRow}>
                <span>Trigger time</span>
                <strong>{result.payout_details.is_peak_hours ? '⚡ Peak hours (1.4x)' : 'Off-peak (0.6x)'}</strong>
              </div>
              <div style={styles.resultRow}>
                <span>Fraud tier</span>
                <strong>{result.fraud_check?.tier} (score: {result.fraud_check?.fraud_score})</strong>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={styles.triggerGrid}>
        {TRIGGER_TYPES.map(t => (
          <button
            key={t.code}
            style={{ ...styles.triggerCard, borderColor: t.color, opacity: loading ? 0.6 : 1 }}
            onClick={() => fireManualTrigger(t)}
            disabled={loading}>
            <span style={{ fontSize: 36 }}>{t.icon}</span>
            <p style={{ ...styles.triggerCode, color: t.color }}>{t.code}</p>
            <p style={styles.triggerLabel}>{t.label}</p>
            <div style={{ ...styles.fireBtn, background: t.color }}>
              {loading ? 'Firing...' : 'Simulate'}
            </div>
          </button>
        ))}
      </div>

      <div style={styles.howItWorks}>
        <h3 style={styles.sectionTitle}>How Payouts Are Calculated</h3>
        <div style={styles.peakBox}>
          <p style={styles.peakTitle}>Day-Part Aware Payouts</p>
          <p style={styles.peakDesc}>Your peak hours are <strong>5pm to 9pm</strong>. Triggers during this window pay <strong style={{ color: '#22c55e' }}>1.4x</strong> your hourly baseline. Off-peak triggers pay <strong style={{ color: '#6b7280' }}>0.6x</strong>.</p>
          <div style={styles.peakExamples}>
            <div style={styles.peakExample}>
              <span style={styles.exIcon}>🌧️</span>
              <div>
                <p style={styles.exTitle}>7pm curfew</p>
                <p style={styles.exAmount}>₹900 payout</p>
              </div>
            </div>
            <div style={styles.peakVs}>vs</div>
            <div style={styles.peakExample}>
              <span style={styles.exIcon}>🌧️</span>
              <div>
                <p style={styles.exTitle}>2pm curfew</p>
                <p style={{ ...styles.exAmount, color: '#6b7280' }}>₹200 payout</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px 16px 80px', fontFamily: 'system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh' },
  title: { margin: '0 0 4px', fontSize: 22, fontWeight: 700 },
  sub: { margin: '0 0 20px', color: '#6b7280', fontSize: 14 },
  activeAlert: { background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 14, padding: 16, marginBottom: 16 },
  alertTitle: { margin: '0 0 12px', fontWeight: 700, color: '#dc2626', fontSize: 15 },
  alertItem: { background: '#fff', borderRadius: 10, padding: '10px 12px', marginBottom: 8 },
  alertDesc: { margin: '4px 0 0', color: '#6b7280', fontSize: 13 },
  allClearBox: { background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 16 },
  allClearText: { margin: '8px 0 4px', fontWeight: 700, color: '#15803d' },
  allClearSub: { margin: 0, color: '#6b7280', fontSize: 13 },
  autoBtn: { width: '100%', padding: 12, borderRadius: 10, background: '#fff', border: '1.5px solid #2563eb', color: '#2563eb', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 24 },
  sectionTitle: { margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#111827' },
  demoNote: { margin: '0 0 16px', fontSize: 13, color: '#6b7280' },
  resultBox: { borderRadius: 12, padding: 16, marginBottom: 16, border: '1.5px solid' },
  resultMessage: { margin: '0 0 12px', fontWeight: 600, fontSize: 14 },
  resultDetails: { background: '#fff', borderRadius: 10, padding: 12 },
  resultRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid #f0f0f0' },
  triggerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 },
  triggerCard: { background: '#fff', borderRadius: 14, padding: 16, border: '1.5px solid', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  triggerCode: { margin: 0, fontWeight: 700, fontSize: 14 },
  triggerLabel: { margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.4 },
  fireBtn: { color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginTop: 4 },
  howItWorks: { background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  peakBox: { background: '#eff6ff', borderRadius: 12, padding: 14 },
  peakTitle: { margin: '0 0 6px', fontWeight: 700, color: '#1e40af' },
  peakDesc: { margin: '0 0 14px', fontSize: 13, color: '#374151', lineHeight: 1.5 },
  peakExamples: { display: 'flex', alignItems: 'center', gap: 12 },
  peakExample: { flex: 1, background: '#fff', borderRadius: 10, padding: 12, display: 'flex', gap: 10, alignItems: 'center' },
  exIcon: { fontSize: 24 },
  exTitle: { margin: 0, fontSize: 12, color: '#6b7280' },
  exAmount: { margin: 0, fontWeight: 700, color: '#22c55e' },
  peakVs: { color: '#6b7280', fontWeight: 600, fontSize: 12 }
};
