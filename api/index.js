const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'lms_secret_key';

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalid or expired' });
    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// --- AUTH ROUTES ---

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  try {
    const info = await db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, role || 'student');
    const user = { id: info.lastInsertRowid, name, email, role: role || 'student' };
    const token = jwt.sign(user, SECRET, { expiresIn: '24h' });
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ message: 'User already exists or invalid data' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.put('/api/auth/update-profile', authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  await db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);

  const { exp, iat, ...userWithoutExp } = req.user;
  const updatedUser = { ...userWithoutExp, name };
  const token = jwt.sign({ id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role }, SECRET, { expiresIn: '24h' });

  res.json({ message: 'Profile updated successfully', user: updatedUser, token });
});

app.put('/api/auth/update-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);

  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ message: 'Incorrect current password' });
  }

  const hashedNewPassword = bcrypt.hashSync(newPassword, 8);
  await db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedNewPassword, req.user.id);

  res.json({ message: 'Password updated successfully' });
});

// --- ADMIN ROUTES ---
app.get('/api/admin/stats', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  try {
    const totalStudentsData = await db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('student');
    const totalEnrollmentsData = await db.prepare('SELECT COUNT(*) as count FROM enrollments').get();
    const activeCoursesData = await db.prepare('SELECT COUNT(*) as count FROM courses').get();

    res.json({ 
      totalStudents: totalStudentsData?.count || 0, 
      totalEnrollments: totalEnrollmentsData?.count || 0, 
      activeCourses: activeCoursesData?.count || 0 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// --- COURSE ROUTES ---

app.get('/api/courses', async (req, res) => {
  const courses = await db.prepare(`
    SELECT c.*, COALESCE(c.instructor_name, u.name) as instructor_name,
           (SELECT l.video_url FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = c.id ORDER BY s.order_index, l.order_index LIMIT 1) as video_url
    FROM courses c 
    JOIN users u ON c.instructor_id = u.id
  `).all();
  res.json(courses);
});

app.get('/api/courses/:id', async (req, res) => {
  const course = await db.prepare(`
    SELECT c.*, COALESCE(c.instructor_name, u.name) as instructor_name 
    FROM courses c 
    JOIN users u ON c.instructor_id = u.id 
    WHERE c.id = ?
  `).get(req.params.id);

  if (!course) return res.status(404).json({ message: 'Course not found' });

  const sections = await db.prepare('SELECT * FROM sections WHERE course_id = ? ORDER BY order_index').all(req.params.id);

  for (const section of sections) {
    section.lessons = await db.prepare('SELECT * FROM lessons WHERE section_id = ? ORDER BY order_index').all(section.id);
  }

  res.json({ ...course, sections });
});

app.post('/api/courses', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  const { title, description, thumbnail, category, total_duration, price, video_url, instructor_name } = req.body;
  const info = await db.prepare(`
    INSERT INTO courses (title, description, thumbnail, category, instructor_id, total_duration, price, total_lessons, instructor_name) 
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(title, description, thumbnail, category, req.user.id, total_duration, price || 0, instructor_name || '');

  const courseId = info.lastInsertRowid;
  const sectionInfo = await db.prepare('INSERT INTO sections (course_id, title, order_index) VALUES (?, ?, ?)')
    .run(courseId, 'Course Content', 1);
  await db.prepare('INSERT INTO lessons (section_id, title, order_index, video_url, duration) VALUES (?, ?, ?, ?, ?)')
    .run(sectionInfo.lastInsertRowid, title, 1, video_url || '', total_duration || '');

  res.json({ id: courseId });
});

app.put('/api/courses/:id', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  const { title, description, thumbnail, category, total_duration, price, video_url, instructor_name } = req.body;

  const course = await db.prepare('SELECT instructor_id FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  if (req.user.role !== 'admin' && course.instructor_id !== req.user.id) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  await db.prepare(`
    UPDATE courses 
    SET title = ?, description = ?, thumbnail = ?, category = ?, total_duration = ?, price = ?, instructor_name = ?
    WHERE id = ?
  `).run(title, description, thumbnail, category, total_duration, price, instructor_name || '', req.params.id);

  const firstSection = await db.prepare('SELECT id FROM sections WHERE course_id = ? ORDER BY order_index LIMIT 1').get(req.params.id);
  if (firstSection) {
    const firstLesson = await db.prepare('SELECT id FROM lessons WHERE section_id = ? ORDER BY order_index LIMIT 1').get(firstSection.id);
    if (firstLesson) {
      await db.prepare('UPDATE lessons SET video_url = ?, duration = ?, title = ? WHERE id = ?').run(video_url || '', total_duration || '', title, firstLesson.id);
    } else {
      await db.prepare('INSERT INTO lessons (section_id, title, order_index, video_url, duration) VALUES (?, ?, ?, ?, ?)')
        .run(firstSection.id, title, 1, video_url || '', total_duration || '');
      await db.prepare('UPDATE courses SET total_lessons = total_lessons + 1 WHERE id = ?').run(req.params.id);
    }
  } else {
    const sectionInfo = await db.prepare('INSERT INTO sections (course_id, title, order_index) VALUES (?, ?, ?)')
      .run(req.params.id, 'Course Content', 1);
    await db.prepare('INSERT INTO lessons (section_id, title, order_index, video_url, duration) VALUES (?, ?, ?, ?, ?)')
      .run(sectionInfo.lastInsertRowid, title, 1, video_url || '', total_duration || '');
    await db.prepare('UPDATE courses SET total_lessons = total_lessons + 1 WHERE id = ?').run(req.params.id);
  }

  res.json({ message: 'Course updated successfully' });
});

app.delete('/api/courses/:id', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  const course = await db.prepare('SELECT instructor_id FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  if (req.user.role !== 'admin' && course.instructor_id !== req.user.id) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  await db.prepare('DELETE FROM progress WHERE course_id = ?').run(req.params.id);
  await db.prepare('DELETE FROM enrollments WHERE course_id = ?').run(req.params.id);
  await db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);

  res.json({ message: 'Course deleted successfully' });
});

// Add Section
app.post('/api/courses/:id/sections', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  const { title, order_index } = req.body;
  const info = await db.prepare('INSERT INTO sections (course_id, title, order_index) VALUES (?, ?, ?)').run(req.params.id, title, order_index);
  res.json({ id: info.lastInsertRowid });
});

// Add Lesson
app.post('/api/sections/:id/lessons', authenticateToken, authorizeRoles('admin', 'instructor'), async (req, res) => {
  const { title, order_index, video_url, duration } = req.body;
  const info = await db.prepare('INSERT INTO lessons (section_id, title, order_index, video_url, duration) VALUES (?, ?, ?, ?, ?)').run(req.params.id, title, order_index, video_url, duration);

  const section = await db.prepare('SELECT course_id FROM sections WHERE id = ?').get(req.params.id);
  await db.prepare('UPDATE courses SET total_lessons = total_lessons + 1 WHERE id = ?').run(section.course_id);

  res.json({ id: info.lastInsertRowid });
});

// --- ENROLLMENT & PROGRESS ---

app.post('/api/courses/:id/enroll', authenticateToken, async (req, res) => {
  try {
    await db.prepare('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)').run(req.user.id, req.params.id);
    res.json({ message: 'Enrolled successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Already enrolled' });
  }
});

app.get('/api/dashboard/enrolled', authenticateToken, async (req, res) => {
  const courses = await db.prepare(`
    SELECT c.*, u.name as instructor_name, e.enrolled_at
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN users u ON c.instructor_id = u.id
    WHERE e.user_id = ?
  `).all(req.user.id);

  for (const course of courses) {
    const completedData = await db.prepare('SELECT COUNT(*) as count FROM progress WHERE user_id = ? AND course_id = ?').get(req.user.id, course.id);
    const completed = completedData?.count || 0;

    const lastLesson = await db.prepare(`
      SELECT l.title 
      FROM progress p 
      JOIN lessons l ON p.lesson_id = l.id 
      WHERE p.user_id = ? AND p.course_id = ? 
      ORDER BY p.completed_at DESC 
      LIMIT 1
    `).get(req.user.id, course.id);

    course.completed_lessons = completed;
    course.progress_percentage = course.total_lessons > 0 ? Math.round((completed / course.total_lessons) * 100) : 0;
    course.last_lesson_title = lastLesson ? lastLesson.title : 'Not started yet';
  }

  res.json(courses);
});

app.get('/api/courses/:id/progress', authenticateToken, async (req, res) => {
  const data = await db.prepare('SELECT lesson_id FROM progress WHERE user_id = ? AND course_id = ?').all(req.user.id, req.params.id);
  const completedLessons = data.map(p => p.lesson_id);
  res.json({ completedLessons });
});

app.post('/api/courses/:id/lessons/:lessonId/complete', authenticateToken, async (req, res) => {
  try {
    // Note: Postgres INSERT OR IGNORE is ON CONFLICT DO NOTHING
    await db.prepare('INSERT INTO progress (user_id, course_id, lesson_id) VALUES (?, ?, ?) ON CONFLICT DO NOTHING').run(req.user.id, req.params.id, req.params.lessonId);
    res.json({ message: 'Marked as completed' });
  } catch (err) {
    res.status(400).json({ message: 'Error marking progress' });
  }
});

// --- STUDENT MANAGEMENT (Admin) ---

app.get('/api/admin/students', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const students = await db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.created_at, u.blocked,
             (SELECT COUNT(*) FROM enrollments WHERE user_id = u.id) as enrolled_courses,
             (SELECT COUNT(*) FROM progress p JOIN courses c ON p.course_id = c.id WHERE p.user_id = u.id) as completed_lessons
      FROM users u 
      WHERE u.role = 'student'
      ORDER BY u.created_at DESC
    `).all();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching students' });
  }
});

app.get('/api/admin/students/search', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const students = await db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.created_at, u.blocked,
             (SELECT COUNT(*) FROM enrollments WHERE user_id = u.id) as enrolled_courses,
             (SELECT COUNT(*) FROM progress p JOIN courses c ON p.course_id = c.id WHERE p.user_id = u.id) as completed_lessons
      FROM users u 
      WHERE u.role = 'student' AND (u.name LIKE ? OR u.email LIKE ?)
      ORDER BY u.created_at DESC
    `).all(`%${q}%`, `%${q}%`);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Error searching students' });
  }
});

app.put('/api/admin/students/:id/block', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const student = await db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(req.params.id, 'student');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const newBlockedStatus = student.blocked ? 0 : 1;
    await db.prepare('UPDATE users SET blocked = ? WHERE id = ?').run(newBlockedStatus, req.params.id);

    res.json({ message: newBlockedStatus ? 'Student blocked' : 'Student unblocked', blocked: newBlockedStatus });
  } catch (err) {
    res.status(500).json({ message: 'Error updating student status' });
  }
});

app.delete('/api/admin/students/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const student = await db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(req.params.id, 'student');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    await db.prepare('DELETE FROM progress WHERE user_id = ?').run(req.params.id);
    await db.prepare('DELETE FROM enrollments WHERE user_id = ?').run(req.params.id);
    await db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

    res.json({ message: 'Student removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing student' });
  }
});

app.get('/api/admin/students/:id/progress', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const student = await db.prepare('SELECT id, name, email FROM users WHERE id = ? AND role = ?').get(req.params.id, 'student');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const enrollments = await db.prepare(`
      SELECT c.id, c.title, c.category, c.thumbnail, c.total_lessons, c.total_duration,
             e.enrolled_at,
             (SELECT COUNT(*) FROM progress p WHERE p.user_id = e.user_id AND p.course_id = e.course_id) as completed_lessons
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ?
    `).all(req.params.id);

    for (const enrollment of enrollments) {
      enrollment.progress_percentage = enrollment.total_lessons > 0
        ? Math.round((enrollment.completed_lessons / enrollment.total_lessons) * 100)
        : 0;
    }

    res.json({ student, enrollments });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching student progress' });
  }
});

app.get('/api/admin/students/:id/courses', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const student = await db.prepare('SELECT id, name, email FROM users WHERE id = ? AND role = ?').get(req.params.id, 'student');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const completedCourses = await db.prepare(`
      SELECT c.id, c.title, c.category, c.thumbnail, c.total_lessons, c.total_duration,
             e.enrolled_at,
             (SELECT COUNT(*) FROM progress p WHERE p.user_id = e.user_id AND p.course_id = e.course_id) as completed_lessons,
             (SELECT MAX(p.completed_at) FROM progress p WHERE p.user_id = e.user_id AND p.course_id = e.course_id) as completed_at
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ?
    `).all(req.params.id);

    const filtered = completedCourses.filter(course =>
      course.total_lessons > 0 && course.completed_lessons >= course.total_lessons
    );

    res.json({ student, completedCourses: filtered });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching completed courses' });
  }
});

app.get('/api/admin/analytics/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    // Note: SQLite DATE('now', '-X days') in PostgreSQL is CURRENT_DATE - INTERVAL 'X days'
    const users = await db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM users 
      WHERE created_at >= (CURRENT_DATE - INTERVAL '${days} days') AND role = 'student'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user analytics' });
  }
});

app.get('/api/admin/analytics/courses', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const courses = await db.prepare('SELECT c.id, c.title, c.total_lessons, (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrolled_count FROM courses c').all();
    
    // Convert to async array map
    const result = await Promise.all(courses.map(async course => {
      const enrollments = await db.prepare('SELECT user_id FROM enrollments WHERE course_id = ?').all(course.id);
      let completed = 0;
      for (const e of enrollments) {
        const done = await db.prepare('SELECT COUNT(*) as n FROM progress p JOIN lessons l ON p.lesson_id = l.id JOIN sections s ON l.section_id = s.id WHERE s.course_id = ? AND p.user_id = ?').get(course.id, e.user_id);
        if (done && done.n >= course.total_lessons && course.total_lessons > 0) completed++;
      }
      return { id: course.id, title: course.title, enrolled_count: course.enrolled_count, completed_count: completed };
    }));
    res.json(result);
  } catch (err) {
    console.error('Course analytics error:', err);
    res.status(500).json({ message: 'Error fetching course analytics' });
  }
});

module.exports = app;
