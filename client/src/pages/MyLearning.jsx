import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Play, CheckCircle, BookOpen, Clock } from 'lucide-react';

const MyLearning = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const res = await axios.get('/api/dashboard/enrolled');
        setCourses(res.data);
      } catch (err) {
        console.error('Error fetching enrolled courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrolledCourses();
  }, []);

  const ongoingCourses = courses.filter(c => c.progress_percentage < 100);
  const completedCourses = courses.filter(c => c.progress_percentage === 100);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
        <div className="reveal">Loading your learnings...</div>
      </div>
    );
  }

  const CourseRow = ({ course }) => (
    <div className="glass reveal" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
      <img 
        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'} 
        alt={course.title} 
        style={{ width: '200px', height: '120px', objectFit: 'cover', borderRadius: '12px' }}
      />
      
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{course.title}</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Instructor: {course.instructor_name}</p>
          </div>
          {course.progress_percentage === 100 && (
            <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <CheckCircle size={18} /> Completed
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-dim)' }}>Progress: {course.progress_percentage}%</span>
            <span style={{ color: 'var(--text-dim)' }}>{course.completed_lessons} / {course.total_lessons} Lessons</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${course.progress_percentage}%`, 
              background: 'linear-gradient(to right, #6366f1, #ec4899)',
              transition: 'width 1s ease-in-out'
            }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            <strong>Last watched:</strong> {course.last_lesson_title}
          </div>
          <Link to={`/learn/${course.id}`} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '8px' }}>
            <Play size={16} fill="currentColor" /> {course.progress_percentage === 100 ? 'Revisit Course' : 'Continue Learning'}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <header style={{ marginBottom: '3rem' }} className="reveal">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Learnings</h1>
        <p style={{ color: 'var(--text-dim)' }}>Track your progress and continue where you left off</p>
      </header>

      {courses.length === 0 ? (
        <div className="glass reveal" style={{ padding: '4rem', textAlign: 'center' }}>
          <BookOpen size={48} style={{ color: 'var(--text-dim)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No courses found</h3>
          <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>You haven't enrolled in any courses yet.</p>
          <Link to="/" className="btn-primary">Browse Courses</Link>
        </div>
      ) : (
        <>
          {ongoingCourses.length > 0 && (
            <div style={{ marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={20} color="var(--primary)" /> Ongoing Courses
              </h2>
              {ongoingCourses.map(course => <CourseRow key={course.id} course={course} />)}
            </div>
          )}

          {completedCourses.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="#10b981" /> Completed Courses
              </h2>
              {completedCourses.map(course => <CourseRow key={course.id} course={course} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyLearning;
