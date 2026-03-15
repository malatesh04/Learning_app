import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Play, CheckCircle, Clock, BookOpen, ExternalLink, Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const Dashboard = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/dashboard/enrolled');
        setEnrolledCourses(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const completed = enrolledCourses.filter(c => c.progress_percentage === 100);
  const inProgress = enrolledCourses.filter(c => c.progress_percentage < 100);

  const [selectedCert, setSelectedCert] = useState(null);
  const certificateRef = useRef();

  const downloadPDF = async () => {
    const element = certificateRef.current;
    if (!element) return;
    
    // Temporarily hide buttons for the capture
    const buttons = element.querySelectorAll('button');
    buttons.forEach(b => b.style.display = 'none');

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });
    
    buttons.forEach(b => b.style.display = '');

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${selectedCert.title}_Certificate.pdf`);
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Loading dashboard...</div>;

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      {/* ... existing header and stats ... */}
      <div className="fade-in" style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Student Dashboard</h1>
        <p style={{ color: 'var(--text-dim)' }}>Welcome back! Track your progress and continue learning.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
        <div className="glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{enrolledCourses.length}</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Enrolled Courses</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{inProgress.length}</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>In Progress</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{completed.length}</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Completed</div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1.5rem' }}>Continue Learning</h2>
      {inProgress.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
          No courses in progress. <Link to="/" style={{ color: 'var(--primary)' }}>Browse catalog</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
          {inProgress.map(course => (
            <div key={course.id} className="glass" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: '15px', padding: '1rem' }}>
                <img src={course.thumbnail} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '5px' }}>{course.title}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '10px' }}>{course.instructor_name}</div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${course.progress_percentage}%`, height: '100%', background: 'var(--primary)' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', marginTop: '5px', textAlign: 'right' }}>{course.progress_percentage}% Complete</div>
                </div>
              </div>
              <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <Link to={`/learn/${course.id}`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                  Resume
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}



      {selectedCert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, padding: '40px 20px', overflowY: 'auto', backdropFilter: 'blur(10px)' }}>
          <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Top Bar with Status and Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '15px 25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(20px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Removed Certificate Preview title */}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={downloadPDF}
                  style={{ background: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}
                >
                  <Download size={20} /> Download PDF
                </button>
                <button 
                  onClick={() => setSelectedCert(null)} 
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '12px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', fontWeight: '600' }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Certificate Canvas / Container with scaling for preview */}
            <div style={{ 
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)', 
              borderRadius: '12px', 
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#000',
              padding: '20px',
              minHeight: '400px'
            }}>
              <div style={{ 
                transform: 'scale(0.65)', 
                transformOrigin: 'center center',
                width: '1120px',
                height: '792px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {/* This inner div is what gets captured by html2canvas */}
                <div 
                  ref={certificateRef} 
                  className="certificate-export-container"
                  style={{ 
                    width: '1000px', 
                    height: '700px', 
                    background: 'white', 
                    color: '#1e293b', 
                    textAlign: 'center', 
                    position: 'relative', 
                    border: '20px solid #5046e5',
                    padding: '3rem 4rem', 
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    fontFamily: '"Inter", sans-serif',
                    margin: '0 auto'
                  }}
                >
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {/* TOP: LearnBox Title */}
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#5046e5', letterSpacing: '-1.5px' }}>LearnBox</div>
                    
                    {/* CENTER: Certificate of Completion */}
                    <div>
                      <h1 style={{ fontSize: '3.2rem', fontFamily: 'serif', marginBottom: '1.5rem', color: '#1e293b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '2px solid #f1f5f9', display: 'inline-block', paddingBottom: '5px' }}>Certificate of Completion</h1>
                      
                      {/* BODY: Statement and Name */}
                      <div style={{ marginTop: '1.5rem' }}>
                        <p style={{ fontSize: '1.4rem', color: '#64748b', marginBottom: '1rem', fontWeight: '500' }}>This certificate is proudly presented to</p>
                        <h2 style={{ fontSize: '4.2rem', color: '#1e293b', fontWeight: '900', margin: '1rem 0' }}>{user.name}</h2>
                        
                        <p style={{ fontSize: '1.4rem', color: '#64748b', marginBottom: '1rem' }}>
                          for successfully completing the course
                        </p>
                        <h3 style={{ fontSize: '3rem', color: '#5046e5', fontWeight: '800', margin: '1rem auto' }}>{selectedCert.title}</h3>
                        <p style={{ fontSize: '1.3rem', color: '#64748b', fontWeight: '500' }}>on LearnBox.</p>
                        
                        <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginTop: '2.5rem', maxWidth: '80%', margin: '2.5rem auto 0', fontStyle: 'italic' }}>
                          "This achievement demonstrates dedication and commitment to learning."
                        </p>
                      </div>
                    </div>

                    {/* BOTTOM: Date and ID */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '1rem 0', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>Date: {new Date().toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '600' }}>Certificate ID / Verification URL:</div>
                        <div style={{ fontSize: '0.85rem', color: '#5046e5', fontWeight: '700' }}>https://learnbox.com/certificate/LBX-{Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
