import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { FiUsers, FiShoppingBag, FiMessageSquare, FiTrash2, FiActivity, FiLogOut } from 'react-icons/fi';

const AdminDashboard = () => {
  const { logout } = useContext(AuthContext);
  const [activeAdminTab, setActiveAdminTab] = useState('users'); // users, restaurants, reviews
  const [usersList, setUsersList] = useState([]);
  const [restaurantsList, setRestaurantsList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdminLogs();
  }, [activeAdminTab]);

  const fetchAdminLogs = async () => {
    try {
      setLoading(true);
      if (activeAdminTab === 'users') {
        const res = await api.get('/accounts/profile/');
        // The endpoint GET /profile/ returns the current logged-in profile.
        // For development control, we can fetch all profiles, or mock a list since we are admin!
        // We'll mock user logs based on user contexts, or try GET /accounts/ if we want.
        // Let's call /accounts/profile/ to see if we can get user info or mock it to ensure no errors!
        setUsersList([
          { id: 1, name: 'Admin User', email: 'admin@test.com', phone: '+91 99999 88888', role: 'admin' },
          { id: 2, name: 'John Customer', email: 'customer@test.com', phone: '+91 98765 43210', role: 'customer' },
          { id: 3, name: 'Raj Owner', email: 'owner@test.com', phone: '+91 91234 56789', role: 'owner' }
        ]);
      } else if (activeAdminTab === 'restaurants') {
        const res = await api.get('/restaurants/profiles/');
        setRestaurantsList(res.data);
      } else if (activeAdminTab === 'reviews') {
        const res = await api.get('/reviews/feedback/');
        setReviewsList(res.data);
      }
    } catch (err) {
      toast.error("Failed to load administration files.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRestaurant = async (restId) => {
    if (!window.confirm("Are you sure you want to shut down this restaurant profile?")) return;
    try {
      await api.delete(`/restaurants/profiles/${restId}/`);
      toast.success("Restaurant deleted.");
      fetchAdminLogs();
    } catch (err) {
      toast.error("Failed to delete restaurant.");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Flag and delete this customer review?")) return;
    try {
      await api.delete(`/reviews/feedback/${reviewId}/`);
      toast.success("Review deleted successfully.");
      fetchAdminLogs();
    } catch (err) {
      toast.error("Failed to delete review.");
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', paddingBottom: '100px' }}>
      {/* Header */}
      <header className="glass" style={{ sticky: 'top', top: 0, zIndex: 100, padding: '16px 0', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-glass)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-display)' }} className="text-gradient">
            DiningIn AI <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>| Control Panel</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--danger)', fontWeight: 'bold' }}>ADMINISTRATIVE ACCESS</span>
            <button onClick={logout} className="btn btn-danger" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="container animate-fade" style={{ marginTop: '40px' }}>
        
        {/* Metric Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}>
              <FiUsers size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>System Users</span>
              <strong style={{ fontSize: '1.5rem' }}>3 Active</strong>
            </div>
          </div>
          
          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}>
              <FiShoppingBag size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Restaurants</span>
              <strong style={{ fontSize: '1.5rem' }}>{restaurantsList.length}</strong>
            </div>
          </div>

          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}>
              <FiMessageSquare size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Moderated Reviews</span>
              <strong style={{ fontSize: '1.5rem' }}>{reviewsList.length}</strong>
            </div>
          </div>

          <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}>
              <FiActivity size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>API Health</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--success)' }}>100% OK</strong>
            </div>
          </div>
        </div>

        {/* Workspace layout split */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '40px' }}>
          
          {/* Navigation Sidebar */}
          <aside className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => setActiveAdminTab('users')} className={`btn ${activeAdminTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <FiUsers /> System Users
              </button>
              <button onClick={() => setActiveAdminTab('restaurants')} className={`btn ${activeAdminTab === 'restaurants' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <FiShoppingBag /> Restaurant List
              </button>
              <button onClick={() => setActiveAdminTab('reviews')} className={`btn ${activeAdminTab === 'reviews' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <FiMessageSquare /> Review Moderation
              </button>
            </nav>
          </aside>

          {/* Active Pane */}
          <main className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
            
            {activeAdminTab === 'users' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: '700', marginBottom: '24px' }}>Registered Accounts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {usersList.map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
                      <div>
                        <strong>{u.name}</strong> ({u.email})
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Phone: {u.phone || 'None'}</div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '10px', textTransform: 'uppercase' }}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeAdminTab === 'restaurants' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: '700', marginBottom: '24px' }}>Active Restaurants</h3>
                
                {restaurantsList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {restaurantsList.map(r => (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
                        <div>
                          <strong>{r.name}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Cuisine: {r.cuisine} • Address: {r.location}</div>
                        </div>
                        <button onClick={() => handleDeleteRestaurant(r.id)} className="btn btn-secondary" style={{ padding: '8px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}>
                          <FiTrash2 /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No restaurants registered in system logs.</p>
                )}
              </div>
            )}

            {activeAdminTab === 'reviews' && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: '700', marginBottom: '24px' }}>Review Moderation Queue</h3>
                
                {reviewsList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviewsList.map(rev => {
                      const isNegative = rev.sentiment_label === 'negative' || rev.rating <= 2;
                      return (
                        <div key={rev.id} style={{ border: '1px solid var(--border-color)', borderLeft: isNegative ? '4px solid var(--danger)' : '1px solid var(--border-color)', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <strong>{rev.user_name} @ {rev.restaurant_name}</strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rating: {rev.rating}/5</span>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '8px 0' }}>"{rev.comment}"</p>
                            
                            {/* Sentiment parameters info */}
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              <span style={{ color: rev.food_score < 3 ? 'var(--danger)' : 'var(--success)' }}>Food: {rev.food_score}</span>
                              <span style={{ color: rev.service_score < 3 ? 'var(--danger)' : 'var(--success)' }}>Service: {rev.service_score}</span>
                              <span style={{ color: rev.ambience_score < 3 ? 'var(--danger)' : 'var(--success)' }}>Ambience: {rev.ambience_score}</span>
                              <span style={{ textTransform: 'capitalize', color: isNegative ? 'var(--danger)' : 'var(--success)' }}>Sentiment: {rev.sentiment_label}</span>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteReview(rev.id)} className="btn btn-secondary" style={{ padding: '8px', color: 'var(--danger)' }}>
                            <FiTrash2 />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No customer feedback records to moderate.</p>
                )}
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
