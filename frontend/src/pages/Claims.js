import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const STATUS_CONFIG = {
  paid:         { color: '#22c55e', label: 'Paid', icon: '✅' },
  approved:     { color: '#2563eb', label: 'Approved', icon: '👍' },
  fraud_check:  { color: '#f59e0b', label: 'Verifying', icon: '🔍' },
  under_review: { color: '#ef4444', label: 'Under Review', icon: '⚠️' },
  initiated:    { color: '#6b7280', label: 'Initiated', icon: '⏳' }
};

const TRIGGER_CONFIG = {
  T1: { icon: '🌧️', label: 'Weather' },
  T2: { icon: '🌫️', label: 'Pollution' },
  T3: { icon: '🚔', label: 'Civic' },
  T4: { icon: '📦', label: 'Platform' }
};

export default function Claims({ worker, token }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    const res = await api.get('/claims/my-claims', token);
    if (res.claims) setClaims(res.claims);
    setLoading(false);
  };

  const totalReceived = claims.filter(c => c.status === 'paid').reduce((sum, c) => sum + parseFloat(c.payout_amount || 0), 0);
  const pendingClaims = claims.filter(c => ['fraud_check', 'under_review', 'initiated'].includes(c.status));

  if (loading) return <div style={styles.loading}>Loading your claims...</div>;

  if (selected) {
    const st = STATUS_CONFIG[selected.status] || STATUS_CONFIG.initiated;
    const tr = TRIGGER_CONFIG[selected.trigger_type] || { icon: '⚡', label: 'Event' };
    return (
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => setSelected(null)}>← Back to claims</button>
        <div style={styles.detailCard}>
          <div style={styles.detailHeader}>
            <span style={{ fontSize: 40 }}>{tr.icon}</span>
            <div>
              <p style={styles.detailEvent}>{selected.trigger_event}</p>
              <p style={styles.detailZone}>Zone: {selected.trigger_zone}</p>
            </div>
          </div>

          <div style={styles.statusTracker}>
            {['Triggered', 'Fraud Check', 'Approved', 'Paid'].map((s, i) => {
              const stepMap = { initiated: 0, fraud_check: 1, approved: 2, under_review: 1, paid: 3 };
              const currentStep = stepMap[selected.status] ?? 0;
              const done = i <= currentStep;
              return (
                <div key={s} style={styles.trackerStep}>
                  <div style={{ ...styles.trackerDot, background: done ? '#2563eb' : '#e5e7eb' }} />
                  <p style={{ ...styles.trackerLabel, color: done ? '#2563eb' : '#9ca3af' }}>{s}</p>
                  {i < 3 && <div style={{ ...styles.trackerLine, background: i < currentStep ? '#2563eb' : '#e5e7eb' }} />}
                </div>
              );
            })}
          </div>

          <div style={styles.detailGrid}>
            <div style={styles.detailRow}>
              <span>Status</span>
              <span style={{ color: st.color, fontWeight: 700 }}>{st.icon} {st.label}</span>
            </div>
            <div style={styles.detailRow}>
              <span>Trigger type</span>
              <span>{tr.icon} {tr.label} ({selected.trigger_type})</span>
            </div>
            <div style={styles.detailRow}>
              <span>Estimated loss</span>
              <span>₹{Math.round(selected.income_loss_estimated || 0)}</span>
            </div>
            <div style={styles.detailRow}>
              <span>Payout amount</span>
              <strong style={{ color: '#22c55e' }}>₹{Math.round(selected.payout_amount || 0)}</strong>
            </div>
            <div style={styles.detailRow}>
              <span>Coverage ratio</span>
              <span>{(selected.coverage_ratio * 100).toFixed(0)}%</span>
            </div>
            <div style={styles.detailRow}>
              <span>Triggered at</span>
              <span>{new Date(selected.triggered_at).toLocaleString('en-IN')}</span>
            </div>
            {selected.paid_at && (
              <div style={styles.detailRow}>
                <span>Paid at</span>
                <span>{new Date(selected.paid_at).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={styles.detailRow}>
              <span>Fraud score</span>
              <span style={{ color: selected.fraud_score > 30 ? '#ef4444' : '#22c55e' }}>
                {selected.fraud_score}/100 ({selected.tier})
              </span>
            </div>
          </div>

          {selected.tier === 'tier2' && (
            <div style={styles.tierNote}>
              🔍 Your claim is being verified. This takes up to 2 hours. No action needed from you.
            </div>
          )}
          {selected.tier === 'tier3' && (
            <div style={{ ...styles.tierNote, background: '#fef2f2', color: '#dc2626' }}>
              ⚠️ Your claim is under manual review. You will be notified within 4 hours. If you think this is a mistake, call our helpline.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Claims</h2>

      <div style={styles.summaryRow}>
        <div style={styles.summaryBox}>
          <p style={styles.summaryVal}>{claims.length}</p>
          <p style={styles.summaryLabel}>Total claims</p>
        </div>
        <div style={styles.summaryBox}>
          <p style={{ ...styles.summaryVal, color: '#22c55e' }}>₹{Math.round(totalReceived)}</p>
          <p style={styles.summaryLabel}>Total received</p>
        </div>
        <div style={styles.summaryBox}>
          <p style={{ ...styles.summaryVal, color: '#f59e0b' }}>{pendingClaims.length}</p>
          <p style={styles.summaryLabel}>Pending</p>
        </div>
      </div>

      {claims.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: 48 }}>🛡️</p>
          <p style={styles.emptyTitle}>No claims yet</p>
          <p style={styles.emptySub}>When a calamity hits your zone, claims are created automatically. You don't need to do anything.</p>
        </div>
      ) : (
        <div style={styles.claimsList}>
          {claims.map(claim => {
            const st = STATUS_CONFIG[claim.status] || STATUS_CONFIG.initiated;
            const tr = TRIGGER_CONFIG[claim.trigger_type] || { icon: '⚡', label: 'Event' };
            return (
              <div key={claim.id} style={styles.claimCard} onClick={() => setSelected(claim)}>
                <div style={styles.claimLeft}>
                  <span style={{ fontSize: 28 }}>{tr.icon}</span>
                  <div>
                    <p style={styles.claimEvent}>{claim.trigger_event}</p>
                    <p style={styles.claimMeta}>
                      {new Date(claim.triggered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {tr.label}
                    </p>
                  </div>
                </div>
                <div style={styles.claimRight}>
                  <p style={styles.claimAmount}>₹{Math.round(claim.payout_amount || 0)}</p>
                  <span style={{ ...styles.statusPill, background: st.color + '18', color: st.color }}>
                    {st.icon} {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '20px 16px 80px', fontFamily: 'system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh' },
  loading: { textAlign: 'center', padding: 40, color: '#6b7280' },
  title: { margin: '0 0 20px', fontSize: 22, fontWeight: 700 },
  summaryRow: { display: 'flex', gap: 12, marginBottom: 20 },
  summaryBox: { flex: 1, background: '#fff', borderRadius: 12, padding: '12px 0', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  summaryVal: { margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' },
  summaryLabel: { margin: 0, fontSize: 11, color: '#6b7280' },
  empty: { textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 700, margin: '0 0 8px' },
  emptySub: { color: '#6b7280', fontSize: 14, lineHeight: 1.6 },
  claimsList: { display: 'flex', flexDirection: 'column', gap: 12 },
  claimCard: { background: '#fff', borderRadius: 14, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer' },
  claimLeft: { display: 'flex', gap: 12, alignItems: 'center' },
  claimEvent: { margin: 0, fontWeight: 600, fontSize: 13, color: '#111827' },
  claimMeta: { margin: 0, fontSize: 11, color: '#6b7280' },
  claimRight: { textAlign: 'right' },
  claimAmount: { margin: '0 0 4px', fontWeight: 700, fontSize: 17 },
  statusPill: { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 },
  backBtn: { background: 'none', border: 'none', color: '#2563eb', fontSize: 15, cursor: 'pointer', marginBottom: 16, padding: 0 },
  detailCard: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  detailHeader: { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 },
  detailEvent: { margin: 0, fontWeight: 700, fontSize: 16, color: '#111827' },
  detailZone: { margin: 0, color: '#6b7280', fontSize: 13 },
  statusTracker: { display: 'flex', alignItems: 'flex-start', marginBottom: 24, position: 'relative' },
  trackerStep: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' },
  trackerDot: { width: 14, height: 14, borderRadius: '50%', marginBottom: 6, zIndex: 1 },
  trackerLabel: { fontSize: 10, textAlign: 'center', fontWeight: 500 },
  trackerLine: { position: 'absolute', top: 7, left: '50%', width: '100%', height: 2 },
  detailGrid: { background: '#f8fafc', borderRadius: 12, padding: 14 },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13, color: '#374151' },
  tierNote: { marginTop: 16, background: '#eff6ff', color: '#1d4ed8', padding: '12px 14px', borderRadius: 10, fontSize: 13 }
};
