import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, Shield } from 'lucide-react';

const Login = () => {
  const [activeTab, setActiveTab] = useState('learner'); // 'learner' or 'admin'
  
  const [learnerEmail, setLearnerEmail] = useState('');
  const [learnerPassword, setLearnerPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [learnerError, setLearnerError] = useState('');
  const [adminError, setAdminError] = useState('');
  
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleLearnerSubmit = async (e) => {
    e.preventDefault();
    setLearnerError('');
    try {
      const res = await login(learnerEmail, learnerPassword);
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setLearnerError('Invalid learner email or password');
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError('');
    try {
      const res = await login(adminEmail, adminPassword);
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setAdminError('Invalid admin email or password');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem' }}>
      
      {successMessage && (
        <div className="fade-in" style={{ 
          position: 'absolute', 
          top: '30px', 
          background: '#10b981', 
          color: 'white', 
          padding: '12px 24px', 
          borderRadius: '8px', 
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          zIndex: 1000,
          animation: 'slideDown 0.3s ease-out forwards'
        }}>
          {successMessage}
        </div>
      )}

      <div className="glass fade-in" style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        
        {/* Top Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={() => setActiveTab('learner')}
            style={{ 
              flex: 1, 
              padding: '1rem', 
              background: activeTab === 'learner' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              borderBottom: activeTab === 'learner' ? '3px solid #6366f1' : '3px solid transparent',
              color: activeTab === 'learner' ? '#6366f1' : 'var(--text-dim)',
              fontSize: '1rem',
              fontWeight: 'bold',
              borderRadius: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <GraduationCap size={20} /> Learner
          </button>
          
          <button 
            onClick={() => setActiveTab('admin')}
            style={{ 
              flex: 1, 
              padding: '1rem', 
              background: activeTab === 'admin' ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
              borderBottom: activeTab === 'admin' ? '3px solid #ec4899' : '3px solid transparent',
              color: activeTab === 'admin' ? '#ec4899' : 'var(--text-dim)',
              fontSize: '1rem',
              fontWeight: 'bold',
              borderRadius: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            <Shield size={20} /> Admin
          </button>
        </div>

        {/* Content Area */}
        <div style={{ padding: '3rem' }}>
          
          {activeTab === 'learner' && (
            <div className="fade-in">
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Welcome Learner</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '5px' }}>Access your courses and certificates</p>
              </div>

              {learnerError && <div style={{ color: '#f43f5e', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', background: 'rgba(244, 63, 94, 0.1)', padding: '8px', borderRadius: '8px' }}>{learnerError}</div>}

              <form onSubmit={handleLearnerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} autoComplete="off">
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      style={{ paddingLeft: '40px' }}
                      value={learnerEmail}
                      onChange={(e) => setLearnerEmail(e.target.value)}
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input 
                      type="password" 
                      placeholder="Enter your password" 
                      style={{ paddingLeft: '40px' }}
                      value={learnerPassword}
                      onChange={(e) => setLearnerPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '1rem', marginTop: '1rem' }}>Sign In as Learner</button>
              </form>

              <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                New learner? <Link to="/signup" style={{ color: '#6366f1', fontWeight: 'bold' }}>Create Account</Link>
              </p>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="fade-in">
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Admin Portal</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '5px' }}>Manage platform and view analytics</p>
              </div>

              {adminError && <div style={{ color: '#f43f5e', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', background: 'rgba(244, 63, 94, 0.1)', padding: '8px', borderRadius: '8px' }}>{adminError}</div>}

              <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} autoComplete="off">
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Admin Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input 
                      type="email" 
                      placeholder="Enter admin email" 
                      style={{ paddingLeft: '40px' }}
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Admin Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input 
                      type="password" 
                      placeholder="Enter admin password" 
                      style={{ paddingLeft: '40px' }}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '1rem', marginTop: '1rem', background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}>Sign In as Admin</button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
