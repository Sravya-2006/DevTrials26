const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/send-otp', (req, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  console.log(`OTP for ${req.body.phone}: ${otp}`);
  res.json({ message: 'OTP sent!', otp_preview: otp });
});

router.post('/verify-otp', (req, res) => {
  const { otp } = req.body;
  if (otp && otp.toString().length === 6) {
    res.json({ verified: true, message: 'OTP verified!' });
  } else {
    res.status(400).json({ verified: false, error: 'Invalid OTP' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, phone, upi_id, upi_provider, zone_pincode, city, platform, peak_start, peak_end, avg_weekly_income, password } = req.body;

    if (db.workers.findByPhone(phone)) {
      return res.status(400).json({ error: 'Phone already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const worker = db.workers.create({
      name, phone, upi_id, upi_provider,
      zone_pincode, city,
      platform: platform || 'amazon',
      peak_start: peak_start || 17,
      peak_end: peak_end || 21,
      avg_weekly_income: avg_weekly_income || 5000,
      password_hash
    });

    const token = jwt.sign({ id: worker.id, phone: worker.phone }, process.env.JWT_SECRET || 'shieldshift_secret', { expiresIn: '7d' });
    res.status(201).json({ message: 'Welcome to ShieldShift!', token, worker });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const worker = db.workers.findByPhone(phone);
    if (!worker) return res.status(401).json({ error: 'Phone not found' });
    if (worker.is_blacklisted) return res.status(403).json({ error: 'Account suspended' });

    const valid = await bcrypt.compare(password, worker.password_hash);
    if (!valid) return res.status(401).json({ error: 'Wrong password' });

    const token = jwt.sign({ id: worker.id, phone: worker.phone }, process.env.JWT_SECRET || 'shieldshift_secret', { expiresIn: '7d' });
    const { password_hash, ...safeWorker } = worker;
    res.json({ message: 'Login successful', token, worker: safeWorker });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
