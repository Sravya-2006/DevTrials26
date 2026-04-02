const express = require('express');
const router = express.Router();
const mockData = require('../mock-data/calamityEvents.json');

router.get('/active', (req, res) => {
  const all = [
    ...mockData.weather_events.filter(e => e.is_active).map(e => ({ ...e, trigger_type: 'T1' })),
    ...mockData.aqi_events.filter(e => e.is_active).map(e => ({ ...e, trigger_type: 'T2' })),
    ...mockData.civic_events.filter(e => e.is_active).map(e => ({ ...e, trigger_type: 'T3' })),
    ...mockData.platform_events.filter(e => e.is_active).map(e => ({ ...e, trigger_type: 'T4' }))
  ];
  res.json({ active_triggers: all, count: all.length });
});

router.get('/zone/:pincode', (req, res) => {
  const { pincode } = req.params;
  const all = [
    ...mockData.weather_events.filter(e => e.affected_zones.includes(pincode)).map(e => ({ ...e, trigger_type: 'T1' })),
    ...mockData.aqi_events.filter(e => e.affected_zones.includes(pincode)).map(e => ({ ...e, trigger_type: 'T2' })),
    ...mockData.civic_events.filter(e => e.affected_zones.includes(pincode)).map(e => ({ ...e, trigger_type: 'T3' })),
    ...mockData.platform_events.filter(e => e.affected_zones.includes(pincode)).map(e => ({ ...e, trigger_type: 'T4' }))
  ];
  const active = all.filter(e => e.is_active);
  res.json({ zone: pincode, active_triggers: active, all_triggers: all, risk_level: active.length === 0 ? 'low' : active.length === 1 ? 'medium' : 'high', alert: active.length > 0 });
});

module.exports = router;
