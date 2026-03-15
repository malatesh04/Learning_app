import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Book, Users, Trash2, Edit, Save, PlusCircle, GraduationCap, Search, Eye, Ban, CheckCircle, X, UserX, BarChart3, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalEnrollments: 0, activeCourses: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseData, setCourseData] = useState({ title: '', description: '', category: '', thumbnail: '', total_duration: '', price: 0, video_url: '', instructor_name: '' });

  // Student management state
  const [activeTab, setActiveTab] = useState('courses');
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showCompletedCourses, setShowCompletedCourses] = useState(false);
  const [studentDeleteConfirm, setStudentDeleteConfirm] = useState(null);

  // Analytics state
  const [userAnalytics, setUserAnalytics] = useState([]);
  const [courseAnalytics, setCourseAnalytics] = useState([]);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30');

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/courses');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Student management functions
  const fetchStudents = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/students', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to fetch students', err);
    }
  };

  const searchStudents = async (query) => {
    setSearchQuery(query);
    try {
      if (query.trim() === '') {
        fetchStudents();
      } else {
        const res = await axios.get(`http://localhost:5000/api/admin/students/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setStudents(res.data);
      }
    } catch (err) {
      console.error('Failed to search students', err);
    }
  };

  const toggleBlockStudent = async (studentId) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/students/${studentId}/block`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchStudents();
    } catch (err) {
      alert('Failed to update student status');
    }
  };

  const removeStudent = async (studentId) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/students/${studentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStudentDeleteConfirm(null);
      fetchStudents();
    } catch (err) {
      alert('Failed to remove student');
    }
  };

  const viewStudentProgress = async (student) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/students/${student.id}/progress`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStudentProgress(res.data);
      setSelectedStudent(student);
      setShowCompletedCourses(false);
      setShowStudentModal(true);
    } catch (err) {
      alert('Failed to fetch student progress');
    }
  };

  const viewCompletedCourses = async (student) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/students/${student.id}/courses`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStudentProgress(res.data);
      setSelectedStudent(student);
      setShowCompletedCourses(true);
      setShowStudentModal(true);
    } catch (err) {
      alert('Failed to fetch completed courses');
    }
  };

  // Analytics functions
  const fetchAnalytics = async () => {
    try {
      const [usersRes, coursesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/admin/analytics/users?period=${analyticsPeriod}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:5000/api/admin/analytics/courses', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      setUserAnalytics(usersRes.data);
      setCourseAnalytics(coursesRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [analyticsPeriod, activeTab]);

  const openAddModal = () => {
    setEditingCourse(null);
    setCourseData({ title: '', description: '', category: '', thumbnail: '', total_duration: '', price: 0, video_url: '', instructor_name: '' });
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setCourseData({
      title: course.title,
      description: course.description,
      category: course.category,
      thumbnail: course.thumbnail,
      total_duration: course.total_duration,
      price: course.price || 0,
      video_url: course.video_url || '',
      instructor_name: course.instructor_name || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await axios.put(`http://localhost:5000/api/courses/${editingCourse.id}`, courseData);
      } else {
        await axios.post('http://localhost:5000/api/courses', courseData);
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      alert(editingCourse ? 'Failed to update course' : 'Failed to add course');
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
    if (deleteConfirmId) {
      try {
        await axios.delete(`http://localhost:5000/api/courses/${deleteConfirmId}`);
        fetchCourses();
        fetchStats();
      } catch (err) {
        alert('Failed to delete course');
      } finally {
        setDeleteConfirmId(null);
      }
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'instructor') {
    return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>Access Denied</div>;
  }

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem' }}>Management Dashboard</h1>
          <p style={{ color: 'var(--text-dim)' }}>Manage your courses, students, and content.</p>
        </div>
        {activeTab === 'courses' && (
          <button onClick={openAddModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
            <Plus size={20} /> Create New Course
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('courses')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'courses' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'courses' ? 'white' : 'var(--text-dim)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500'
          }}
        >
          <Book size={18} /> Courses
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('students')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'students' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'students' ? 'white' : 'var(--text-dim)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}
          >
            <Users size={18} /> Students
          </button>
        )}
        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'analytics' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'analytics' ? 'white' : 'var(--text-dim)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '500'
            }}
          >
            <BarChart3 size={18} /> Analytics
          </button>
        )}
      </div>

      {/* Courses Tab Content */}
      {activeTab === 'courses' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
            <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '1.5rem', borderRadius: '16px', color: 'var(--primary)' }}>
                <Book size={32} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.activeCourses || courses.length}</div>
                <div style={{ color: 'var(--text-dim)' }}>Active Courses</div>
              </div>
            </div>

            <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '1.5rem', borderRadius: '16px', color: 'var(--secondary)' }}>
                <Users size={32} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalStudents}</div>
                <div style={{ color: 'var(--text-dim)' }}>Total Students</div>
              </div>
            </div>

            <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '16px', color: '#10b981' }}>
                <GraduationCap size={32} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalEnrollments}</div>
                <div style={{ color: 'var(--text-dim)' }}>Total Enrollments</div>
              </div>
            </div>
          </div>

          <h2 style={{ marginBottom: '1.5rem' }}>Your Courses</h2>
          <div className="glass" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                <tr>
                  <th style={{ padding: '1rem' }}>Course Title</th>
                  <th style={{ padding: '1rem' }}>Category</th>
                  <th style={{ padding: '1rem' }}>Price</th>
                  <th style={{ padding: '1rem' }}>Lessons</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={course.thumbnail} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} alt="" />
                        {course.title}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{course.category}</td>
                    <td style={{ padding: '1rem' }}>{course.price > 0 ? `₹${course.price}` : 'Free'}</td>
                    <td style={{ padding: '1rem' }}>{course.total_lessons}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={() => openEditModal(course)} title="Edit Course" style={{ background: 'transparent', padding: 0, color: '#6366f1' }}>
                          <Edit size={20} />
                        </button>
                        <button onClick={() => handleDelete(course.id)} title="Delete Course" style={{ background: 'transparent', padding: 0, color: '#f43f5e' }}>
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Course Modal */}
          {showModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
              <div className="glass" style={{ width: '100%', maxWidth: '600px', padding: '2rem', background: '#1e293b' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input placeholder="Course Title" value={courseData.title} onChange={e => setCourseData({ ...courseData, title: e.target.value })} required className="glass" />
                  <textarea placeholder="Description" value={courseData.description} onChange={e => setCourseData({ ...courseData, description: e.target.value })} required className="glass" style={{ padding: '10px', height: '100px', color: 'white' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input placeholder="Category" value={courseData.category} onChange={e => setCourseData({ ...courseData, category: e.target.value })} required className="glass" />
                    <input placeholder="Duration (e.g. 5h 30m)" value={courseData.total_duration} onChange={e => setCourseData({ ...courseData, total_duration: e.target.value })} required className="glass" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input placeholder="Thumbnail URL" value={courseData.thumbnail} onChange={e => setCourseData({ ...courseData, thumbnail: e.target.value })} required className="glass" />
                    <input type="number" placeholder="Price (₹)" value={courseData.price} onChange={e => setCourseData({ ...courseData, price: parseInt(e.target.value) || 0 })} required className="glass" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input placeholder="Instructor Name" value={courseData.instructor_name} onChange={e => setCourseData({ ...courseData, instructor_name: e.target.value })} className="glass" />
                    <input placeholder="YouTube Video URL" value={courseData.video_url} onChange={e => setCourseData({ ...courseData, video_url: e.target.value })} required className="glass" />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px', border: '1px solid var(--border)' }}>Cancel</button>
                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {editingCourse ? <><Save size={18} /> Update Course</> : <><PlusCircle size={18} /> Create Course</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {deleteConfirmId && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
              <div className="glass fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: '#1e293b', textAlign: 'center' }}>
                <Trash2 size={48} color="#f43f5e" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Confirm Deletion</h2>
                <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Are you sure you want to delete this course? This action cannot be undone and will permanently remove all associated sections and lessons.</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setDeleteConfirmId(null)} className="btn-secondary" style={{ flex: 1, padding: '12px', border: '1px solid var(--border)' }}>Cancel</button>
                  <button onClick={executeDelete} style={{ flex: 1, padding: '12px', background: '#f43f5e', color: 'white', borderRadius: '8px', fontWeight: 'bold' }}>Yes, Delete</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Students Tab Content */}
      {activeTab === 'students' && user?.role === 'admin' && (
        <>
          {/* Search Bar */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => searchStudents(e.target.value)}
                className="glass"
                style={{ width: '100%', paddingLeft: '44px' }}
              />
            </div>
          </div>

          {/* Students Table */}
          <div className="glass" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                <tr>
                  <th style={{ padding: '1rem' }}>Name</th>
                  <th style={{ padding: '1rem' }}>Email</th>
                  <th style={{ padding: '1rem' }}>Enrolled Courses</th>
                  <th style={{ padding: '1rem' }}>Completed Lessons</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>No students found</td>
                  </tr>
                ) : (
                  students.map(student => (
                    <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}>{student.name}</td>
                      <td style={{ padding: '1rem' }}>{student.email}</td>
                      <td style={{ padding: '1rem' }}>{student.enrolled_courses}</td>
                      <td style={{ padding: '1rem' }}>{student.completed_lessons}</td>
                      <td style={{ padding: '1rem' }}>
                        {student.blocked ? (
                          <span style={{ color: '#f43f5e', fontWeight: '500' }}>Blocked</span>
                        ) : (
                          <span style={{ color: '#10b981', fontWeight: '500' }}>Active</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => viewStudentProgress(student)} title="View Progress" style={{ background: 'transparent', padding: '4px', color: '#6366f1' }}>
                            <Eye size={18} />
                          </button>
                          <button onClick={() => viewCompletedCourses(student)} title="View Completed Courses" style={{ background: 'transparent', padding: '4px', color: '#10b981' }}>
                            <GraduationCap size={18} />
                          </button>
                          <button onClick={() => toggleBlockStudent(student.id)} title={student.blocked ? 'Unblock Student' : 'Block Student'} style={{ background: 'transparent', padding: '4px', color: student.blocked ? '#10b981' : '#f59e0b' }}>
                            {student.blocked ? <CheckCircle size={18} /> : <Ban size={18} />}
                          </button>
                          <button onClick={() => setStudentDeleteConfirm(student.id)} title="Remove Student" style={{ background: 'transparent', padding: '4px', color: '#f43f5e' }}>
                            <UserX size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Student Delete Confirmation */}
          {studentDeleteConfirm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
              <div className="glass fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: '#1e293b', textAlign: 'center' }}>
                <UserX size={48} color="#f43f5e" style={{ margin: '0 auto 1.5rem' }} />
                <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Remove Student</h2>
                <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Are you sure you want to remove this student? This action cannot be undone and will permanently delete all their enrollments and progress.</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setStudentDeleteConfirm(null)} className="btn-secondary" style={{ flex: 1, padding: '12px', border: '1px solid var(--border)' }}>Cancel</button>
                  <button onClick={() => removeStudent(studentDeleteConfirm)} style={{ flex: 1, padding: '12px', background: '#f43f5e', color: 'white', borderRadius: '8px', fontWeight: 'bold' }}>Yes, Remove</button>
                </div>
              </div>
            </div>
          )}

          {/* Student Progress Modal */}
          {showStudentModal && studentProgress && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
              <div className="glass" style={{ width: '100%', maxWidth: '800px', padding: '2rem', background: '#1e293b', maxHeight: '80vh', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ marginBottom: '0.5rem' }}>{showCompletedCourses ? 'Completed Courses' : 'Student Progress'}</h2>
                    <p style={{ color: 'var(--text-dim)' }}>{selectedStudent?.name} - {selectedStudent?.email}</p>
                  </div>
                  <button onClick={() => setShowStudentModal(false)} style={{ background: 'transparent', padding: '8px', color: 'var(--text-dim)' }}>
                    <X size={24} />
                  </button>
                </div>

                {!showCompletedCourses && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <button
                      onClick={() => setShowCompletedCourses(false)}
                      style={{
                        padding: '8px 16px',
                        background: !showCompletedCourses ? 'var(--primary)' : 'transparent',
                        color: !showCompletedCourses ? 'white' : 'var(--text-dim)',
                        border: 'none',
                        borderRadius: '6px',
                        marginRight: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      All Enrollments
                    </button>
                    <button
                      onClick={() => viewCompletedCourses(selectedStudent)}
                      style={{
                        padding: '8px 16px',
                        background: showCompletedCourses ? 'var(--primary)' : 'transparent',
                        color: showCompletedCourses ? 'white' : 'var(--text-dim)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Completed Courses
                    </button>
                  </div>
                )}

                {studentProgress.enrollments?.length === 0 ? (
                  <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem' }}>No course enrollments found</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {studentProgress.enrollments?.map(enrollment => (
                      <div key={enrollment.id} className="glass" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={enrollment.thumbnail} style={{ width: '60px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} alt="" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500' }}>{enrollment.title}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>{enrollment.category}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '500', color: enrollment.progress_percentage === 100 ? '#10b981' : '#6366f1' }}>
                            {enrollment.progress_percentage}%
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {enrollment.completed_lessons}/{enrollment.total_lessons} lessons
                          </div>
                        </div>
                        <div style={{ width: '100px' }}>
                          <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${enrollment.progress_percentage}%`, height: '100%', background: enrollment.progress_percentage === 100 ? '#10b981' : '#6366f1', borderRadius: '3px' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && user?.role === 'admin' && (
        <>
          <h2 style={{ marginBottom: '1.5rem' }}>Platform Analytics</h2>

          {/* Period Selector */}
          <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
            <select
              value={analyticsPeriod}
              onChange={(e) => setAnalyticsPeriod(e.target.value)}
              className="glass"
              style={{ padding: '8px 16px', color: 'white', borderRadius: '8px' }}
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>

          {/* Line Graph - User Growth */}
          <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="#6366f1" />
              User Growth / Daily Activity
            </h3>
            <div style={{ height: '300px' }}>
              {userAnalytics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="date"
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#6366f1' }}
                      name="New Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
                  No user registration data available for this period
                </div>
              )}
            </div>
          </div>

          {/* Bar Graph - Course Enrollments and Completions */}
          <div className="glass" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} color="#10b981" />
              Course Enrollments and Completions
            </h3>
            <div style={{ height: '400px' }}>
              {courseAnalytics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseAnalytics} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      type="number"
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="title"
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                      width={150}
                      tickFormatter={(value) => value.length > 20 ? value.substring(0, 20) + '...' : value}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    />
                    <Legend
                      wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    />
                    <Bar
                      dataKey="enrolled_count"
                      fill="#6366f1"
                      name="Enrolled Students"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="completed_count"
                      fill="#10b981"
                      name="Completed Students"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
                  No course enrollment data available
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
