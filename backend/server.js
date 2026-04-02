const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const policyRoutes = require('./routes/policy');
const claimsRoutes = require('./routes/claims');
const { router: premiumRoutes } = require('./routes/premium');
const triggerRoutes = require('./routes/triggers');
const dashboardRoutes = require('./routes/dashboard');
const { runTriggerCheck } = require('./services/triggerEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/triggers', triggerRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => res.json({ message: 'ShieldShift API running!' }));

io.on('connection', (socket) => console.log('Client connected:', socket.id));

// run trigger check every 15 minutes
cron.schedule('*/15 * * * *', () => runTriggerCheck(io));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`ShieldShift running on http://localhost:${PORT}`));
