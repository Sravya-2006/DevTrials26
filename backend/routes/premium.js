const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

function calculatePremium(worker, zone) {
  const month = new Date().getMonth() + 1;
  const isMonsoon = month >= 6 && month <= 9;

  const zoneMultiplier = 0.5 + (zone.risk_score / 100);
  const seasonMultiplier = isMonsoon ? 1.4 : 1.0;
  const peakMultiplier = 0.8 + ((worker.peak_end - worker.peak_start) / 10);
  const historyMultiplier = 1 + (zone.disruption_history_12m * 0.05);

  const raw = worker.avg_weekly_income * 0.008 * zoneMultiplier * seasonMultiplier * peakMultiplier * historyMultiplier;

  let riskLevel, weeklyPremium, maxPayout;
  if (raw <= 35) { riskLevel = 'low'; weeklyPremium = 25; maxPayout = 1000; }
  else if (raw <= 60) { riskLevel = 'medium'; weeklyPremium = 45; maxPayout = 2500; }
  else { riskLevel = 'high'; weeklyPremium = 80; maxPayout = 4500; }

  const overallRiskScore = Math.min(100, Math.round(
    (zone.risk_score * 0.4) + (zone.disruption_history_12m * 3) +
    (isMonsoon ? 15 : 0) + (zone.is_flood_prone ? 10 : 0) + (zone.is_curfew_prone ? 10 : 0)
  ));

  return { riskLevel, weeklyPremium, maxPayout, overallRiskScore, breakdown: {
    zone: worker.zone_pincode,
    city: worker.city,
    season: isMonsoon ? 'Monsoon' : 'Non-monsoon',
    peak_hours: `${worker.peak_start}:00 to ${worker.peak_end}:00`,
    flood_zone: zone.is_flood_prone,
    curfew_zone: zone.is_curfew_prone,
    disruptions_last_year: zone.disruption_history_12m
  }};
}

router.get('/calculate', auth, (req, res) => {
  const worker = db.workers.findById(req.worker.id);
  const zone = db.zones.findByPincode(worker.zone_pincode) || { risk_score: 50, disruption_history_12m: 3, is_flood_prone: false, is_curfew_prone: false };
  res.json(calculatePremium(worker, zone));
});

router.post('/preview', (req, res) => {
  const { zone_pincode, avg_weekly_income, peak_start, peak_end } = req.body;
  const zone = db.zones.findByPincode(zone_pincode) || { risk_score: 50, disruption_history_12m: 3, is_flood_prone: false, is_curfew_prone: false };
  const worker = { avg_weekly_income: avg_weekly_income || 5000, peak_start: peak_start || 17, peak_end: peak_end || 21, zone_pincode, city: zone.city };
  res.json({ estimated_premium: calculatePremium(worker, zone) });
});

module.exports = { router, calculatePremium };
