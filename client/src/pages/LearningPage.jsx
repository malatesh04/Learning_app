import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, CheckCircle, PlayCircle, Menu, X, Award } from 'lucide-react';

const LearningPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`);
        setCourse(res.data);
        
        const progressRes = await axios.get(`http://localhost:5000/api/courses/${id}/progress`);
        setCompletedLessons(progressRes.data.completedLessons);

        // Find first uncompleted lesson or default to first
        const allLessons = res.data.sections.flatMap(s => s.lessons);
        const lastCompletedIdx = allLessons.findIndex(l => !progressRes.data.completedLessons.includes(l.id));
        setCurrentLesson(lastCompletedIdx !== -1 ? allLessons[lastCompletedIdx] : allLessons[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const markComplete = async (lessonId) => {
    try {
      await axios.post(`http://localhost:5000/api/courses/${id}/lessons/${lessonId}/complete`);
      if (!completedLessons.includes(lessonId)) {
        setCompletedLessons([...completedLessons, lessonId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const allLessons = course ? course.sections.flatMap(s => s.lessons) : [];
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
  const nextLesson = allLessons[currentIndex + 1];
  const prevLesson = allLessons[currentIndex - 1];

  const progressPercentage = course ? Math.round((completedLessons.length / course.total_lessons) * 100) : 0;

  const extractYTId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Loading classroom...</div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div 
        className="glass" 
        style={{ 
          width: sidebarOpen ? '350px' : '0', 
          transition: 'width 0.3s', 
          overflowY: 'auto', 
          borderRadius: 0, 
          borderTop: 0, 
          borderBottom: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem' }}>Course Content</h3>
          <button onClick={() => setSidebarOpen(false)}><X size={20}/></button>
        </div>
        
        <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span>Your Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercentage}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.5s' }} />
          </div>
        </div>

        <div className="lesson-list" style={{ padding: '10px' }}>
          {course.sections.map(section => (
            <div key={section.id}>
              <div style={{ padding: '15px 10px 5px', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 'bold' }}>
                {section.title}
              </div>
              {section.lessons.map(lesson => (
                <div 
                  key={lesson.id} 
                  className={`lesson-item ${currentLesson.id === lesson.id ? 'active' : ''}`}
                  onClick={() => setCurrentLesson(lesson)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {completedLessons.includes(lesson.id) ? (
                        <CheckCircle size={16} color="#10b981" />
                      ) : (
                        <PlayCircle size={16} color="var(--text-dim)" />
                      )}
                      <span style={{ fontSize: '0.9rem' }}>{lesson.title}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{lesson.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {!sidebarOpen && (
          <button 
            style={{ position: 'absolute', left: '20px', top: '20px', zIndex: 10 }} 
            className="glass"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
        )}

        <div style={{ flex: 1, backgroundColor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {currentLesson && (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${extractYTId(currentLesson.video_url)}?autoplay=1`}
              title={currentLesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="glass" style={{ height: '80px', borderRadius: 0, borderRight: 0, borderLeft: 0, padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button 
              disabled={!prevLesson} 
              onClick={() => setCurrentLesson(prevLesson)}
              style={{ opacity: prevLesson ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <ChevronLeft size={20} /> Previous
            </button>
            <button 
              disabled={!nextLesson} 
              onClick={() => {
                markComplete(currentLesson.id);
                setCurrentLesson(nextLesson);
              }}
              style={{ opacity: nextLesson ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: '5px' }}
              className="btn-primary"
            >
              Next Lesson <ChevronRight size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {progressPercentage === 100 && (
              <div style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <Award size={20} /> Course Completed!
              </div>
            )}
            <button 
              onClick={() => markComplete(currentLesson.id)}
              className={completedLessons.includes(currentLesson.id) ? "" : "btn-secondary"}
              style={{ border: completedLessons.includes(currentLesson.id) ? '1px solid #10b981' : '1px solid var(--border)', padding: '10px 20px', color: completedLessons.includes(currentLesson.id) ? '#10b981' : 'white' }}
            >
              {completedLessons.includes(currentLesson.id) ? "Lesson Completed" : "Mark as Finished"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPage;
