const Database = require('better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

let dbPath = path.resolve(__dirname, process.env.DB_PATH || './lms.db');

// In Vercel serverless functions, the file system is read-only. We copy the DB to /tmp so the app can still run.
// Note: In Vercel, data saved here will reset after periods of inactivity, but it will prevent immediate crashes.
if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/lms.db';
  if (!fs.existsSync(tmpDbPath)) {
    try {
      fs.copyFileSync(dbPath, tmpDbPath);
    } catch (err) {
      console.error('Error copying DB to /tmp:', err);
    }
  }
  dbPath = tmpDbPath;
}

const db = new Database(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'instructor', 'admin')) NOT NULL DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    category TEXT,
    instructor_id INTEGER,
    total_lessons INTEGER DEFAULT 0,
    total_duration TEXT,
    price INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    title TEXT NOT NULL,
    order_index INTEGER,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER,
    title TEXT NOT NULL,
    order_index INTEGER,
    video_url TEXT NOT NULL,
    duration TEXT,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    course_id INTEGER,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    course_id INTEGER,
    lesson_id INTEGER,
    status TEXT DEFAULT 'completed',
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
  );
`);

module.exports = db;
