const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Use DATABASE_URL or JWT_SECRET1 from environment variable
const connectionString = process.env.DATABASE_URL || process.env.JWT_SECRET1;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

// Test connection
pool.query('SELECT NOW()')
  .then(() => console.log('Database connected successfully!'))
  .catch(err => console.error('Database connection error:', err));

const db = {
  prepare: (sql) => {
    let pgSql = sql;
    let index = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', `$${index++}`);
    }

    // SQLite uses 1 as true and 0 as false, Postgres uses true/false
    const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
    if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
      pgSql += ' RETURNING id';
    }

    return {
      get: async (...args) => {
        try {
          const res = await pool.query(pgSql, args);
          return res.rows[0];
        } catch (e) {
          console.error("Query Error getting:", pgSql, args, e);
          throw e;
        }
      },
      all: async (...args) => {
        try {
          const res = await pool.query(pgSql, args);
          return res.rows;
        } catch (e) {
          console.error("Query Error all:", pgSql, args, e);
          throw e;
        }
      },
      run: async (...args) => {
        try {
          const res = await pool.query(pgSql, args);
          return { lastInsertRowid: isInsert && res.rows.length ? res.rows[0].id : null, changes: res.rowCount };
        } catch (e) {
          console.error("Query Error run:", pgSql, args, e);
          throw e; // We log and throw so the backend can correctly handle 400s
        }
      }
    };
  }
};

// Initialize Tables inside Supabase (if they don't exist)
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('student', 'instructor', 'admin')) NOT NULL DEFAULT 'student',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        blocked INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        thumbnail TEXT,
        category TEXT,
        instructor_name TEXT,
        instructor_id INTEGER REFERENCES users(id),
        total_lessons INTEGER DEFAULT 0,
        total_duration TEXT,
        price INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        order_index INTEGER
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        section_id INTEGER REFERENCES sections(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        order_index INTEGER,
        video_url TEXT NOT NULL,
        duration TEXT
      );

      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        course_id INTEGER REFERENCES courses(id),
        enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, course_id)
      );

      CREATE TABLE IF NOT EXISTS progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        course_id INTEGER REFERENCES courses(id),
        lesson_id INTEGER REFERENCES lessons(id),
        status TEXT DEFAULT 'completed',
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, lesson_id)
      );
    `);
    console.log("Aiven Tables Connected successfully!");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
})();

module.exports = db;
