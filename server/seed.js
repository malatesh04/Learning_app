const db = require('./db');
const bcrypt = require('bcryptjs');

const salt = bcrypt.genSaltSync(10);
const password = bcrypt.hashSync('admin123', salt);
const adminPassword = bcrypt.hashSync('Malatesh@12', salt);

try {
  // Clear existing data
  db.prepare('DELETE FROM progress').run();
  db.prepare('DELETE FROM enrollments').run();
  db.prepare('DELETE FROM lessons').run();
  db.prepare('DELETE FROM sections').run();
  db.prepare('DELETE FROM courses').run();
  db.prepare('DELETE FROM users').run();
  db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('users', 'courses', 'sections', 'lessons')").run();

  // 1. Create Users
  const adminId = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Admin User', 'malateshbn179@gmail.com', adminPassword, 'admin'
  ).lastInsertRowid;

  const instructors = [];
  const instructorNames = ['Dr. Sarah Chen', 'Marcus Thorne', 'Aisha Khan', 'David Miller', 'Elena Rodriguez'];
  
  instructorNames.forEach((name, i) => {
    const id = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      name, `instructor${i+1}@lms.com`, password, 'instructor'
    ).lastInsertRowid;
    instructors.push(id);
  });

  // 2. COURSES ARRAY
  const coursesData = [
    {
      title: 'UI/UX Design Essentials',
      description: 'Master Figma and learn the principles of modern interface design with hands-on projects.',
      category: 'Design',
      thumbnail: 'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=800&q=80',
      duration: '5h 30m',
      instructor_id: instructors[1]
    },
    {
      title: 'Python for Everyone',
      description: 'Start from zero and build your first application with Python 3. Covers logic, loops, and data.',
      category: 'Development',
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
      duration: '10h 15m',
      instructor_id: instructors[0]
    },
    {
      title: 'Cybersecurity Foundation',
      description: 'Protect yourself and your organization from modern cyber threats and data breaches.',
      category: 'IT & Software',
      thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
      duration: '4h 45m',
      instructor_id: instructors[0]
    },
    {
      title: 'Modern Digital Marketing',
      description: 'Learn SEO, Social Media Marketing, and Google Ads to grow any business online.',
      category: 'Marketing',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      duration: '8h 20m',
      instructor_id: instructors[1]
    },
    {
      title: 'Mastering React 19',
      description: 'Stay ahead of the curve with React 19 server components, hooks, and actions.',
      category: 'Development',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
      duration: '6h 00m',
      instructor_id: adminId
    },
    {
      title: 'Data Science with R',
      description: 'Learn data manipulation, visualization, and statistical analysis using the R language.',
      category: 'Data Science',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bbbda546697a?w=800&q=80',
      duration: '12h 30m',
      instructor_id: instructors[2]
    },
    {
      title: 'Machine Learning Bootcamp',
      description: 'From linear regression to neural networks. A complete guide to ML with Scikit-Learn.',
      category: 'Data Science',
      thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80',
      duration: '15h 45m',
      instructor_id: instructors[2]
    },
    {
      title: 'Photography Masterclass',
      description: 'Master your camera settings, lighting, and composition to take professional photos.',
      category: 'Photography',
      thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
      duration: '7h 15m',
      instructor_id: instructors[3]
    },
    {
      title: 'Mobile App Dev with Flutter',
      description: 'Build beautiful native apps for iOS and Android with a single codebase using Dart.',
      category: 'Development',
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
      duration: '14h 00m',
      instructor_id: instructors[4],
      price: 999
    },
    {
      title: 'Financial Analyst Course',
      description: 'Excel, Accounting, Financial Analysis, Business Analysis, and PowerPoint.',
      category: 'Finance',
      thumbnail: 'https://images.unsplash.com/photo-1454165833767-027ff33bc133?w=800&q=80',
      duration: '20h 30m',
      instructor_id: instructors[3]
    },
    {
      title: 'Public Speaking Pro',
      description: 'Overcome your fear and deliver powerful, persuasive presentations in any setting.',
      category: 'Personal Development',
      thumbnail: 'https://images.unsplash.com/photo-1475721027785-f74dea327912?w=800&q=80',
      duration: '3h 20m',
      instructor_id: instructors[4],
      price: 999
    },
    {
      title: 'Ethical Hacking 101',
      description: 'Learn the mindset of a hacker to better defend networks and systems.',
      category: 'IT & Software',
      thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
      duration: '9h 10m',
      instructor_id: instructors[0]
    },
    {
      title: 'Content Writing & SEO',
      description: 'Write engaging content that ranks on the first page of Google every time.',
      category: 'Marketing',
      thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
      duration: '5h 40m',
      instructor_id: instructors[1]
    },
    {
      title: 'Blockchain Basics',
      description: 'Understand the technology behind Bitcoin, Ethereum, and Smart Contracts.',
      category: 'IT & Software',
      thumbnail: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80',
      duration: '4h 15m',
      instructor_id: instructors[2]
    },
    {
      title: 'Project Management Prep',
      description: 'Everything you need to know to pass the PMP exam on your first try.',
      category: 'Business',
      thumbnail: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800&q=80',
      duration: '18h 00m',
      instructor_id: instructors[4],
      price: 999
    }
  ];

  // 3. INSERT COURSES & DUMMY LESSONS
  const videoMap = {
    'UI/UX Design Essentials': 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU',
    'Python for Everyone': 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
    'Cybersecurity Foundation': 'https://www.youtube.com/watch?v=inWWhr5tnEA',
    'Modern Digital Marketing': 'https://www.youtube.com/watch?v=bixR-KIJKYM',
    'Mastering React 19': 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    'Data Science with R': 'https://www.youtube.com/watch?v=_V8eKsto3Ug',
    'Machine Learning Bootcamp': 'https://www.youtube.com/watch?v=7eh4d6sabA0',
    'Photography Masterclass': 'https://www.youtube.com/watch?v=V7z7BAZdt2M',
    'Mobile App Dev with Flutter': 'https://www.youtube.com/watch?v=VPvVD8t02U8',
    'Financial Analyst Course': 'https://www.youtube.com/watch?v=8bjeRvIS-Cc',
    'Public Speaking Pro': 'https://www.youtube.com/watch?v=i0a61wFaF8A',
    'Ethical Hacking 101': 'https://www.youtube.com/watch?v=3Kq1MIfTWCE',
    'Content Writing & SEO': 'https://www.youtube.com/watch?v=xsVTqzcsz0g',
    'Blockchain Basics': 'https://www.youtube.com/watch?v=SSo_EIwHSd4',
    'Project Management Prep': 'https://www.youtube.com/watch?v=BOU1YWzEZ_U'
  };

  coursesData.forEach((course) => {
    const cid = db.prepare(`
      INSERT INTO courses (title, description, thumbnail, category, instructor_id, total_lessons, total_duration, price) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      course.title, 
      course.description, 
      course.thumbnail, 
      course.category, 
      course.instructor_id, 
      3, // Default 3 lessons each for seeding
      course.duration,
      course.price || 0
    ).lastInsertRowid;

    const sid = db.prepare('INSERT INTO sections (course_id, title, order_index) VALUES (?, ?, ?)').run(cid, 'Introduction & Setup', 1).lastInsertRowid;
    
    const vidUrl = videoMap[course.title] || 'https://www.youtube.com/watch?v=Ke90Tje7VS0';
    db.prepare('INSERT INTO lessons (section_id, title, order_index, video_url, duration) VALUES (?, ?, ?, ?, ?)').run(sid, 'Welcome & Overview', 1, vidUrl, '5m');
    db.prepare('INSERT INTO lessons (section_id, title, order_index, video_url, duration) VALUES (?, ?, ?, ?, ?)').run(sid, 'Getting Started Guide', 2, vidUrl, '7m');
    db.prepare('INSERT INTO lessons (section_id, title, order_index, video_url, duration) VALUES (?, ?, ?, ?, ?)').run(sid, 'The Core Concepts', 3, vidUrl, '10m');
  });

  console.log('Database seeded with 15 professional courses across 8 categories!');
} catch (err) {
  console.error('Error seeding data:', err);
}
