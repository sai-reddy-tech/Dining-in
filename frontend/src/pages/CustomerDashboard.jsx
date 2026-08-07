import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { FiHome, FiUser, FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiMessageSquare, FiSend, FiX, FiInfo } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const CustomerDashboard = () => {
  const { user, logout, updateProfile } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  const [activeTab, setActiveTab] = useState('bookings'); // bookings, profile
  const [bookings, setBookings] = useState([]);
  const [waitlists, setWaitlists] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRestaurantId, setReviewRestaurantId] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // AI Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: `Hello ${user?.name || 'there'}! I am your AI Booking Assistant. You can ask me to search and book tables. For example, try typing:\n\n*"Book a table for 4 tomorrow at 7:00 PM near Madhapur"*` }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const resB = await api.get('/reservations/bookings/');
      setBookings(resB.data);
      const resW = await api.get('/reservations/waitlist/');
      setWaitlists(resW.data);
    } catch (err) {
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      await updateProfile({ name, phone });
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this reservation?");
    if (!confirmCancel) return;
    try {
      await api.post(`/reservations/bookings/${bookingId}/cancel/`);
      toast.success("Reservation cancelled.");
      fetchUserData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Cancellation failed.");
    }
  };

  const handleOpenReview = (restaurantId) => {
    setReviewRestaurantId(restaurantId);
    setReviewComment('');
    setReviewRating(5);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComment) {
      toast.error("Please add a review comment.");
      return;
    }
    try {
      setReviewSubmitting(true);
      await api.post('/reviews/feedback/', {
        restaurant: reviewRestaurantId,
        rating: reviewRating,
        comment: reviewComment
      });
      toast.success("Review submitted! AI scored your feedback.");
      setReviewModalOpen(false);
      fetchUserData();
    } catch (err) {
      toast.error("Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleOpenQR = (booking) => {
    setSelectedBooking(booking);
    setQrModalOpen(true);
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { sender: 'user', text: chatInput };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/ai/chatbot/', { query: currentInput });
      const botResponseText = res.data.response;
      
      const botMessage = { 
        sender: 'bot', 
        text: botResponseText,
        suggestions: res.data.suggestions,
        params: res.data.parsed_parameters,
        suggestedRestaurant: res.data.suggested_restaurant
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev, 
        { sender: 'bot', text: "I'm sorry, I encountered an issue parsing that request. Please try again with simple parameters (date, time, party size)." }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', paddingBottom: '100px' }}>
      {/* Navigation Header */}
      <header className="glass" style={{ sticky: 'top', top: 0, zIndex: 100, padding: '16px 0', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-glass)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-display)' }} className="text-gradient">
            DiningIn AI
          </Link>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/" className="btn btn-secondary">
              <FiHome /> Home
            </Link>
            <button onClick={logout} className="btn btn-danger" style={{ padding: '10px 14px' }}>
              <FiLogOut />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <div className="container animate-fade" style={{ marginTop: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '40px' }}>
          
          {/* Sidebar */}
          <aside className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '4px' }}>{user?.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</p>
              <span style={{ display: 'inline-block', marginTop: '10px', fontSize: '0.75rem', fontWeight: '800', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                {user?.role}
              </span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => setActiveTab('bookings')} className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <FiCalendar /> My Reservations
              </button>
              <button onClick={() => setActiveTab('profile')} className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <FiUser /> Profile Settings
              </button>
            </nav>
          </aside>

          {/* Content Pane */}
          <main style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {activeTab === 'bookings' && (
              <>
                {/* Active Bookings */}
                <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700', marginBottom: '24px' }}>Upcoming Reservations</h2>
                  
                  {loading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Fetching your bookings...</p>
                  ) : bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').map(b => (
                        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', flexWrap: 'wrap', gap: '16px' }}>
                          <div>
                            <h4 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '6px' }}>{b.restaurant_name}</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FiCalendar /> {b.date} • <FiClock /> {b.time_slot} • Table {b.table_number || 'Auto'} ({b.guests_count} Guests)
                            </p>
                            {b.special_requests && (
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                                Requests: "{b.special_requests}"
                              </p>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleOpenQR(b)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                              View QR Code
                            </button>
                            <button onClick={() => handleCancelBooking(b.id)} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>You have no upcoming bookings. <Link to="/" style={{ color: 'var(--primary)', fontWeight: '600' }}>Explore restaurants</Link> to reserve a table!</p>
                  )}
                </div>

                {/* Waitlist Queue */}
                <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700', marginBottom: '24px' }}>Active Waitlist Queues</h2>
                  {waitlists.filter(w => w.status === 'waiting').length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {waitlists.filter(w => w.status === 'waiting').map(w => (
                        <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
                          <div>
                            <h4 style={{ fontWeight: '700' }}>{w.restaurant_name}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <FiCalendar /> {w.date} • <FiClock /> {w.time_slot} • {w.guests_count} Guests
                            </p>
                          </div>
                          <span style={{ fontSize: '0.8rem', background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: '700', padding: '4px 10px', borderRadius: '12px' }}>
                            Waiting for table opening
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>You are not currently waiting on any list.</p>
                  )}
                </div>

                {/* Reservation History */}
                <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700', marginBottom: '24px' }}>Past Reservations</h2>
                  {bookings.filter(b => b.status === 'completed' || b.status === 'cancelled').length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {bookings.filter(b => b.status === 'completed' || b.status === 'cancelled').map(b => (
                        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.85, background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px 20px', flexWrap: 'wrap', gap: '12px' }}>
                          <div>
                            <h4 style={{ fontWeight: '700' }}>{b.restaurant_name}</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <FiCalendar /> {b.date} • <FiClock /> {b.time_slot}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {b.status === 'completed' ? (
                              <>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontWeight: '700', fontSize: '0.9rem' }}>
                                  <FiCheckCircle /> Visited
                                </span>
                                <button onClick={() => handleOpenReview(b.restaurant)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                  Write Review
                                </button>
                              </>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontWeight: '700', fontSize: '0.9rem' }}>
                                <FiXCircle /> Cancelled
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No historical bookings found.</p>
                  )}
                </div>
              </>
            )}

            {activeTab === 'profile' && (
              <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700', marginBottom: '24px' }}>Update Profile settings</h2>
                
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>Full Name</label>
                    <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>Phone Number</label>
                    <input type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <button type="submit" disabled={profileSaving} className="btn btn-primary" style={{ width: 'fit-content', padding: '12px 28px' }}>
                    {profileSaving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Floating Chatbot Assistant Widget */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 900 }}>
        {/* Toggle bubble button */}
        {!chatOpen && (
          <button onClick={() => setChatOpen(true)} className="btn btn-primary" style={{ width: '60px', height: '60px', borderRadius: '50%', padding: 0, boxShadow: 'var(--shadow-lg)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <FiMessageSquare size={24} />
          </button>
        )}

        {/* Chat window panel */}
        {chatOpen && (
          <div className="chatbot-widget glass animate-fade" style={{ background: 'var(--bg-surface)' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-glow)' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>AI Booking Assistant</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Online • NLP powered</span>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }}>
                <FiX size={20} />
              </button>
            </div>

            {/* Message history */}
            <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
              {messages.map((m, idx) => (
                <div key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: m.sender === 'user' ? 'var(--primary)' : 'var(--bg-app)',
                    color: m.sender === 'user' ? 'var(--text-inverse)' : 'var(--text-main)',
                    border: m.sender !== 'user' ? '1px solid var(--border-color)' : 'none',
                    whiteSpace: 'pre-line'
                  }}>
                    {m.text}
                  </div>

                  {/* Suggest matches inside the chat bubble */}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                      {m.suggestions.map(s => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                          <div>
                            <strong>{s.name}</strong> ({s.cuisine})
                            <div style={{ color: 'var(--text-muted)' }}>{s.location}</div>
                          </div>
                          <Link to={`/restaurant/${s.id}?guests=${m.params?.guests_count || 2}&date=${m.params?.date || ''}&time=${m.params?.time_slot || '19:00'}`} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}>
                            Book
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div style={{ alignSelf: 'flex-start', background: 'var(--bg-app)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                  Assistant is thinking...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendChatMessage} style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Ask assistant to book a table..."
                style={{ padding: '10px 14px', fontSize: '0.85rem' }}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
                <FiSend size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* QR Confirmation Modal */}
      {qrModalOpen && selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }} className="animate-fade">
          <div className="glass" style={{ width: '90%', maxWidth: '380px', padding: '32px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setQrModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }}>
              <FiX size={20} />
            </button>
            
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>Reservation Confirmed</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Scan the QR code at the restaurant to check in</p>
            
            {/* Dynamic client-side QR renderer */}
            <div style={{ background: 'white', padding: '16px', borderRadius: 'var(--radius-md)', display: 'inline-block', boxShadow: 'var(--shadow-sm)', marginBottom: '24px' }}>
              <QRCode 
                value={`BookingID: ${selectedBooking.id}\nRestaurant: ${selectedBooking.restaurant_name}\nCustomer: ${selectedBooking.user_email}\nDate: ${selectedBooking.date}\nTime: ${selectedBooking.time_slot}\nGuests: ${selectedBooking.guests_count}`} 
                size={180} 
              />
            </div>
            
            <div style={{ textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '0.85rem' }}>
              <strong>{selectedBooking.restaurant_name}</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                Date: {selectedBooking.date} at {selectedBooking.time_slot}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                Party: {selectedBooking.guests_count} Guests
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                Table: {selectedBooking.table_number || 'Auto-Assigned'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {reviewModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }} className="animate-fade">
          <div className="glass" style={{ width: '90%', maxWidth: '440px', padding: '32px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', position: 'relative' }}>
            <button onClick={() => setReviewModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)' }}>
              <FiX size={20} />
            </button>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>Share Your Experience</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>Your review is analyzed by our AI system to evaluate food, service, and ambience scores.</p>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>Overall Rating</label>
                <select className="input-field" value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                  <option value="5">★★★★★ (5 Stars)</option>
                  <option value="4">★★★★☆ (4 Stars)</option>
                  <option value="3">★★★☆☆ (3 Stars)</option>
                  <option value="2">★★☆☆☆ (2 Stars)</option>
                  <option value="1">★☆☆☆☆ (1 Star)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>Detailed Comment</label>
                <textarea 
                  className="input-field" 
                  placeholder="Tell us about the dishes, the speed of wait staff, and the restaurant decor..." 
                  rows="4" 
                  style={{ resize: 'none' }} 
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required 
                />
              </div>

              <button type="submit" disabled={reviewSubmitting} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                {reviewSubmitting ? "Analyzing & Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerDashboard;
