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
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT OR IGNORE INTO settings VALUES('maintenance','0');
`);

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
module.exports = db;
