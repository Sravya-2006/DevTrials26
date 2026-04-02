const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { runFraudCheck, calculatePayout } = require('../services/fraudDetection');
const { runTriggerCheck } = require('../services/triggerEngine');

router.get('/my-claims', auth, (req, res) => {
  const claims = db.claims.findByWorker(req.worker.id).reverse();
  res.json({ claims });
});

router.get('/:id', auth, (req, res) => {
  const claim = db.claims.findById(req.params.id);
  if (!claim || claim.worker_id !== parseInt(req.worker.id)) return res.status(404).json({ error: 'Claim not found' });
  res.json({ claim });
});

router.post('/trigger-manual', auth, (req, res) => {
  const { trigger_type, trigger_event, trigger_zone } = req.body;
  const worker = db.workers.findById(req.worker.id);
  const policy = db.policies.findActive(req.worker.id);

  if (!policy) return res.status(400).json({ error: 'No active policy. Please activate one first.' });

  const fraud = runFraudCheck(worker, trigger_zone || worker.zone_pincode);
  const payout = calculatePayout(worker, policy, new Date());

  const status = fraud.tier === 'tier1' ? 'approved' : fraud.tier === 'tier2' ? 'fraud_check' : 'under_review';
  const claim = db.claims.create({
    worker_id: worker.id,
    policy_id: policy.id,
    trigger_type: trigger_type || 'T1',
    trigger_event: trigger_event || 'Manual Test Trigger',
    trigger_zone: trigger_zone || worker.zone_pincode,
    income_loss_estimated: payout.estimated_loss,
    payout_amount: payout.payout_amount,
    coverage_ratio: payout.coverage_ratio,
    status,
    fraud_score: fraud.fraud_score,
    fraud_flags: fraud.flags,
    tier: fraud.tier
  });

  if (fraud.tier === 'tier1') {
    db.claims.update(claim.id, { status: 'paid', paid_at: new Date().toISOString(), notes: `₹${payout.payout_amount} sent to ${worker.upi_id} via Razorpay sandbox` });
  }

  const io = req.app.get('io');
  if (io) io.emit('claim_update', { worker_id: worker.id, payout: payout.payout_amount, status, tier: fraud.tier });

  const messages = {
    tier1: `Claim approved! ₹${payout.payout_amount} will be credited to your UPI within 90 seconds.`,
    tier2: 'Your claim is being verified. Expected resolution in 2 hours.',
    tier3: 'Your claim is under manual review. You will be notified within 4 hours.'
  };

  res.status(201).json({ message: messages[fraud.tier], claim, fraud_check: fraud, payout_details: payout });
});

router.post('/run-trigger-check', async (req, res) => {
  const io = req.app.get('io');
  await runTriggerCheck(io);
  res.json({ message: 'Trigger check complete. Check your claims tab.' });
});

module.exports = router;
