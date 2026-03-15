import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, User } from 'lucide-react';

const CourseCard = ({ course }) => {
  return (
    <Link to={`/course/${course.id}`} className="glass course-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <img 
        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'} 
        alt={course.title} 
        style={{ width: '100%', height: '180px', objectFit: 'cover' }}
      />
      <div style={{ padding: '1.5rem' }}>
        <span className="badge" style={{ marginBottom: '10px', display: 'inline-block' }}>{course.category}</span>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', height: '2.8rem', overflow: 'hidden' }}>{course.title}</h3>
        
        <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
           {course.instructor_name}
        </div>

        <div style={{ marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.2rem', color: course.price > 0 ? 'var(--primary)' : '#10b981' }}>
          {course.price > 0 ? `₹${course.price}` : 'Free'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
            {course.total_lessons} Lessons
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
            {course.total_duration}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
