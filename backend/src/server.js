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
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role || 'client', therapist_id: u.therapist_id || null, wallet_cents: u.wallet_cents || 0 });
const sign = u => jwt.sign({ id: u.id, role: u.role || 'client', therapist_id: u.therapist_id || null }, SECRET, { expiresIn: '30d' });
const therapistOut = t => ({ ...t, slots: JSON.parse(t.slots), online: !!t.online, per_min_cents: perMin(t) });
const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
const validDate = date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};

/* ---- topics (shared by explainer and chat replies) ---- */
const TOPICS = [
  { key: 'career', re: /career|job|work|promot|boss|resume|interview|quit|salary/, hue: ['#89A987', '#527A5A'],
    scenes: [['💼','Stuck or unsure about your career?'],['🧭','A coach helps you see your strengths'],['🗺️','Together you map realistic next steps'],['🤝','Practise interviews and salary talks'],['🚀','Leave every session with a plan']],
    reply: 'Career questions are easier one step at a time. Which part feels most stuck: the role, the boss or the direction?' },
  { key: 'stress', re: /stress|anx|worr|overwhelm|panic|burn|sleep|tired|sad|depress/, hue: ['#9CB69A', '#527A67'],
    scenes: [['🌧️','Feeling anxious or overwhelmed?'],['🫶','A therapist offers a safe, judgement-free space'],['🧠','Learn why your mind reacts this way'],['🌬️','Build simple tools for daily life'],['🌤️','Small steps toward feeling lighter']],
    reply: 'That sounds heavy, and I’m glad you said it. When did you last feel properly rested?' },
  { key: 'relationships', re: /relation|partner|marri|family|friend|lonely|divorce|breakup|communicat/, hue: ['#A4BCA0', '#66836A'],
    scenes: [['💬','Struggling to connect or communicate?'],['👂','A therapist helps everyone feel heard'],['🔍','Spot patterns that keep repeating'],['🪢','Practise kinder, clearer conversations'],['💞','Rebuild trust at your own pace']],
    reply: 'Relationships hold two people’s stories. Can you tell me about a recent moment that stung?' },
  { key: 'life', re: /./, hue: ['#B8D2B4', '#6F9A72'],
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
app.post('/api/admin/coach-accounts', ah((req, res) => {
  if (req.get('x-admin-key') !== ADMIN_KEY) return res.status(401).json({ error: 'Bad admin key' });
  const { therapist_id, email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const coachPassword = String(password || '');
  const therapist = db.prepare('SELECT id,name FROM therapists WHERE id=?').get(therapist_id);
  if (!therapist || !validEmail(normalizedEmail) || coachPassword.length < 10)
    return res.status(400).json({ error: 'Choose a guide, valid email and a password of at least 10 characters' });
  try {
    db.prepare('INSERT INTO coach_accounts(therapist_id,email,password_hash) VALUES(?,?,?)')
      .run(therapist.id, normalizedEmail, bcrypt.hashSync(coachPassword, 10));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'That guide or email already has an account' });
    throw error;
  }
  res.status(201).json({ therapist: therapist.name, email: normalizedEmail });
}));

/* maintenance gate: everything below returns 503 while the switch is on */
app.use('/api', (req, res, next) => maintenanceOn() ? res.status(503).json({ error: 'Under maintenance', maintenance: true }) : next());

app.post('/api/auth/register', ah((req, res) => {
  const { name, email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!String(name || '').trim() || !validEmail(normalizedEmail) || String(password || '').length < 6)
    return res.status(400).json({ error: 'Name, valid email and a 6+ character password are required' });
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(normalizedEmail)) return res.status(409).json({ error: 'Email already registered' });
  const id = db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(name.trim(), normalizedEmail, bcrypt.hashSync(password, 10)).lastInsertRowid;
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(id);
  res.status(201).json({ token: sign(u), user: publicUser(u) });
}));

app.post('/api/auth/login', ah((req, res) => {
  const { email, password } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(String(email || '').trim().toLowerCase());
  if (!u || !bcrypt.compareSync(password || '', u.password_hash)) return res.status(401).json({ error: 'Wrong email or password' });
  res.json({ token: sign(u), user: publicUser(u) });
}));
app.post('/api/auth/coach/login', ah((req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const account = db.prepare(`
    SELECT c.id,c.therapist_id,c.email,c.password_hash,t.name
    FROM coach_accounts c JOIN therapists t ON t.id=c.therapist_id WHERE c.email=?
  `).get(email);
  if (!account || !bcrypt.compareSync(req.body?.password || '', account.password_hash))
    return res.status(401).json({ error: 'Email or password is incorrect' });
  const coach = { id: account.id, therapist_id: account.therapist_id, role: 'coach', name: account.name, email: account.email };
  res.json({ token: sign(coach), user: publicUser(coach) });
}));

app.get('/api/explainer', (req, res) => { const t = topicFor(req.query.q || ''); res.json({ topic: t.key, hue: t.hue, scenes: t.scenes }); });

