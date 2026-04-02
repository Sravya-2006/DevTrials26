const db = require('../db');
const mockData = require('../mock-data/calamityEvents.json');
const { runFraudCheck, calculatePayout } = require('./fraudDetection');

async function runTriggerCheck(io) {
  console.log('Running trigger check...');
  const allPolicies = db.policies.findAll().filter(p => p.is_active && new Date(p.week_end) >= new Date());

  const zones = [...new Set(allPolicies.map(p => {
    const w = db.workers.findById(p.worker_id);
    return w ? w.zone_pincode : null;
  }).filter(Boolean))];

  for (const zone of zones) {
    const events = [
      ...mockData.weather_events.filter(e => e.is_active && e.affected_zones.includes(zone)).map(e => ({ ...e, type: 'T1' })),
      ...mockData.aqi_events.filter(e => e.is_active && e.affected_zones.includes(zone)).map(e => ({ ...e, type: 'T2' })),
      ...mockData.civic_events.filter(e => e.is_active && e.affected_zones.includes(zone)).map(e => ({ ...e, type: 'T3' })),
      ...mockData.platform_events.filter(e => e.is_active && e.affected_zones.includes(zone)).map(e => ({ ...e, type: 'T4' }))
    ];

    if (events.length === 0) continue;

    const zoneWorkers = allPolicies.filter(p => {
      const w = db.workers.findById(p.worker_id);
      return w && w.zone_pincode === zone;
    });

    for (const event of events) {
      for (const policy of zoneWorkers) {
        const worker = db.workers.findById(policy.worker_id);
        if (!worker) continue;

        const alreadyClaimed = db.claims.findByWorker(worker.id).find(c => c.trigger_event === event.name);
        if (alreadyClaimed) continue;

        const fraud = runFraudCheck(worker, zone);
        const payout = calculatePayout(worker, policy, new Date());

        const status = fraud.tier === 'tier1' ? 'approved' : fraud.tier === 'tier2' ? 'fraud_check' : 'under_review';
        const claim = db.claims.create({
          worker_id: worker.id,
          policy_id: policy.id,
          trigger_type: event.type,
          trigger_event: event.name,
          trigger_zone: zone,
          income_loss_estimated: payout.estimated_loss,
          payout_amount: payout.payout_amount,
          coverage_ratio: payout.coverage_ratio,
          status,
          fraud_score: fraud.fraud_score,
          fraud_flags: fraud.flags,
          tier: fraud.tier
        });

        if (fraud.tier === 'tier1') {
          db.claims.update(claim.id, { status: 'paid', paid_at: new Date().toISOString(), notes: `₹${payout.payout_amount} sent to ${worker.upi_id}` });
        }

        if (io) {
          io.emit('claim_update', { worker_id: worker.id, worker_name: worker.name, event: event.name, payout: payout.payout_amount, status, tier: fraud.tier });
        }
      }
    }
  }
}

module.exports = { runTriggerCheck };
