import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AdminDashboard({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmin();
  }, []);

  const fetchAdmin = async () => {
    const res = await api.get('/dashboard/admin', token);
    if (res.summary) setData(res);
    setLoading(false);
  };

  if (loading) return <div style={styles.loading}>Loading admin dashboard...</div>;
  if (!data) return <div style={styles.loading}>Failed to load dashboard</div>;

  const { summary, claims_by_status, claims_by_trigger, fraud_queue, zone_risks } = data;

  const triggerIcons = { T1: '🌧️', T2: '🌫️', T3: '🚔', T4: '📦' };
  const statusColors = { paid: '#22c55e', approved: '#2563eb', fraud_check: '#f59e0b', under_review: '#ef4444', initiated: '#6b7280' };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Admin Dashboard</h2>
        <span style={styles.adminBadge}>Insurer View</span>
      </div>

      <div style={styles.summaryGrid}>
        {[
          { label: 'Active workers', val: summary.total_workers, color: '#2563eb' },
          { label: 'Active policies', val: summary.active_policies, color: '#7c3aed' },
          { label: 'Total claims', val: summary.total_claims, color: '#d97706' },
          { label: 'Fraud queue', val: summary.pending_review, color: '#dc2626' }
        ].map(s => (
          <div key={s.label} style={styles.summaryCard}>
            <p style={{ ...styles.summaryVal, color: s.color }}>{s.val}</p>
            <p style={styles.summaryLabel}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={styles.financeRow}>
        <div style={styles.financeCard}>
          <p style={styles.financeLabel}>Premiums collected</p>
          <p style={styles.financeVal}>₹{Math.round(summary.total_premiums_collected)}</p>
        </div>
        <div style={styles.financeCard}>
          <p style={styles.financeLabel}>Total paid out</p>
          <p style={{ ...styles.financeVal, color: '#dc2626' }}>₹{Math.round(summary.total_paid_out)}</p>
        </div>
        <div style={styles.financeCard}>
          <p style={styles.financeLabel}>Liquidity pool</p>
          <p style={{ ...styles.financeVal, color: summary.liquidity_pool >= 0 ? '#22c55e' : '#dc2626' }}>
            ₹{Math.round(summary.liquidity_pool)}
          </p>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Claims by Status</h3>
        {claims_by_status.map(s => (
          <div key={s.status} style={styles.barRow}>
            <span style={{ width: 100, fontSize: 13, color: statusColors[s.status] || '#6b7280', textTransform: 'capitalize' }}>{s.status.replace('_', ' ')}</span>
            <div style={styles.barBg}>
              <div style={{ ...styles.barFill, width: `${Math.min(100, s.count * 10)}%`, background: statusColors[s.status] || '#6b7280' }} />
            </div>
            <span style={styles.barCount}>{s.count}</span>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Claims by Trigger Type</h3>
        {claims_by_trigger.map(t => (
          <div key={t.trigger_type} style={styles.triggerRow}>
            <span style={{ fontSize: 22 }}>{triggerIcons[t.trigger_type] || '⚡'}</span>
            <div style={{ flex: 1 }}>
              <p style={styles.triggerType}>{t.trigger_type}</p>
              <p style={styles.triggerMeta}>{t.count} claims</p>
            </div>
            <p style={styles.triggerPaid}>₹{Math.round(t.total_paid || 0)} paid</p>
          </div>
        ))}
      </div>

      {fraud_queue.length > 0 && (
        <div style={styles.section}>
          <h3 style={{ ...styles.sectionTitle, color: '#dc2626' }}>🚨 Fraud Review Queue ({fraud_queue.length})</h3>
          {fraud_queue.map(c => (
            <div key={c.id} style={styles.fraudCard}>
              <div style={styles.fraudHeader}>
                <p style={styles.fraudName}>{c.name}</p>
                <span style={styles.fraudScore}>Score: {c.fraud_score}/100</span>
              </div>
              <p style={styles.fraudEvent}>{c.trigger_event}</p>
              <p style={styles.fraudMeta}>Zone: {c.zone_pincode} · Phone: {c.phone}</p>
              {c.fraud_flags && (
                <div style={styles.flagsRow}>
                  {JSON.parse(c.fraud_flags || '[]').map(flag => (
                    <span key={flag} style={styles.flagPill}>{flag.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              )}
              <div style={styles.fraudActions}>
                <button style={styles.approveBtn}>✅ Approve</button>
                <button style={styles.rejectBtn}>❌ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Zone Risk Heatmap</h3>
        {zone_risks.map(z => {
          const riskColor = z.risk_score >= 70 ? '#ef4444' : z.risk_score >= 45 ? '#f59e0b' : '#22c55e';
          return (
            <div key={z.pincode} style={styles.zoneRow}>
              <div>
                <p style={styles.zoneName}>{z.city} ({z.pincode})</p>
                <p style={styles.zoneMeta}>
                  {z.disruption_history_12m} disruptions last year
                  {z.is_flood_prone ? ' · Flood zone' : ''}
                  {z.is_curfew_prone ? ' · Curfew zone' : ''}
                </p>
              </div>
              <div style={styles.zoneRight}>
                <div style={styles.riskBarBg}>
                  <div style={{ ...styles.riskBarFill, width: `${z.risk_score}%`, background: riskColor }} />
                </div>
                <p style={{ ...styles.riskScore, color: riskColor }}>{z.risk_score}/100</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px 16px 80px', fontFamily: 'system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh' },
  loading: { textAlign: 'center', padding: 40, color: '#6b7280' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { margin: 0, fontSize: 22, fontWeight: 700 },
  adminBadge: { background: '#1e3a5f', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  summaryCard: { background: '#fff', borderRadius: 14, padding: 16, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  summaryVal: { margin: 0, fontSize: 28, fontWeight: 700 },
  summaryLabel: { margin: 0, fontSize: 12, color: '#6b7280' },
  financeRow: { display: 'flex', gap: 10, marginBottom: 20 },
  financeCard: { flex: 1, background: '#fff', borderRadius: 12, padding: '12px 10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  financeLabel: { margin: '0 0 4px', fontSize: 11, color: '#6b7280' },
  financeVal: { margin: 0, fontWeight: 700, fontSize: 17, color: '#111827' },
  section: { background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitle: { margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#111827' },
  barRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  barBg: { flex: 1, height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, transition: 'width 0.5s' },
  barCount: { width: 24, textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#374151' },
  triggerRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
  triggerType: { margin: 0, fontWeight: 700, fontSize: 14 },
  triggerMeta: { margin: 0, fontSize: 12, color: '#6b7280' },
  triggerPaid: { fontWeight: 700, color: '#22c55e', fontSize: 14 },
  fraudCard: { background: '#fef2f2', borderRadius: 12, padding: 14, marginBottom: 12 },
  fraudHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  fraudName: { margin: 0, fontWeight: 700, fontSize: 14 },
  fraudScore: { fontSize: 12, color: '#dc2626', fontWeight: 600 },
  fraudEvent: { margin: '0 0 4px', fontSize: 13, color: '#374151' },
  fraudMeta: { margin: '0 0 8px', fontSize: 12, color: '#6b7280' },
  flagsRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  flagPill: { background: '#fee2e2', color: '#dc2626', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 },
  fraudActions: { display: 'flex', gap: 10 },
  approveBtn: { flex: 1, padding: '8px 0', borderRadius: 8, background: '#22c55e', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' },
  rejectBtn: { flex: 1, padding: '8px 0', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' },
  zoneRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
  zoneName: { margin: 0, fontWeight: 600, fontSize: 14 },
  zoneMeta: { margin: 0, fontSize: 12, color: '#6b7280' },
  zoneRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  riskBarBg: { width: 80, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  riskBarFill: { height: '100%', borderRadius: 3 },
  riskScore: { margin: 0, fontSize: 12, fontWeight: 700 }
};
