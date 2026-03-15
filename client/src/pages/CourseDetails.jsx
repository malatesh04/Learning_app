import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PlayCircle, CheckCircle, Clock, BookOpen, CreditCard, ShieldCheck, X } from 'lucide-react';

const PaymentModal = ({ course, onCancel, onSuccess }) => {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass fade-in" style={{ maxWidth: '450px', width: '100%', padding: '2rem', position: 'relative' }}>
        <button onClick={onCancel} style={{ position: 'absolute', right: '1rem', top: '1rem', color: 'var(--text-dim)' }}><X /></button>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CreditCard color="var(--primary)" /> Secure Payment
        </h2>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
           <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>You are enrolling in:</div>
           <div style={{ fontWeight: 'bold' }}>{course.title}</div>
           <div style={{ color: 'var(--primary)', fontSize: '1.2rem', marginTop: '5px' }}>₹{course.price}</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>Card Number</label>
            <input type="text" placeholder="XXXX XXXX XXXX XXXX" required style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>Expiry Date</label>
              <input type="text" placeholder="MM/YY" required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>CVV</label>
              <input type="password" placeholder="XXX" required style={{ width: '100%' }} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px', marginTop: '1rem' }}>
            {loading ? 'Processing Payment...' : `Pay ₹${course.price}`}
          </button>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <ShieldCheck size={14} /> Your transaction is secured with 256-bit encryption
          </p>
        </form>
      </div>
    </div>
  );
};

const CourseDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/courses/${id}`);
        setCourse(res.data);
        
        if (user) {
          const enrolledRes = await axios.get('/api/dashboard/enrolled');
          setIsEnrolled(enrolledRes.data.some(c => c.id === parseInt(id)));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) return navigate('/login');
    if (course.price > 0 && !isEnrolled) {
      setShowPayment(true);
      return;
    }
    completeEnrollment();
  };

  const completeEnrollment = async () => {
    try {
      await axios.post(`/api/courses/${id}/enroll`);
      setIsEnrolled(true);
      setShowPayment(false);
      setNotification({
        type: 'success',
        message: course.price > 0 ? 'Payment Successful! You are now enrolled.' : 'Enrolled successfully!'
      });
      
      setTimeout(() => {
        setNotification(null);
        navigate(`/learn/${id}`);
      }, 2000);
    } catch (err) {
      alert('Enrollment failed');
    }
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Loading course details...</div>;
  if (!course) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Course not found</div>;

  return (
    <div className="container" style={{ padding: '3rem 0', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem', position: 'relative' }}>
      {notification && (
        <div className="glass reveal" style={{ 
          position: 'fixed', 
          top: '2rem', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 2000, 
          padding: '1rem 2rem', 
          border: '1px solid #10b981',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(16, 185, 129, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <CheckCircle color="#10b981" />
          <span style={{ fontWeight: 'bold' }}>{notification.message}</span>
        </div>
      )}
      <div className="fade-in">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{course.title}</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginBottom: '2rem' }}>{course.description}</p>
        
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge">Instructor: {course.instructor_name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
            <BookOpen size={18} /> {course.total_lessons} lessons
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
            <Clock size={18} /> {course.total_duration} total length
          </div>
        </div>

        <h2 style={{ marginBottom: '1.5rem' }}>Course Content</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {course.sections.map(section => (
            <div key={section.id} className="glass" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Section {section.order_index}: {section.title}</h3>
                <span className="text-dim text-sm">{section.lessons.length} lessons</span>
              </div>
              <div style={{ paddingLeft: '1rem', borderLeft: '1px solid var(--border)' }}>
                {section.lessons.map(lesson => (
                  <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: 'var(--text-dim)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <PlayCircle size={14} /> {lesson.title}
                    </div>
                    <span>{lesson.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'sticky', top: '7rem', height: 'fit-content' }}>
        <div className="glass" style={{ overflow: 'hidden' }}>
          <img src={course.thumbnail} style={{ width: '100%' }} alt="Thumbnail" />
          <div style={{ padding: '2rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {course.price > 0 ? `₹${course.price}` : 'Free'}
            </div>
            {isEnrolled ? (
              <button onClick={() => navigate(`/learn/${id}`)} className="btn-primary" style={{ width: '100%', padding: '15px' }}>
                Continue Learning
              </button>
            ) : (
              <button onClick={handleEnroll} className="btn-primary" style={{ width: '100%', padding: '15px' }}>
                Enroll Now
              </button>
            )}
            <ul style={{ marginTop: '1.5rem', listStyle: 'none', color: 'var(--text-dim)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={16} color="#10b981" /> Full lifetime access</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={16} color="#10b981" /> Certificate of completion</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={16} color="#10b981" /> Access on mobile and TV</li>
            </ul>
          </div>
        </div>
      </div>
      {showPayment && (
        <PaymentModal 
          course={course} 
          onCancel={() => setShowPayment(false)} 
          onSuccess={completeEnrollment} 
        />
      )}
    </div>
  );
};

export default CourseDetails;
