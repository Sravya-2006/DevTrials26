const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { calculatePremium } = require('./premium');

router.get('/current', auth, (req, res) => {
  const policy = db.policies.findActive(req.worker.id);
  res.json({ active_policy: policy || null });
});

router.post('/activate', auth, (req, res) => {
  const existing = db.policies.findActive(req.worker.id);
  if (existing) return res.status(400).json({ error: 'You already have an active policy this week' });

  const worker = db.workers.findById(req.worker.id);
  const zone = db.zones.findByPincode(worker.zone_pincode) || { risk_score: 50, disruption_history_12m: 3, is_flood_prone: false, is_curfew_prone: false };
  const premium = calculatePremium(worker, zone);

  const tiers = { low: { weeklyPremium: 25, maxPayout: 1000 }, medium: { weeklyPremium: 45, maxPayout: 2500 }, high: { weeklyPremium: 80, maxPayout: 4500 } };
  const selected = tiers[req.body.risk_level] || tiers[premium.riskLevel];
  const riskLevel = req.body.risk_level || premium.riskLevel;

  const weekStart = new Date().toISOString().split('T')[0];
  const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const policy = db.policies.create({
    worker_id: parseInt(req.worker.id),
    week_start: weekStart,
    week_end: weekEnd,
    risk_level: riskLevel,
    weekly_premium: selected.weeklyPremium,
    max_payout: selected.maxPayout,
    risk_score: premium.overallRiskScore,
    is_active: true,
    is_paid: true
  });

  res.status(201).json({ message: `Shield activated! You are covered for ₹${selected.maxPayout} this week.`, policy });
});

router.get('/history', auth, (req, res) => {
  const policies = db.policies.findByWorker(req.worker.id);
  const claims = db.claims.findByWorker(req.worker.id);
  const enriched = policies.map(p => ({
    ...p,
    total_claims: claims.filter(c => c.policy_id === p.id).length,
    total_paid: claims.filter(c => c.policy_id === p.id && c.status === 'paid').reduce((s, c) => s + (c.payout_amount || 0), 0)
  }));
  res.json({ policies: enriched.reverse() });
});

module.exports = router;
