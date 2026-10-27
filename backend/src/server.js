require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const ADMIN_KEY = process.env.ADMIN_KEY || 'dev-admin';
const FREE_SECONDS = 180;
const app = express();
app.use(cors());
app.use(express.json());

const ah = fn => (req, res) => Promise.resolve(fn(req, res)).catch(e => { console.error(e); res.status(500).json({ error: 'Server error' }); });
const maintenanceOn = () => db.prepare("SELECT value FROM settings WHERE key='maintenance'").get().value === '1';
const perMin = t => Math.ceil(t.rate_cents_per_hr / 60);
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, wallet_cents: u.wallet_cents });
const sign = u => jwt.sign({ id: u.id }, SECRET, { expiresIn: '30d' });
const therapistOut = t => ({ ...t, slots: JSON.parse(t.slots), online: !!t.online, per_min_cents: perMin(t) });

/* ---- topics (shared by explainer and chat replies) ---- */
const TOPICS = [
  { key: 'career', re: /career|job|work|promot|boss|resume|interview|quit|salary/, hue: ['#FF9F1C', '#C9541A'],
    scenes: [['💼','Stuck or unsure about your career?'],['🧭','A coach helps you see your strengths'],['🗺️','Together you map realistic next steps'],['🤝','Practise interviews and salary talks'],['🚀','Leave every session with a plan']],
    reply: 'Career questions are easier one step at a time. Which part feels most stuck: the role, the boss or the direction?' },
  { key: 'stress', re: /stress|anx|worr|overwhelm|panic|burn|sleep|tired|sad|depress/, hue: ['#5A4FA3', '#2B6F8F'],
    scenes: [['🌧️','Feeling anxious or overwhelmed?'],['🫶','A therapist offers a safe, judgement-free space'],['🧠','Learn why your mind reacts this way'],['🌬️','Build simple tools for daily life'],['🌤️','Small steps toward feeling lighter']],
    reply: 'That sounds heavy, and I’m glad you said it. When did you last feel properly rested?' },
  { key: 'relationships', re: /relation|partner|marri|family|friend|lonely|divorce|breakup|communicat/, hue: ['#8F3B5F', '#5A4FA3'],
    scenes: [['💬','Struggling to connect or communicate?'],['👂','A therapist helps everyone feel heard'],['🔍','Spot patterns that keep repeating'],['🪢','Practise kinder, clearer conversations'],['💞','Rebuild trust at your own pace']],
    reply: 'Relationships hold two people’s stories. Can you tell me about a recent moment that stung?' },
  { key: 'life', re: /./, hue: ['#FDC500', '#FF9F1C'],
    scenes: [['🌱','Not sure what you want from life?'],['✨','A life coach asks the questions you can’t ask yourself'],['🎯','Turn vague wishes into clear goals'],['📅','Build habits that stick'],['🌟','Someone in your corner every week']],
    reply: 'Thanks for sharing that. If things were going well a year from now, what would be different?' },
];
const topicFor = q => TOPICS.find(t => t.re.test(String(q).toLowerCase()));

/* ---- public ---- */
app.get('/api/status', (req, res) => res.json({ maintenance: maintenanceOn() }));
app.put('/api/admin/maintenance', (req, res) => {
  if (req.get('x-admin-key') !== ADMIN_KEY) return res.status(401).json({ error: 'Bad admin key' });
  db.prepare("UPDATE settings SET value=? WHERE key='maintenance'").run(req.body.on ? '1' : '0');
  res.json({ maintenance: !!req.body.on });
});

/* maintenance gate: everything below returns 503 while the switch is on */
app.use('/api', (req, res, next) => maintenanceOn() ? res.status(503).json({ error: 'Under maintenance', maintenance: true }) : next());

app.post('/api/auth/register', ah((req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !/\S+@\S+\.\S+/.test(email || '') || (password || '').length < 6)
    return res.status(400).json({ error: 'Name, valid email and a 6+ character password are required' });
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email.toLowerCase())) return res.status(409).json({ error: 'Email already registered' });
  const id = db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(name.trim(), email.toLowerCase(), bcrypt.hashSync(password, 10)).lastInsertRowid;
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  res.status(201).json({ token: sign(u), user: publicUser(u) });
}));

app.post('/api/auth/login', ah((req, res) => {
  const { email, password } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(String(email || '').toLowerCase());
  if (!u || !bcrypt.compareSync(password || '', u.password_hash)) return res.status(401).json({ error: 'Wrong email or password' });
  res.json({ token: sign(u), user: publicUser(u) });
}));

app.get('/api/explainer', (req, res) => { const t = topicFor(req.query.q || ''); res.json({ topic: t.key, hue: t.hue, scenes: t.scenes }); });

/* ---- authenticated ---- */
app.use('/api', (req, res, next) => {
  try {
    const { id } = jwt.verify((req.get('authorization') || '').replace('Bearer ', ''), SECRET);
    req.user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    return req.user ? next() : res.status(401).json({ error: 'Unknown user' });
  } catch { res.status(401).json({ error: 'Please sign in again' }); }
});

app.get('/api/me', (req, res) => res.json({ user: publicUser(req.user) }));
app.get('/api/therapists', (req, res) => res.json(db.prepare('SELECT * FROM therapists ORDER BY online DESC, rating DESC').all().map(therapistOut)));
app.get('/api/therapists/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM therapists WHERE id=?').get(req.params.id);
  t ? res.json(therapistOut(t)) : res.status(404).json({ error: 'Not found' });
});

