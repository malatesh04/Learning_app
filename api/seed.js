const db = require('./db.js');
const bcrypt = require('bcryptjs');

const seedData = async () => {
    try {
        // Wait briefly for tables to be initialized by db.js
        await new Promise(res => setTimeout(res, 2000));

        console.log('Inserting default users...');
        const adminHash = bcrypt.hashSync('admin123', 8);
        const instHash = bcrypt.hashSync('instructor123', 8);
        const stuHash = bcrypt.hashSync('student123', 8);

        // Instead of throwing an error if users exist, let's catch it manually or ignore it.
        let adminId;
        try {
            const admin = await db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin Malatesh', 'admin@learnbox.com', adminHash, 'admin');
            adminId = admin.lastInsertRowid;
        } catch (e) {
            console.log('Admin probably exists');
            const user = await db.prepare('SELECT id FROM users WHERE email = ?').get('admin@learnbox.com');
            adminId = user ? user.id : 1;
        }

        // Add the user's admin account
        try {
            const userHash = bcrypt.hashSync('Malatesh@12', 8);
            const userResult = await db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Malatesh BN', 'malateshbn178@gmail.com', userHash, 'admin');
            console.log('User admin account created');
        } catch (e) {
            console.log('User admin account probably exists, updating...');
            const userHash = bcrypt.hashSync('Malatesh@12', 8);
            await db.prepare('UPDATE users SET password = ?, role = ? WHERE email = ?').run(userHash, 'admin', 'malateshbn178@gmail.com');
            console.log('User admin account updated');
        }

        let instructorId;
        try {
            const inst = await db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Expert Instructor', 'instructor@learnbox.com', instHash, 'instructor');
            instructorId = inst.lastInsertRowid;
        } catch (e) {
            console.log('Instructor probably exists');
            const user = await db.prepare('SELECT id FROM users WHERE email = ?').get('instructor@learnbox.com');
            instructorId = user ? user.id : 2;
        }

        // Insert Courses
        console.log('Inserting mock courses...');
        const courses = [
            {
                title: 'Full Stack Web Development', category: 'IT', duration: '40 Hours', price: 0,
                thumb: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Master front-end and back-end web development with React and Node.js.'
            },
            {
                title: 'Python Tutorial for Beginners', category: 'Programming', duration: '15 Hours', price: 0,
                thumb: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Learn Python programming from scratch. No prior coding experience needed.'
            },
            {
                title: 'UI/UX Masterclass', category: 'Design', duration: '20 Hours', price: 499,
                thumb: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'Design beautiful, modern, and accessible user interfaces.'
            },
            {
                title: 'Data Science with Machine Learning', category: 'Data Science', duration: '50 Hours', price: 999,
                thumb: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', description: 'From Pandas and NumPy to Deep Learning. Become a Data Scientist.'
            }
        ];

        for (const c of courses) {
            console.log(`Creating course: ${c.title}...`);
            let info;
            try {
                info = await db.prepare(`
                    INSERT INTO courses (title, description, thumbnail, category, instructor_id, instructor_name, total_duration, price, total_lessons)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 3)
                `).run(c.title, c.description, c.thumb, c.category, instructorId, 'Expert Instructor', c.duration, c.price);
            } catch (courseErr) {
                console.log(`Failed inserting course ${c.title}`, courseErr.message);
                continue;
            }

            const courseId = info.lastInsertRowid;
            const secInfo = await db.prepare('INSERT INTO sections (course_id, title, order_index) VALUES (?, ?, ?)').run(courseId, 'Introduction Module', 1);

            await db.prepare('INSERT INTO lessons (section_id, title, video_url, duration, order_index) VALUES (?, ?, ?, ?, ?)').run(secInfo.lastInsertRowid, `Welcome to ${c.title}`, 'https://www.youtube.com/embed/dQw4w9WgXcQ', '10:00', 1);
            await db.prepare('INSERT INTO lessons (section_id, title, video_url, duration, order_index) VALUES (?, ?, ?, ?, ?)').run(secInfo.lastInsertRowid, `${c.category} Fundamentals`, 'https://www.youtube.com/embed/tgbNymZ7vqY', '15:30', 2);
            await db.prepare('INSERT INTO lessons (section_id, title, video_url, duration, order_index) VALUES (?, ?, ?, ?, ?)').run(secInfo.lastInsertRowid, `Advanced Concepts`, 'https://www.youtube.com/embed/kJQP7kiw5Fk', '20:00', 3);
        }

        console.log('Database seeded successfully!');
    } catch (err) {
        console.error('Seed Error:', err);
    }
};

module.exports = { seedData };
