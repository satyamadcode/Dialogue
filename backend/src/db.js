const Database = require('better-sqlite3');
const db = new Database(process.env.DB_FILE || 'dialogue.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, wallet_cents INTEGER NOT NULL DEFAULT 500,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')));
CREATE TABLE IF NOT EXISTS therapists(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, tags TEXT NOT NULL,
  bio TEXT NOT NULL, exp_years INTEGER NOT NULL, rate_cents_per_hr INTEGER NOT NULL,
  rating REAL NOT NULL, online INTEGER NOT NULL DEFAULT 1, color TEXT NOT NULL, slots TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS coach_accounts(
  id INTEGER PRIMARY KEY, therapist_id INTEGER NOT NULL UNIQUE REFERENCES therapists(id),
  email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')));
CREATE TABLE IF NOT EXISTS bookings(
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
  therapist_id INTEGER NOT NULL REFERENCES therapists(id), slot TEXT NOT NULL,
  resources TEXT NOT NULL DEFAULT '[]', created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')));
CREATE TABLE IF NOT EXISTS sessions(
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
  therapist_id INTEGER NOT NULL REFERENCES therapists(id),
  started_at INTEGER NOT NULL, ended_at INTEGER, billed_minutes INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS messages(
  id INTEGER PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES sessions(id),
  sender TEXT NOT NULL, body TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')));
CREATE TABLE IF NOT EXISTS reflection_entries(
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
  therapist_id INTEGER REFERENCES therapists(id), session_id INTEGER REFERENCES sessions(id),
  kind TEXT NOT NULL CHECK(kind IN ('journal','gratitude')), entry_date TEXT NOT NULL,
  body TEXT NOT NULL, shared INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')));
CREATE TABLE IF NOT EXISTS mood_entries(
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
  entry_date TEXT NOT NULL, mood TEXT NOT NULL, note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  UNIQUE(user_id, entry_date));
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT OR IGNORE INTO settings VALUES('maintenance','0');
`);

const columns = db.prepare('PRAGMA table_info(therapists)').all().map(column => column.name);
if (!columns.includes('full_bio')) db.exec("ALTER TABLE therapists ADD COLUMN full_bio TEXT NOT NULL DEFAULT ''");

if (db.prepare('SELECT COUNT(*) c FROM therapists').get().c === 0) {
  const add = db.prepare(`INSERT INTO therapists(name,role,tags,bio,exp_years,rate_cents_per_hr,rating,online,color,slots) VALUES(?,?,?,?,?,?,?,?,?,?)`);
  [
    ['Dr. Maya Okafor','Therapist','Anxiety, Stress, Relationships','Ten years helping people untangle anxiety and build calmer routines.',10,9000,4.9,1,'#2F6B5A',['Mon 10:00','Tue 14:00','Thu 16:30']],
    ['Jordan Reyes','Career coach','Career, Interviews, Leadership','Former recruiter. Career changes, offers and negotiation.',8,7000,4.8,1,'#B4572F',['Tue 09:00','Wed 12:00','Fri 15:00']],
    ['Priya Nair','Couples therapist','Relationships, Family','Communication, trust and hard transitions for couples and families.',12,10000,5.0,0,'#5A4FA3',['Mon 17:00','Wed 18:30','Sat 11:00']],
    ['Sam Whitfield','Life coach','Life, Confidence, Habits','Get unstuck, set goals that fit your real life and follow through.',6,6000,4.7,1,'#2B6F8F',['Tue 18:00','Thu 08:00','Sat 09:30']],
    ['Dr. Elena Park','Psychologist','Stress, Grief, Low mood','Evidence-based support for anxiety, low mood and grief.',15,12000,4.9,0,'#8F3B5F',['Mon 13:00','Fri 10:00','Fri 16:00']],
    ['Marcus Bell','Career & leadership coach','Career, Confidence, Promotions','Big career questions turned into clear next steps.',9,8500,4.8,1,'#4B6B2F',['Wed 08:00','Thu 12:30','Sat 10:00']],
  ].forEach(t => add.run(...t.slice(0,9), JSON.stringify(t[9])));
}

const fullBios = [
  'Dr. Maya offers a calm, collaborative space for people navigating anxiety, stress, and relationship changes. Her approach combines practical grounding tools with careful attention to what matters in your everyday life. You set the pace and decide what feels useful.',
  'Jordan helps people make career decisions without losing sight of the person behind the job title. With a background in recruiting, he supports career changes, interviews, leadership challenges, and clear, confident negotiation.',
  'Priya works with couples and families who want to feel heard again. She helps people slow down difficult conversations, understand repeating patterns, and practise communication that makes room for everyone involved.',
  'Sam helps people turn a sense of being stuck into small steps that fit real life. Sessions focus on confidence, habits, and goals you choose—not a one-size-fits-all plan.',
  'Dr. Elena provides thoughtful, evidence-based care for grief, low mood, and stress. She creates a steady, non-judgmental space and works with you to find coping tools that feel manageable.',
  'Marcus supports people navigating career growth, confidence, and leadership transitions. His practical coaching helps turn big questions into specific next steps while keeping your values and wellbeing in view.',
];
const updateFullBio = db.prepare('UPDATE therapists SET full_bio=? WHERE id=? AND full_bio=\'\'');
fullBios.forEach((bio, index) => updateFullBio.run(bio, index + 1));

module.exports = db;
