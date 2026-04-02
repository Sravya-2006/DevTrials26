const db = require('../db');

function calculatePayout(worker, policy, triggeredAt) {
  const triggerHour = new Date(triggeredAt).getHours();
  const peakStart = worker.peak_start || 17;
  const peakEnd = worker.peak_end || 21;
  const avgDailyIncome = worker.avg_weekly_income / 6;
  const hourlyRate = avgDailyIncome / 10;

  let dayPartMultiplier;
  if (triggerHour >= peakStart && triggerHour <= peakEnd) dayPartMultiplier = 1.4;
  else if (triggerHour >= peakStart - 2 && triggerHour < peakStart) dayPartMultiplier = 1.1;
  else dayPartMultiplier = 0.6;

  const hoursLost = Math.min(peakEnd - peakStart, 8);
  const estimatedLoss = hourlyRate * hoursLost * dayPartMultiplier;
  const payoutAmount = Math.min(estimatedLoss * 0.85, policy.max_payout);

  return {
    estimated_loss: Math.round(estimatedLoss),
    payout_amount: Math.round(payoutAmount),
    coverage_ratio: 0.85,
    day_part_multiplier: dayPartMultiplier,
    trigger_hour: triggerHour,
    is_peak_hours: triggerHour >= peakStart && triggerHour <= peakEnd
  };
}

function runFraudCheck(worker, triggerZone) {
  const flags = [];
  let fraudScore = 0;

  // check 1: zone mismatch
  if (worker.zone_pincode !== triggerZone) { flags.push('zone_mismatch'); fraudScore += 30; }

  // check 2: new account (under 14 days)
  const ageDays = Math.floor((Date.now() - new Date(worker.account_created_at)) / (1000 * 60 * 60 * 24));
  if (ageDays < 14) { flags.push('new_account'); fraudScore += 25; }

  // check 3: recent payouts velocity
  const recentPaid = db.claims.findRecentPaid(worker.id, 7);
  if (recentPaid.length >= 2) { flags.push('high_velocity'); fraudScore += 20; }

  // check 4: coordinated fraud - many zone claims in last 2 min
  const zoneRecent = db.claims.findRecentByZone(triggerZone, 2);
  const zoneWorkers = db.workers.findAll().filter(w => w.zone_pincode === triggerZone);
  if (zoneRecent.length / Math.max(zoneWorkers.length, 1) > 0.6 && zoneRecent.length > 5) {
    flags.push('coordinated_fraud_signal'); fraudScore += 40;
  }

  let tier, approved;
  if (fraudScore === 0) { tier = 'tier1'; approved = true; }
  else if (fraudScore <= 30) { tier = 'tier2'; approved = null; }
  else { tier = 'tier3'; approved = false; }

  return { tier, fraud_score: fraudScore, flags, approved };
}

module.exports = { runFraudCheck, calculatePayout };
