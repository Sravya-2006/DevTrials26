const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/worker', auth, (req, res) => {
  const worker = db.workers.findById(req.worker.id);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  const policy = db.policies.findActive(req.worker.id);
  const allClaims = db.claims.findByWorker(req.worker.id);
  const paidClaims = allClaims.filter(c => c.status === 'paid');
  const zone = db.zones.findByPincode(worker.zone_pincode) || { risk_score: 50 };

  const { password_hash, ...safeWorker } = worker;

  res.json({
    worker: { ...safeWorker, peak_hours: `${worker.peak_start}:00 to ${worker.peak_end}:00` },
    active_policy: policy || null,
    stats: {
      total_claims: allClaims.length,
      paid_claims: paidClaims.length,
      total_received: paidClaims.reduce((s, c) => s + (c.payout_amount || 0), 0)
    },
    recent_claims: allClaims.slice(-5).reverse(),
    zone_risk: zone
  });
});

router.get('/admin', (req, res) => {
  const workers = db.workers.findAll();
  const policies = db.policies.findAll();
  const claims = db.claims.findAll();
  const zones = db.zones.findAll();

  const activePolicies = policies.filter(p => p.is_active && new Date(p.week_end) >= new Date());
  const paidClaims = claims.filter(c => c.status === 'paid');
  const fraudQueue = claims.filter(c => c.status === 'under_review').map(c => ({
    ...c, worker: db.workers.findById(c.worker_id)
  }));

  const totalPremiums = policies.filter(p => p.is_paid).reduce((s, p) => s + (p.weekly_premium || 0), 0);
  const totalPaidOut = paidClaims.reduce((s, c) => s + (c.payout_amount || 0), 0);

  const claimsByStatus = ['initiated', 'approved', 'fraud_check', 'under_review', 'paid'].map(status => ({
    status, count: claims.filter(c => c.status === status).length
  }));

  const claimsByTrigger = ['T1', 'T2', 'T3', 'T4'].map(type => ({
    trigger_type: type,
    count: claims.filter(c => c.trigger_type === type).length,
    total_paid: paidClaims.filter(c => c.trigger_type === type).reduce((s, c) => s + (c.payout_amount || 0), 0)
  }));

  res.json({
    summary: {
      total_workers: workers.filter(w => !w.is_blacklisted).length,
      active_policies: activePolicies.length,
      total_claims: claims.length,
      pending_review: fraudQueue.length,
      total_paid_out: totalPaidOut,
      total_premiums_collected: totalPremiums,
      liquidity_pool: totalPremiums - totalPaidOut
    },
    claims_by_status: claimsByStatus,
    claims_by_trigger: claimsByTrigger,
    fraud_queue: fraudQueue.slice(0, 10),
    zone_risks: zones.sort((a, b) => b.risk_score - a.risk_score)
  });
});

module.exports = router;