/* ---- authenticated ---- */
app.use('/api', (req, res, next) => {
  try {
    const claims = jwt.verify((req.get('authorization') || '').replace('Bearer ', ''), SECRET);
    if (claims.role === 'coach') {
      const account = db.prepare(`
        SELECT c.id,c.therapist_id,c.email,t.name
        FROM coach_accounts c JOIN therapists t ON t.id=c.therapist_id
        WHERE c.id=? AND c.therapist_id=?
      `).get(claims.id, claims.therapist_id);
      req.user = account && { ...account, role: 'coach', wallet_cents: 0 };
    } else {
      req.user = db.prepare('SELECT *,\'client\' AS role FROM users WHERE id=?').get(claims.id);
    }
    return req.user ? next() : res.status(401).json({ error: 'Unknown user' });
  } catch { res.status(401).json({ error: 'Please sign in again' }); }
});

app.get('/api/me', (req, res) => res.json({ user: publicUser(req.user) }));
app.get('/api/coach/reflections', (req, res) => {
  if (req.user.role !== 'coach') return res.status(403).json({ error: 'Coach access required' });
  const entries = db.prepare(`
    SELECT r.id,r.kind,r.entry_date,r.body,r.created_at,u.name AS client_name,s.id AS session_id
    FROM reflection_entries r
    JOIN users u ON u.id=r.user_id
    LEFT JOIN sessions s ON s.id=r.session_id
    WHERE r.therapist_id=? AND r.shared=1
    ORDER BY r.entry_date DESC,r.created_at DESC
  `).all(req.user.therapist_id);
  res.json(entries);
});
app.use('/api', (req, res, next) => req.user.role === 'client' ? next() : res.status(403).json({ error: 'Client access required' }));

app.get('/api/reflections', (req, res) => {
  const conditions = ['r.user_id=?'];
  const params = [req.user.id];
  if (['journal', 'gratitude'].includes(req.query.kind)) {
    conditions.push('r.kind=?');
    params.push(req.query.kind);
  }
  if (validDate(req.query.date)) {
    conditions.push('r.entry_date=?');
    params.push(req.query.date);
  }
  res.json(db.prepare(`
    SELECT r.id,r.kind,r.entry_date,r.body,r.shared,r.session_id,r.therapist_id,t.name AS therapist_name
    FROM reflection_entries r LEFT JOIN therapists t ON t.id=r.therapist_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY r.entry_date DESC,r.created_at DESC
  `).all(...params).map(entry => ({ ...entry, shared: !!entry.shared })));
});
app.post('/api/reflections', ah((req, res) => {
  const { kind, body, session_id, therapist_id } = req.body || {};
  const entryBody = String(body || '').trim().slice(0, 5000);
  const entryDate = String(req.body.entry_date || '');
  const share = req.body.shared === true;
  if (!['journal', 'gratitude'].includes(kind) || !entryBody || !validDate(entryDate))
    return res.status(400).json({ error: 'Choose a reflection type, enter a note and use a valid date' });
  let guideId = therapist_id ? Number(therapist_id) : null;
  if (session_id) {
    const session = db.prepare('SELECT therapist_id FROM sessions WHERE id=? AND user_id=?').get(session_id, req.user.id);
    if (!session || (guideId && guideId !== session.therapist_id)) return res.status(400).json({ error: 'That session is not available for this reflection' });
    guideId = session.therapist_id;
  }
  if (share && !guideId) return res.status(400).json({ error: 'Choose a guide before sharing this reflection' });
  if (guideId && !db.prepare('SELECT 1 FROM therapists WHERE id=?').get(guideId))
    return res.status(400).json({ error: 'That guide could not be found' });
  const result = db.prepare(`
    INSERT INTO reflection_entries(user_id,therapist_id,session_id,kind,entry_date,body,shared)
    VALUES(?,?,?,?,?,?,?)
  `).run(req.user.id, guideId, session_id || null, kind, entryDate, entryBody, share ? 1 : 0);
  res.status(201).json({ id: result.lastInsertRowid });
}));
app.get('/api/moods', (req, res) => {
  const year = Number(req.query.year);
  const month = Number(req.query.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12)
    return res.status(400).json({ error: 'Choose a valid calendar month' });
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  res.json(db.prepare('SELECT entry_date,mood,note FROM mood_entries WHERE user_id=? AND entry_date LIKE ? ORDER BY entry_date')
    .all(req.user.id, prefix + '%'));
});
app.put('/api/moods/:date', ah((req, res) => {
  const allowedMoods = ['great', 'good', 'okay', 'low', 'rough'];
  const { mood, note = '' } = req.body || {};
  if (!validDate(req.params.date) || !allowedMoods.includes(mood))
    return res.status(400).json({ error: 'Choose a valid date and mood' });
  db.prepare(`
    INSERT INTO mood_entries(user_id,entry_date,mood,note) VALUES(?,?,?,?)
    ON CONFLICT(user_id,entry_date) DO UPDATE SET mood=excluded.mood,note=excluded.note
  `).run(req.user.id, req.params.date, mood, String(note).trim().slice(0, 500));
  res.json({ entry_date: req.params.date, mood });
}));
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
  db.prepare('UPDATE sessions SET ended_at=COALESCE(ended_at,?) WHERE id=? AND user_id=?').run(Math.floor(Date.now() / 1000), req.params.id, req.user.id);
  res.json({ ok: true, wallet_cents: db.prepare('SELECT wallet_cents FROM users WHERE id=?').get(req.user.id).wallet_cents });
});

app.listen(process.env.PORT || 4000, () => console.log('Dialogue API on :' + (process.env.PORT || 4000)));
