import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Dashboard({ worker, token }) {
  const [data, setData] = useState(null);
  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    fetchTriggers();
  }, []);

  const fetchDashboard = async () => {
    const res = await api.get('/dashboard/worker', token);
    if (res.worker) setData(res);
    setLoading(false);
  };

  const fetchTriggers = async () => {
    if (!worker?.zone_pincode) return;
    const res = await api.get(`/triggers/zone/${worker.zone_pincode}`, token);
    if (res.active_triggers) setTriggers(res.active_triggers);
  };

  if (loading) return <div style={styles.loading}>Loading your dashboard...</div>;

  const policy = data?.active_policy;
  const stats = data?.stats;
  const riskLevel = policy?.risk_level || 'low';
  const riskColors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
  const riskColor = riskColors[riskLevel];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <p style={styles.greeting}>Good {getTimeOfDay()}, 👋</p>
          <h2 style={styles.name}>{data?.worker?.name || worker?.name}</h2>
        </div>
        <div style={{ ...styles.riskBadge, background: riskColor + '20', color: riskColor }}>
          {riskLevel.toUpperCase()} RISK
        </div>
      </div>

      {triggers.length > 0 && (
        <div style={styles.alertBanner}>
          <span style={styles.alertIcon}>🚨</span>
          <div>
            <p style={styles.alertTitle}>Active Alert in Your Zone</p>
            <p style={styles.alertSub}>{triggers[0].name}</p>
          </div>
        </div>
      )}

      {policy ? (
        <div style={styles.policyCard}>
          <div style={styles.policyHeader}>
            <span style={styles.shieldIcon}>🛡️</span>
            <div>
              <p style={styles.policyLabel}>Active Policy</p>
              <p style={styles.policyWeek}>
                Week of {new Date(policy.week_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} to {new Date(policy.week_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <div style={styles.activeDot} />
          </div>
          <div style={styles.policyStats}>
            <div style={styles.statBox}>
              <p style={styles.statVal}>₹{policy.weekly_premium}</p>
              <p style={styles.statLabel}>Premium paid</p>
            </div>
            <div style={styles.divider} />
            <div style={styles.statBox}>
              <p style={styles.statVal}>₹{policy.max_payout}</p>
              <p style={styles.statLabel}>Max payout</p>
            </div>
            <div style={styles.divider} />
            <div style={styles.statBox}>
              <p style={styles.statVal}>{policy.risk_score}</p>
              <p style={styles.statLabel}>Risk score</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.noPolicyCard}>
          <p style={styles.noPolicyText}>You don't have an active policy this week.</p>
          <a href="/policy" style={styles.activateBtn}>Activate Now</a>
        </div>
      )}

      <div style={styles.statsRow}>
        <div style={styles.miniStat}>
          <p style={styles.miniVal}>{stats?.total_claims || 0}</p>
          <p style={styles.miniLabel}>Total claims</p>
        </div>
        <div style={styles.miniStat}>
          <p style={styles.miniVal}>{stats?.paid_claims || 0}</p>
          <p style={styles.miniLabel}>Paid out</p>
        </div>
        <div style={styles.miniStat}>
          <p style={{ ...styles.miniVal, color: '#2563eb' }}>₹{Math.round(stats?.total_received || 0)}</p>
          <p style={styles.miniLabel}>Total received</p>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Your Coverage</h3>
        <div style={styles.coverageGrid}>
          {[
            { icon: '🌧️', label: 'Heavy Rain' },
            { icon: '🌊', label: 'Floods' },
            { icon: '🔥', label: 'Heat Wave' },
            { icon: '🌫️', label: 'Pollution' },
            { icon: '🚔', label: 'Curfew' },
            { icon: '✊', label: 'Bandh' }
          ].map(c => (
            <div key={c.label} style={styles.coverageItem}>
              <span style={{ fontSize: 22 }}>{c.icon}</span>
              <p style={styles.coverageLabel}>{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {data?.recent_claims?.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Recent Claims</h3>
          {data.recent_claims.slice(0, 3).map(claim => (
            <div key={claim.id} style={styles.claimRow}>
              <span style={styles.claimIcon}>{getTriggerIcon(claim.trigger_type)}</span>
              <div style={{ flex: 1 }}>
                <p style={styles.claimEvent}>{claim.trigger_event}</p>
                <p style={styles.claimDate}>{new Date(claim.triggered_at).toLocaleDateString('en-IN')}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={styles.claimAmount}>₹{claim.payout_amount}</p>
                <span style={{ ...styles.statusBadge, background: getStatusColor(claim.status) + '20', color: getStatusColor(claim.status) }}>
                  {claim.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.workerInfo}>
        <p style={styles.workerInfoTitle}>Your Earnings Baseline</p>
        <div style={styles.infoRow}>
          <span>Peak hours</span>
          <strong>{data?.worker?.peak_hours}</strong>
        </div>
        <div style={styles.infoRow}>
          <span>Avg weekly income</span>
          <strong>₹{data?.worker?.avg_weekly_income}</strong>
        </div>
        <div style={styles.infoRow}>
          <span>Zone</span>
          <strong>{data?.worker?.city} ({data?.worker?.zone})</strong>
        </div>
        <div style={styles.infoRow}>
          <span>UPI</span>
          <strong>{data?.worker?.upi_id}</strong>
        </div>
        <p style={styles.peakNote}>
          Payouts are higher when triggers fire during your peak hours (1.4x multiplier). Off-peak triggers pay 0.6x.
        </p>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getTriggerIcon(type) {
  const icons = { T1: '🌧️', T2: '🌫️', T3: '🚔', T4: '📦' };
  return icons[type] || '⚡';
}

function getStatusColor(status) {
  const colors = { paid: '#22c55e', approved: '#2563eb', fraud_check: '#f59e0b', under_review: '#ef4444', initiated: '#6b7280' };
  return colors[status] || '#6b7280';
}

const styles = {
  container: { padding: '20px 16px 80px', fontFamily: 'system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh' },
  loading: { textAlign: 'center', padding: 40, color: '#6b7280' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { margin: '0 0 2px', color: '#6b7280', fontSize: 14 },
  name: { margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' },
  riskBadge: { padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  alertBanner: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' },
  alertIcon: { fontSize: 24 },
  alertTitle: { margin: 0, fontWeight: 700, color: '#dc2626', fontSize: 14 },
  alertSub: { margin: 0, color: '#6b7280', fontSize: 13 },
  policyCard: { background: '#1e3a5f', borderRadius: 16, padding: 20, marginBottom: 16, color: '#fff' },
  policyHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  shieldIcon: { fontSize: 32 },
  policyLabel: { margin: 0, fontSize: 12, opacity: 0.7 },
  policyWeek: { margin: 0, fontSize: 14, fontWeight: 600 },
  activeDot: { width: 10, height: 10, borderRadius: '50%', background: '#22c55e', marginLeft: 'auto', boxShadow: '0 0 6px #22c55e' },
  policyStats: { display: 'flex', justifyContent: 'space-around', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 0' },
  statBox: { textAlign: 'center' },
  statVal: { margin: 0, fontSize: 20, fontWeight: 700 },
  statLabel: { margin: 0, fontSize: 11, opacity: 0.7 },
  divider: { width: 1, background: 'rgba(255,255,255,0.2)' },
  noPolicyCard: { background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center', border: '2px dashed #e5e7eb' },
  noPolicyText: { color: '#6b7280', marginBottom: 12 },
  activateBtn: { background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 },
  statsRow: { display: 'flex', gap: 12, marginBottom: 20 },
  miniStat: { flex: 1, background: '#fff', borderRadius: 12, padding: '14px 0', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  miniVal: { margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' },
  miniLabel: { margin: 0, fontSize: 11, color: '#6b7280' },
  section: { background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitle: { margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#111827' },
  coverageGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 },
  coverageItem: { background: '#f0f7ff', borderRadius: 10, padding: '10px 0', textAlign: 'center' },
  coverageLabel: { margin: '4px 0 0', fontSize: 11, color: '#374151', fontWeight: 500 },
  claimRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
  claimIcon: { fontSize: 22, width: 36, textAlign: 'center' },
  claimEvent: { margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' },
  claimDate: { margin: 0, fontSize: 11, color: '#6b7280' },
  claimAmount: { margin: '0 0 4px', fontSize: 15, fontWeight: 700 },
  statusBadge: { fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 10 },
  workerInfo: { background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  workerInfoTitle: { margin: '0 0 12px', fontWeight: 700, color: '#111827' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13, color: '#6b7280' },
  peakNote: { margin: '12px 0 0', fontSize: 12, color: '#2563eb', background: '#eff6ff', borderRadius: 8, padding: '8px 10px' }
};