app.post('/api/wallet/topup', ah((req, res) => {
  const amount = Math.round(Number(req.body.amount) * 100);
  if (!(amount >= 100 && amount <= 50000)) return res.status(400).json({ error: 'Amount must be $1 to $500' });
  db.prepare('UPDATE users SET wallet_cents = wallet_cents + ? WHERE id=?').run(amount, req.user.id); // demo: integrate Stripe here
  res.json({ wallet_cents: db.prepare('SELECT wallet_cents FROM users WHERE id=?').get(req.user.id).wallet_cents });
}));

app.get('/api/bookings', (req, res) => res.json(db.prepare(
  `SELECT b.id,b.slot,b.resources,t.id therapist_id,t.name therapist_name,t.role FROM bookings b JOIN therapists t ON t.id=b.therapist_id WHERE b.user_id=? ORDER BY b.id DESC`
).all(req.user.id).map(b => ({ ...b, resources: JSON.parse(b.resources) }))));

app.post('/api/bookings', ah((req, res) => {
  const { therapist_id, slot, resources = [] } = req.body || {};
  const t = db.prepare('SELECT * FROM therapists WHERE id=?').get(therapist_id);
  if (!t || !JSON.parse(t.slots).includes(slot)) return res.status(400).json({ error: 'Invalid guide or time' });
  if (db.prepare('SELECT 1 FROM bookings WHERE therapist_id=? AND slot=?').get(t.id, slot)) return res.status(409).json({ error: 'That time was just taken' });
  const id = db.prepare('INSERT INTO bookings(user_id,therapist_id,slot,resources) VALUES(?,?,?,?)').run(req.user.id, t.id, slot, JSON.stringify(resources)).lastInsertRowid;
  res.status(201).json({ id });
}));
app.delete('/api/bookings/:id', (req, res) => { db.prepare('DELETE FROM bookings WHERE id=? AND user_id=?').run(req.params.id, req.user.id); res.json({ ok: true }); });

/* ---- chat sessions with per-minute billing ---- */
app.post('/api/sessions', ah((req, res) => {
  const t = db.prepare('SELECT * FROM therapists WHERE id=?').get(req.body.therapist_id);
  if (!t) return res.status(404).json({ error: 'Guide not found' });
  if (!t.online) return res.status(409).json({ error: `${t.name} is busy right now` });
  if (req.user.wallet_cents < perMin(t)) return res.status(402).json({ error: 'Please add money to your wallet' });
  const started = Math.floor(Date.now() / 1000);
  const id = db.prepare('INSERT INTO sessions(user_id,therapist_id,started_at) VALUES(?,?,?)').run(req.user.id, t.id, started).lastInsertRowid;
  const hello = `Hi ${req.user.name.split(' ')[0]}, I’m ${t.name.replace('Dr. ', '')}. What would you like to talk about today?`;
  db.prepare("INSERT INTO messages(session_id,sender,body) VALUES(?, 'guide', ?)").run(id, hello);
  res.status(201).json({ id, started_at: started, free_seconds: FREE_SECONDS, per_min_cents: perMin(t), hello });
}));

app.post('/api/sessions/:id/messages', ah((req, res) => {
  const s = db.prepare('SELECT * FROM sessions WHERE id=? AND user_id=? AND ended_at IS NULL').get(req.params.id, req.user.id);
  const body = String(req.body.body || '').trim().slice(0, 1000);
  if (!s || !body) return res.status(400).json({ error: 'Session closed or empty message' });
  const t = db.prepare('SELECT * FROM therapists WHERE id=?').get(s.therapist_id);
  const elapsed = Math.floor(Date.now() / 1000) - s.started_at;
  const billable = elapsed > FREE_SECONDS ? Math.ceil((elapsed - FREE_SECONDS) / 60) : 0;
  const cost = (billable - s.billed_minutes) * perMin(t);
  if (cost > req.user.wallet_cents) {
    db.prepare('UPDATE sessions SET ended_at=? WHERE id=?').run(Math.floor(Date.now() / 1000), s.id);
    return res.status(402).json({ error: 'Balance too low, session ended' });
  }
  const reply = topicFor(body).reply;
  db.transaction(() => {
    if (cost > 0) {
      db.prepare('UPDATE users SET wallet_cents = wallet_cents - ? WHERE id=?').run(cost, req.user.id);
      db.prepare('UPDATE sessions SET billed_minutes=? WHERE id=?').run(billable, s.id);
    }
    const ins = db.prepare('INSERT INTO messages(session_id,sender,body) VALUES(?,?,?)');
    ins.run(s.id, 'user', body); ins.run(s.id, 'guide', reply);
  })();
  res.json({ reply, wallet_cents: db.prepare('SELECT wallet_cents FROM users WHERE id=?').get(req.user.id).wallet_cents });
}));

app.post('/api/sessions/:id/end', (req, res) => {
  db.prepare('UPDATE sessions SET ended_at=? WHERE id=? AND user_id=?').run(Math.floor(Date.now() / 1000), req.params.id, req.user.id);
  res.json({ ok: true, wallet_cents: db.prepare('SELECT wallet_cents FROM users WHERE id=?').get(req.user.id).wallet_cents });
});

app.listen(process.env.PORT || 4000, () => console.log('Dialogue API on :' + (process.env.PORT || 4000)));
