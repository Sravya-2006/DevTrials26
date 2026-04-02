const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

const FILES = {
  workers: path.join(DB_DIR, 'workers.json'),
  policies: path.join(DB_DIR, 'policies.json'),
  claims: path.join(DB_DIR, 'claims.json'),
  zones: path.join(DB_DIR, 'zones.json')
};

const DEFAULT_ZONES = [
  { pincode: '560001', city: 'Bengaluru', risk_score: 45, disruption_history_12m: 3, is_flood_prone: false, is_curfew_prone: true },
  { pincode: '560002', city: 'Bengaluru', risk_score: 60, disruption_history_12m: 6, is_flood_prone: true, is_curfew_prone: true },
  { pincode: '400001', city: 'Mumbai', risk_score: 75, disruption_history_12m: 9, is_flood_prone: true, is_curfew_prone: false },
  { pincode: '110001', city: 'Delhi', risk_score: 70, disruption_history_12m: 8, is_flood_prone: false, is_curfew_prone: true },
  { pincode: '600001', city: 'Chennai', risk_score: 65, disruption_history_12m: 7, is_flood_prone: true, is_curfew_prone: false }
];

function read(file) {
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}

function write(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function nextId(items) {
  return items.length === 0 ? 1 : Math.max(...items.map(i => i.id)) + 1;
}

if (read(FILES.zones).length === 0) write(FILES.zones, DEFAULT_ZONES);

const db = {
  workers: {
    findAll: () => read(FILES.workers),
    findById: (id) => read(FILES.workers).find(w => w.id === parseInt(id)),
    findByPhone: (phone) => read(FILES.workers).find(w => w.phone === phone),
    create: (data) => {
      const workers = read(FILES.workers);
      const worker = { id: nextId(workers), ...data, account_created_at: new Date().toISOString(), is_verified: true, is_blacklisted: false };
      workers.push(worker);
      write(FILES.workers, workers);
      return worker;
    },
    update: (id, data) => {
      const workers = read(FILES.workers);
      const idx = workers.findIndex(w => w.id === parseInt(id));
      if (idx === -1) return null;
      workers[idx] = { ...workers[idx], ...data };
      write(FILES.workers, workers);
      return workers[idx];
    }
  },
  policies: {
    findAll: () => read(FILES.policies),
    findById: (id) => read(FILES.policies).find(p => p.id === parseInt(id)),
    findActive: (workerId) => read(FILES.policies).find(p => p.worker_id === parseInt(workerId) && p.is_active && new Date(p.week_end) >= new Date()),
    findByWorker: (workerId) => read(FILES.policies).filter(p => p.worker_id === parseInt(workerId)),
    create: (data) => {
      const policies = read(FILES.policies);
      const policy = { id: nextId(policies), ...data, created_at: new Date().toISOString() };
      policies.push(policy);
      write(FILES.policies, policies);
      return policy;
    },
    update: (id, data) => {
      const policies = read(FILES.policies);
      const idx = policies.findIndex(p => p.id === parseInt(id));
      if (idx === -1) return null;
      policies[idx] = { ...policies[idx], ...data };
      write(FILES.policies, policies);
      return policies[idx];
    },
    deactivateAll: (workerId) => {
      const policies = read(FILES.policies);
      policies.forEach(p => { if (p.worker_id === parseInt(workerId)) p.is_active = false; });
      write(FILES.policies, policies);
    }
  },
  claims: {
    findAll: () => read(FILES.claims),
    findById: (id) => read(FILES.claims).find(c => c.id === parseInt(id)),
    findByWorker: (workerId) => read(FILES.claims).filter(c => c.worker_id === parseInt(workerId)),
    findByStatus: (status) => read(FILES.claims).filter(c => c.status === status),
    create: (data) => {
      const claims = read(FILES.claims);
      const claim = { id: nextId(claims), ...data, triggered_at: new Date().toISOString() };
      claims.push(claim);
      write(FILES.claims, claims);
      return claim;
    },
    update: (id, data) => {
      const claims = read(FILES.claims);
      const idx = claims.findIndex(c => c.id === parseInt(id));
      if (idx === -1) return null;
      claims[idx] = { ...claims[idx], ...data };
      write(FILES.claims, claims);
      return claims[idx];
    },
    findRecentByZone: (zone, minutes) => {
      const cutoff = new Date(Date.now() - minutes * 60 * 1000);
      return read(FILES.claims).filter(c => c.trigger_zone === zone && new Date(c.triggered_at) > cutoff);
    },
    findRecentPaid: (workerId, days) => {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return read(FILES.claims).filter(c => c.worker_id === parseInt(workerId) && c.status === 'paid' && new Date(c.triggered_at) > cutoff);
    }
  },
  zones: {
    findAll: () => read(FILES.zones),
    findByPincode: (pincode) => read(FILES.zones).find(z => z.pincode === pincode)
  }
};

module.exports = db;
