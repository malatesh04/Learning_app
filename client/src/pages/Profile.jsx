import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Book, Award, CheckCircle, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const certificateRef = useRef();

  useEffect(() => {
    if (user) {
      setNewName(user.name);
    }
  }, [user]);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/dashboard/enrolled');
        setCourses(res.data);
      } catch (err) {
        console.error('Error fetching profile data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    try {
      const res = await axios.put('/api/auth/update-profile', {
        name: newName
      });
      updateUser(res.data.token, res.data.user);
      setIsEditingName(false);
      setMessage({ type: 'success', text: 'Name updated successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error updating name' });
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      await axios.put('/api/auth/update-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error updating password' });
    }
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Loading profile...</div>;

  const certificates = courses.filter(c => c.progress_percentage === 100);

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div className="fade-in" style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Profile</h1>
        <p style={{ color: 'var(--text-dim)' }}>Manage your account settings and track your achievements.</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: user?.role === 'admin' ? '1fr' : '1fr 1fr', 
        gap: '2rem',
        maxWidth: user?.role === 'admin' ? '800px' : 'none',
        margin: user?.role === 'admin' ? '0 auto' : '0'
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Personal Information */}
          <section className="glass" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={20} color="var(--primary)" /> Personal Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Full Name</label>
                {isEditingName ? (
                  <form onSubmit={handleNameUpdate} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)} 
                      style={{ flex: 1 }}
                      required
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>Save</button>
                    <button type="button" onClick={() => setIsEditingName(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>Cancel</button>
                  </form>
                ) : (
                  <div style={{ fontSize: '1.1rem', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{user?.name}</span>
                    <button onClick={() => setIsEditingName(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}>Edit</button>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Email Address</label>
                <div style={{ fontSize: '1.1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} color="var(--text-dim)" /> {user?.email}
                </div>
              </div>
            </div>
          </section>

          {/* Change Password */}
          <section className="glass" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={20} color="var(--primary)" /> Change Password
            </h2>
            <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <input 
                  type="password" 
                  placeholder="Current Password" 
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  required
                />
              </div>
              <div>
                <input 
                  type="password" 
                  placeholder="New Password" 
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  required
                />
              </div>
              <div>
                <input 
                  type="password" 
                  placeholder="Confirm New Password" 
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  required
                />
              </div>
              {message.text && (
                <div style={{ 
                  padding: '10px', 
                  borderRadius: '8px', 
                  fontSize: '0.9rem',
                  background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: message.type === 'error' ? '#f87171' : '#34d399',
                  border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                }}>
                  {message.text}
                </div>
              )}
              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Update Password</button>
            </form>
          </section>
        </div>

        {/* Right Column */}
        {user?.role !== 'admin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Enrolled Courses (In Progress) */}
          <section className="glass" style={{ padding: '2rem', flex: 1 }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Book size={20} color="var(--primary)" /> Enrolled Courses
            </h2>
            {courses.filter(c => c.progress_percentage < 100).length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>You haven't enrolled in any courses or all are completed.</p>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {courses.filter(c => c.progress_percentage < 100).map(course => (
                  <li key={course.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500' }}>{course.title}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{course.progress_percentage}%</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Completed Courses */}
          <section className="glass" style={{ padding: '2rem', flex: 1 }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={20} color="#10b981" /> Completed Courses
            </h2>
            {certificates.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>You haven't completed any courses yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {certificates.map(course => (
                  <li key={`completed-${course.id}`} style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500' }}>{course.title}</span>
                    <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Completed</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Certificates */}
          <section className="glass" style={{ padding: '2rem', flex: 1 }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={20} color="var(--secondary)" /> My Certificates
            </h2>
            {certificates.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Complete a course to earn your first certificate!</p>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {certificates.map(course => (
                  <li 
                    key={course.id} 
                    onClick={() => setSelectedCert(course)}
                    style={{ padding: '12px', background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.2s ease', '&:hover': { background: 'rgba(236, 72, 153, 0.1)' } }}>
                    <CheckCircle size={18} color="var(--secondary)" />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{course.title} Certificate</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Issued on {new Date(course.enrolled_at).toLocaleDateString()}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        )}
      </div>
      {selectedCert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, padding: '40px 20px', overflowY: 'auto', backdropFilter: 'blur(10px)' }}>
          <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Top Bar with Status and Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '15px 25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(20px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                  className="btn-secondary"
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
                        <p style={{ fontSize: '1.4rem', color: '#64748b', marginBottom: '1rem', fontWeight: '500' }}>This certificate is proudly awarded to</p>
                        <h2 style={{ fontSize: '4.2rem', color: '#1e293b', fontWeight: '900', margin: '1rem 0' }}>{user.name}</h2>
                        
                        <p style={{ fontSize: '1.4rem', color: '#64748b', marginBottom: '1rem' }}>
                          for successfully completing the course
                        </p>
                        <h3 style={{ fontSize: '3rem', color: '#5046e5', fontWeight: '800', margin: '1rem auto' }}>{selectedCert.title}</h3>
                        <p style={{ fontSize: '1.3rem', color: '#64748b', fontWeight: '500' }}>on LearnBox.</p>
                      </div>
                    </div>

                    {/* BOTTOM: Date and ID */}
                    <div style={{ marginTop: '2rem', borderTop: '2px solid #f1f5f9', paddingTop: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '0 2rem' }}>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: '600' }}>Completion Date:</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b', marginLeft: '10px' }}>
                            {new Date(selectedCert.enrolled_at || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: '600' }}>Certificate ID:</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b', marginLeft: '10px' }}>
                            LBX-{selectedCert.id}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <div style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: '8px' }}>Verify this certificate at:</div>
                        <div style={{ fontSize: '1.2rem', color: '#5046e5', fontWeight: '700' }}>
                          https://learnbox.com/verify/LBX-{selectedCert.id}
                        </div>
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

export default Profile;
