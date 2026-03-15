import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CourseCard from '../components/CourseCard';

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/courses');
        const sortedCourses = res.data.sort((a, b) => {
          const getPriority = (title) => {
            const t = title.toLowerCase();
            if (t.includes('full stack') || t.includes('frontend')) return 1;
            if (t.includes('python')) return 2;
            if (t.includes('sql')) return 3;
            return 4;
          };
          return getPriority(a.title) - getPriority(b.title);
        });
        setCourses(sortedCourses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header style={{ textAlign: 'center', marginBottom: '4rem' }} className="fade-in">
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: '800' }}>
          Master New Skills with <br/>
          <span style={{ background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Expert-Led Courses
          </span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Trust the process and build your skills step by step with LearnBox.
        </p>
      </header>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem' }}>Popular Courses</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>Loading courses...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
            {courses.map((course, index) => (
              <div key={course.id} className="reveal" style={{ animationDelay: `${index * 0.2}s` }}>
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
