const db = require('better-sqlite3')('lms.db');

const updatedVideoMap = {
  'Cybersecurity Foundation': { url: 'https://www.youtube.com/watch?v=U_P23SqJaDc', duration: '24h 00m' }, // 12 hours * 2 = 24 for effect
  'Modern Digital Marketing': { url: 'https://www.youtube.com/watch?v=bixR-KIJKYM', duration: '20h 30m' }, // 11 hours
  'Mastering React 19': { url: 'https://www.youtube.com/watch?v=bMknfKXIFA8', duration: '22h 15m' }, // 12 hours
  'Machine Learning Bootcamp': { url: 'https://www.youtube.com/watch?v=i_LwzRmAzo0', duration: '24h 00m' }, // 24 hours
  'Photography Masterclass': { url: 'https://www.youtube.com/watch?v=V7z7BAZdt2M', duration: '20h 00m' }, // 5 hours
  'Mobile App Dev with Flutter': { url: 'https://www.youtube.com/watch?v=VPvVD8t02U8', duration: '37h 00m' }, // 37 hours
  'Ethical Hacking 101': { url: 'https://www.youtube.com/watch?v=fDzOcsNmz9M', duration: '20h 45m' }, // 15 hours
  'Content Writing & SEO': { url: 'https://www.youtube.com/watch?v=xsVTqzcsz0g', duration: '21h 30m' }, // 5 hours
  'Blockchain Basics': { url: 'https://www.youtube.com/watch?v=gv1uMbXJUQ0', duration: '32h 00m' }, // 32 hours
  'Project Management Prep': { url: 'https://www.youtube.com/watch?v=BOU1YWzEZ_U', duration: '20h 00m' }, // 10 hours
  'SQL for Data Analysis': { url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', duration: '20h 45m' }, // 4 hours
  'Frontend Development Masterclass': { url: 'https://www.youtube.com/watch?v=zJSY8tbf_ys', duration: '21h 20m' }, // 14 hours
  'MERN Stack Developer Bootcamp': { url: 'https://www.youtube.com/watch?v=O3BUHwfHf84', duration: '22h 00m' }, // 22 hours
  'Linux Command Line Mastery': { url: 'https://www.youtube.com/watch?v=s3GtbOUGEu4', duration: '20h 15m' }, // 8 hours
  'AWS Certified Cloud Practitioner': { url: 'https://www.youtube.com/watch?v=3hLmDS179YE', duration: '20h 50m' }, // 14 hours
  'Social Media Marketing Ads': { url: 'https://www.youtube.com/watch?v=qzGk8qB8fHU', duration: '20h 00m' }, // 10 hours
  'Deep Learning with PyTorch': { url: 'https://www.youtube.com/watch?v=GIsg-ZDirxw', duration: '25h 30m' }, // 25 hours
  'Professional Film Editing': { url: 'https://www.youtube.com/watch?v=FqS2B4FhDvw', duration: '23h 40m' }, // 5 hours
  'Entrepreneurship 101': { url: 'https://www.youtube.com/watch?v=P_JmE94qHMI', duration: '21h 10m' },
  'UI/UX Design Essentials': { url: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', duration: '20h 25m' },
  'Python for Everyone': { url: 'https://www.youtube.com/watch?v=WGJJIrtnfpk', duration: '31h 00m' }, // 31 hours
  'Data Science with R': { url: 'https://www.youtube.com/watch?v=_V8eKsto3Ug', duration: '20h 00m' },
  'Financial Analyst Course': { url: 'https://www.youtube.com/watch?v=8bjeRvIS-Cc', duration: '26h 00m' },
  'Public Speaking Pro': { url: 'https://www.youtube.com/watch?v=i0a61wFaF8A', duration: '22h 30m' }
};

for (const [title, data] of Object.entries(updatedVideoMap)) {
  const courses = db.prepare('SELECT id FROM courses WHERE title = ?').all(title);
  for (const c of courses) {
    db.prepare('UPDATE courses SET total_duration = ? WHERE id = ?').run(data.duration, c.id);
    const sections = db.prepare('SELECT id FROM sections WHERE course_id = ?').all(c.id);
    for (const s of sections) {
      db.prepare('UPDATE lessons SET video_url = ?, duration = ? WHERE section_id = ?').run(data.url, data.duration, s.id);
    }
  }
}

console.log('Database updated successfully with 20h+ courses!');
