import React, { useState } from 'react';
import api from '../utils/api';

const STEPS = ['phone', 'otp', 'details', 'upi', 'zone', 'plan'];

const ZONES = [
  { pincode: '560001', city: 'Bengaluru', label: 'Bengaluru Central' },
  { pincode: '560002', city: 'Bengaluru', label: 'Bengaluru East' },
  { pincode: '400001', city: 'Mumbai', label: 'Mumbai Central' },
  { pincode: '110001', city: 'Delhi', label: 'Delhi Central' },
  { pincode: '600001', city: 'Chennai', label: 'Chennai Central' }
];

export default function Onboarding({ onLogin }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    phone: '', otp: '', name: '', password: '',
    upi_id: '', upi_provider: 'gpay',
    zone_pincode: '', city: '', platform: 'amazon',
    peak_start: 17, peak_end: 21,
    avg_weekly_income: 5000, risk_level: 'medium'
  });
  const [premiumPreview, setPremiumPreview] = useState(null);

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const sendOTP = async () => {
    setLoading(true);
    const res = await api.post('/auth/send-otp', { phone: form.phone });
    setLoading(false);
    if (res.message) { setStep(1); setError(''); }
    else setError('Failed to send OTP');
  };

  const verifyOTP = async () => {
    setLoading(true);
    const res = await api.post('/auth/verify-otp', { phone: form.phone, otp: form.otp });
    setLoading(false);
    if (res.verified) { setStep(2); setError(''); }
    else setError('Invalid OTP. Please try again.');
  };

  const fetchPremiumPreview = async (pincode) => {
    const res = await api.post('/premium/preview', {
      zone_pincode: pincode,
      avg_weekly_income: form.avg_weekly_income,
      peak_start: form.peak_start,
      peak_end: form.peak_end
    });
    if (res.estimated_premium) setPremiumPreview(res.estimated_premium);
  };

  const register = async () => {
    setLoading(true);
    const res = await api.post('/auth/register', form);
    setLoading(false);
    if (res.token) {
      onLogin(res.token, res.worker);
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  const tierColors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.logo}>🛡️</span>
        <h1 style={styles.title}>ShieldShift</h1>
        <p style={styles.subtitle}>Income protection for delivery workers</p>
      </div>

      <div style={styles.card}>
        {/* progress dots */}
        <div style={styles.dots}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ ...styles.dot, background: i <= step ? '#2563eb' : '#e5e7eb' }} />
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Step 0: Phone */}
        {step === 0 && (
          <div>
            <h2 style={styles.stepTitle}>Enter your phone number</h2>
            <p style={styles.stepSub}>We'll send you a one-time password</p>
            <input
              style={styles.input}
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              type="tel"
            />
            <button style={styles.btn} onClick={sendOTP} disabled={loading || !form.phone}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        )}

        {/* Step 1: OTP */}
        {step === 1 && (
          <div>
            <h2 style={styles.stepTitle}>Enter OTP</h2>
            <p style={styles.stepSub}>Sent to {form.phone}</p>
            <input
              style={styles.input}
              placeholder="6-digit OTP"
              value={form.otp}
              onChange={e => update('otp', e.target.value)}
              type="number"
              maxLength={6}
            />
            <button style={styles.btn} onClick={verifyOTP} disabled={loading || form.otp.length < 6}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        )}

        {/* Step 2: Personal details */}
        {step === 2 && (
          <div>
            <h2 style={styles.stepTitle}>Tell us about yourself</h2>
            <input style={styles.input} placeholder="Your full name" value={form.name} onChange={e => update('name', e.target.value)} />
            <input style={styles.input} placeholder="Create a password" value={form.password} onChange={e => update('password', e.target.value)} type="password" />
            <label style={styles.label}>Which platform do you work for?</label>
            <div style={styles.row}>
              {['amazon', 'flipkart'].map(p => (
                <button key={p} style={{ ...styles.chip, background: form.platform === p ? '#2563eb' : '#f3f4f6', color: form.platform === p ? '#fff' : '#374151' }}
                  onClick={() => update('platform', p)}>
                  {p === 'amazon' ? '📦 Amazon' : '🛍️ Flipkart'}
                </button>
              ))}
            </div>
            <label style={styles.label}>Your average weekly income (₹)</label>
            <input style={styles.input} type="number" value={form.avg_weekly_income} onChange={e => update('avg_weekly_income', parseInt(e.target.value))} />
            <button style={styles.btn} onClick={() => setStep(3)} disabled={!form.name || !form.password}>
              Continue
            </button>
          </div>
        )}

        {/* Step 3: UPI */}
        {step === 3 && (
          <div>
            <h2 style={styles.stepTitle}>Link your UPI wallet</h2>
            <p style={styles.stepSub}>Payouts go here instantly when a trigger fires</p>
            <div style={styles.row}>
              {['gpay', 'phonepe'].map(p => (
                <button key={p} style={{ ...styles.chip, background: form.upi_provider === p ? '#2563eb' : '#f3f4f6', color: form.upi_provider === p ? '#fff' : '#374151' }}
                  onClick={() => update('upi_provider', p)}>
                  {p === 'gpay' ? '🟢 Google Pay' : '🟣 PhonePe'}
                </button>
              ))}
            </div>
            <input style={styles.input} placeholder="yourname@okaxis" value={form.upi_id} onChange={e => update('upi_id', e.target.value)} />
            <button style={styles.btn} onClick={() => setStep(4)} disabled={!form.upi_id}>
              Continue
            </button>
          </div>
        )}

        {/* Step 4: Zone */}
        {step === 4 && (
          <div>
            <h2 style={styles.stepTitle}>Select your delivery zone</h2>
            <p style={styles.stepSub}>Your zone determines your risk level and premium</p>
            {ZONES.map(z => (
              <div key={z.pincode}
                style={{ ...styles.zoneCard, border: form.zone_pincode === z.pincode ? '2px solid #2563eb' : '2px solid #e5e7eb' }}
                onClick={() => { update('zone_pincode', z.pincode); update('city', z.city); fetchPremiumPreview(z.pincode); }}>
                <strong>{z.label}</strong>
                <span style={{ color: '#6b7280', fontSize: 13 }}>Pin: {z.pincode}</span>
              </div>
            ))}
            {premiumPreview && (
              <div style={styles.previewBox}>
                <p style={{ margin: 0, fontWeight: 600 }}>Estimated premium for your zone</p>
                <p style={{ margin: 0, color: tierColors[premiumPreview.riskLevel], fontSize: 20, fontWeight: 700 }}>
                  ₹{premiumPreview.weeklyPremium}/week
                </p>
                <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>Max payout: ₹{premiumPreview.maxPayout}</p>
              </div>
            )}
            <button style={styles.btn} onClick={() => setStep(5)} disabled={!form.zone_pincode}>Continue</button>
          </div>
        )}

        {/* Step 5: Plan */}
        {step === 5 && (
          <div>
            <h2 style={styles.stepTitle}>Choose your weekly plan</h2>
            <p style={styles.stepSub}>Deducted from your weekly payout. Cancel anytime.</p>
            {[
              { level: 'low', premium: 25, payout: 1000, label: 'Stable zone, dry season', color: '#22c55e' },
              { level: 'medium', premium: 45, payout: 2500, label: 'Metro city, monsoon', color: '#f59e0b' },
              { level: 'high', premium: 80, payout: 4500, label: 'Flood-prone, curfew history', color: '#ef4444' }
            ].map(t => (
              <div key={t.level}
                style={{ ...styles.planCard, border: form.risk_level === t.level ? `2px solid ${t.color}` : '2px solid #e5e7eb' }}
                onClick={() => update('risk_level', t.level)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ textTransform: 'capitalize', fontWeight: 700, color: t.color }}>{t.level} risk</span>
                    <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{t.label}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>₹{t.premium}<span style={{ fontSize: 12, fontWeight: 400 }}>/wk</span></p>
                    <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Up to ₹{t.payout}</p>
                  </div>
                </div>
              </div>
            ))}
            <button style={styles.btn} onClick={register} disabled={loading}>
              {loading ? 'Activating...' : '🛡️ Activate My Shield'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', padding: '20px 16px', fontFamily: 'system-ui, sans-serif' },
  header: { textAlign: 'center', marginBottom: 24 },
  logo: { fontSize: 48 },
  title: { margin: '8px 0 4px', fontSize: 28, fontWeight: 700, color: '#1e3a5f' },
  subtitle: { margin: 0, color: '#6b7280', fontSize: 14 },
  card: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  dots: { display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: '50%', transition: 'background 0.3s' },
  stepTitle: { fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: '#111827' },
  stepSub: { fontSize: 14, color: '#6b7280', margin: '0 0 20px' },
  input: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 16, marginBottom: 14, boxSizing: 'border-box', outline: 'none' },
  btn: { width: '100%', padding: '14px', borderRadius: 10, background: '#2563eb', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 8 },
  row: { display: 'flex', gap: 10, marginBottom: 14 },
  chip: { flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  label: { display: 'block', fontSize: 13, color: '#374151', fontWeight: 500, marginBottom: 6 },
  zoneCard: { padding: '12px 14px', borderRadius: 10, marginBottom: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  previewBox: { background: '#eff6ff', borderRadius: 10, padding: 14, marginBottom: 16, textAlign: 'center' },
  planCard: { padding: 14, borderRadius: 10, marginBottom: 12, cursor: 'pointer' },
  error: { background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }
};
