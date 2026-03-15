import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, User, LayoutDashboard, Settings, BookOpen } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass" style={{ 
      margin: '1rem', 
      padding: '0.8rem 2rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      position: 'sticky', 
      top: '1rem', 
      zIndex: 100,
      border: '1px solid rgba(99, 102, 241, 0.3)',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 10px rgba(99, 102, 241, 0.1)'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', fontWeight: 'bold' }}>
        <span style={{ background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          LearnBox
        </span>
      </Link>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/" className="text-dim hover:text-white transition">Explore</Link>
        {user && user.role !== 'admin' && (
          <Link to="/my-learning" className="text-dim hover:text-white transition">My learnings</Link>
        )}
        {user ? (
          <>
            {user.role !== 'admin' && (
              <Link to="/dashboard" className="text-dim hover:text-white transition">Dashboard</Link>
            )}
            {user.role === 'admin' && (
              <Link to="/admin" className="text-dim hover:text-white transition">Admin</Link>
            )}
            <Link to="/profile" className="text-dim hover:text-white transition">Profile</Link>
            <span onClick={handleLogout} className="text-dim hover:text-white transition" style={{ cursor: 'pointer' }}>Logout</span>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" className="btn-secondary" style={{ padding: '8px 16px' }}>Login</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
