import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { FiChevronLeft, FiClock, FiMapPin, FiAward, FiMessageSquare, FiGrid, FiList, FiCoffee, FiStar } from 'react-icons/fi';

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  const [restaurant, setRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [reviews, setReviews] = useState([]);
  
  // Booking Form State
  const [bookingDate, setBookingDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState(searchParams.get('time') || '19:00');
  const [guestsCount, setGuestsCount] = useState(searchParams.get('guests') || '2');
  const [occasion, setOccasion] = useState('Casual');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // AI recommendations state
  const [aiRecommendedTables, setAiRecommendedTables] = useState([]);
  const [useAiRecommendation, setUseAiRecommendation] = useState(false);

  // WebSockets ref
  const ws = useRef(null);

  useEffect(() => {
    fetchRestaurantDetails();
    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (bookingDate && bookingTime && guestsCount) {
      fetchTableAvailability();
      if (useAiRecommendation) {
        fetchAiTableRecommendation();
      }
    }
  }, [bookingDate, bookingTime, guestsCount, useAiRecommendation]);

  // Connect WebSocket for live updates
  useEffect(() => {
    const wsUrl = `ws://localhost:8000/ws/restaurant/${id}/availability/`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'availability_update') {
        const update = data.data;
        // Update table list in real time!
        setTables((prevTables) =>
          prevTables.map((t) =>
            t.id === update.table_id
              ? { ...t, is_occupied: update.status === 'occupied' }
              : t
          )
        );
        toast(`Table ${update.table_number} status updated to ${update.status}!`, { icon: '🔔' });
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected.");
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [id]);

  const fetchRestaurantDetails = async () => {
    try {
      const res = await api.get(`/restaurants/profiles/${id}/`);
      setRestaurant(res.data);
    } catch (err) {
      toast.error("Failed to load restaurant profile.");
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/feedback/?restaurant=${id}`);
      setReviews(res.data);
    } catch (err) {
      console.log("Reviews fetch error:", err);
    }
  };

  const fetchTableAvailability = async () => {
    try {
      setLoadingAvailability(true);
      const res = await api.get('/reservations/bookings/check_availability/', {
        params: {
          restaurant: id,
          date: bookingDate,
          time_slot: bookingTime,
        },
      });
      setTables(res.data);
    } catch (err) {
      toast.error("Failed to load table configurations.");
    } finally {
      setLoadingAvailability(false);
    }
  };

  const fetchAiTableRecommendation = async () => {
    try {
      const res = await api.get('/ai/recommend/tables/', {
        params: {
          restaurant: id,
          guests_count: guestsCount,
          occasion: occasion,
          preferred_location: preferredLocation,
        },
      });
      setAiRecommendedTables(res.data);
      if (res.data.length > 0) {
        // Auto select the first AI recommendation if available
        const firstRec = res.data[0];
        // Ensure that the recommended table is actually available right now
        const isFree = tables.find((t) => t.id === firstRec.id && !t.is_occupied);
        if (isFree) {
          setSelectedTable(firstRec.id);
        }
      }
    } catch (err) {
      console.log("AI table recommendation failed:", err);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedTable) {
      toast.error("Please select a table from the grid.");
      return;
    }
    try {
      setBookingInProgress(true);
      const res = await api.post('/reservations/bookings/', {
        restaurant: id,
        table: selectedTable,
        date: bookingDate,
        time_slot: bookingTime,
        guests_count: guestsCount,
        special_requests: specialRequests + (useAiRecommendation ? " (Booked with AI Table Recommendation)" : ""),
      });
      toast.success("Table reserved successfully!");
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.waitlist_eligible) {
        const join = window.confirm("The selected table/timeslot is occupied. Would you like to join the waitlist queue for this slot?");
        if (join) {
          handleJoinWaitlist();
        }
      } else {
        toast.error(err.response?.data?.detail || "Booking failed. Please try again.");
      }
    } finally {
      setBookingInProgress(false);
    }
  };

  const handleJoinWaitlist = async () => {
    try {
      setBookingInProgress(true);
      await api.post('/reservations/waitlist/', {
        restaurant: id,
        date: bookingDate,
        time_slot: bookingTime,
        guests_count: guestsCount,
      });
      toast.success("Joined the waitlist! You will be notified live if a table opens up.");
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to join waitlist.");
    } finally {
      setBookingInProgress(false);
    }
  };

  if (!restaurant) {
    return <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading restaurant...</div>;
  }

  // Sentiment analytics totals
  const totalReviews = reviews.length;
  const foodAvg = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + r.food_score, 0) / totalReviews).toFixed(1) : '5.0';
  const serviceAvg = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + r.service_score, 0) / totalReviews).toFixed(1) : '5.0';
  const ambienceAvg = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + r.ambience_score, 0) / totalReviews).toFixed(1) : '5.0';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', paddingBottom: '100px' }}>
      {/* Detail Banner */}
      <div style={{ position: 'relative', height: '360px', overflow: 'hidden' }}>
        <img src={restaurant.cover_image_url} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}></div>
        
        <div className="container" style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', color: 'white' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'white', opacity: 0.8, marginBottom: '16px', fontWeight: '600' }}>
            <FiChevronLeft /> Back to home
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: '800', marginBottom: '8px' }}>{restaurant.name}</h1>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9, marginBottom: '4px' }}>
                <FiMapPin /> {restaurant.location} • {restaurant.cuisine}
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9 }}>
                <FiClock /> {restaurant.operating_hours} • {restaurant.price_range}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '1.2rem', fontWeight: '800' }}>
              <FiStar fill="currentColor" /> {restaurant.rating || 'New'}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: '40px' }}>
        {/* Left column: description, Menu, reviews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {/* About */}
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700', marginBottom: '16px' }}>About the Restaurant</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{restaurant.description || "An exquisite dining establishment where culinary excellence meets unparalleled hospitality. Join us for a memorable dining experience customized to your preferences."}</p>
          </div>

          {/* Menu */}
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <FiCoffee size={22} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700' }}>Menu Highlights</h2>
            </div>
            
            {restaurant.menu_items && restaurant.menu_items.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {restaurant.menu_items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <img src={item.image_url} alt={item.name} style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: '700', marginBottom: '4px' }}>{item.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{item.description || 'Delicately cooked fresh dish.'}</p>
                      <span style={{ fontWeight: '800', color: 'var(--primary)' }}>₹{item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No menu items uploaded yet.</p>
            )}
          </div>

          {/* AI Sentiment Analysis Card */}
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <FiAward size={22} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700' }}>AI Sentiment Review breakdown</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Food Score</p>
                <h3 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800' }}>{foodAvg} / 5.0</h3>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Service Score</p>
                <h3 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800' }}>{serviceAvg} / 5.0</h3>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Ambience Score</p>
                <h3 className="text-gradient" style={{ fontSize: '2rem', fontWeight: '800' }}>{ambienceAvg} / 5.0</h3>
              </div>
            </div>

            {/* Review List */}
            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '16px' }}>User Reviews ({totalReviews})</h4>
              {reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {reviews.map((rev) => (
                    <div key={rev.id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>{rev.user_name}</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', color: 'var(--primary)' }}>
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} fill={i < rev.rating ? "currentColor" : "none"} size={14} />
                        ))}
                        <span style={{ fontSize: '0.8rem', background: 'var(--border-color)', color: 'var(--text-main)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', textTransform: 'capitalize' }}>
                          AI Sentiment: {rev.sentiment_label}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to write a review after your booking!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column: booking panel */}
        <div>
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', sticky: 'top', top: '100px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: '700', marginBottom: '24px' }}>Reserve Your Table</h3>
            
            <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Date</label>
                <input type="date" className="input-field" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Time Slot</label>
                <select className="input-field" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} required>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="18:00">6:00 PM</option>
                  <option value="19:00">7:00 PM</option>
                  <option value="20:00">8:00 PM</option>
                  <option value="21:00">9:00 PM</option>
                  <option value="22:00">10:00 PM</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Party Size</label>
                <select className="input-field" value={guestsCount} onChange={(e) => setGuestsCount(e.target.value)} required>
                  <option value="1">1 Person</option>
                  <option value="2">2 People</option>
                  <option value="3">3 People</option>
                  <option value="4">4 People</option>
                  <option value="6">6 People</option>
                  <option value="8">8 People</option>
                  <option value="10">10 People</option>
                </select>
              </div>

              {/* AI helper toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', margin: '4px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Enable AI Recommendation</span>
                  <input type="checkbox" checked={useAiRecommendation} onChange={(e) => setUseAiRecommendation(e.target.checked)} style={{ cursor: 'pointer' }} />
                </div>
                
                {useAiRecommendation && (
                  <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Occasion</label>
                      <select className="input-field" style={{ padding: '6px 12px' }} value={occasion} onChange={(e) => setOccasion(e.target.value)}>
                        <option value="Casual">Casual Dining</option>
                        <option value="Romantic">Romantic Date</option>
                        <option value="Business">Business Meeting</option>
                        <option value="Birthday">Birthday Celebration</option>
                        <option value="Family">Family Dinner</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Preferred Seating</label>
                      <select className="input-field" style={{ padding: '6px 12px' }} value={preferredLocation} onChange={(e) => setPreferredLocation(e.target.value)}>
                        <option value="">No Preference</option>
                        <option value="window">Near Window</option>
                        <option value="patio">Outdoor Patio</option>
                        <option value="center">Lively Center</option>
                        <option value="private">Quiet Corner</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Availability table layout grid */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                  Live Table grid layout <span style={{ float: 'right', fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--success)' }}>● WebSocket Live</span>
                </label>
                
                {loadingAvailability ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Checking live status...</div>
                ) : tables.length > 0 ? (
                  <div className="table-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {tables.map((table) => {
                      const isAiChoice = useAiRecommendation && aiRecommendedTables.some(t => t.id === table.id && aiRecommendedTables[0]?.id === t.id);
                      
                      let cardClass = "restaurant-table-card free";
                      if (table.is_occupied) cardClass = "restaurant-table-card occupied";
                      if (selectedTable === table.id) cardClass = "restaurant-table-card selected";

                      return (
                        <div
                          key={table.id}
                          className={cardClass}
                          style={{
                            padding: '12px 8px',
                            fontSize: '0.85rem',
                            border: isAiChoice ? '2px solid gold' : undefined,
                            position: 'relative'
                          }}
                          onClick={() => {
                            if (!table.is_occupied) {
                              setSelectedTable(table.id);
                            } else {
                              toast.error("This table is reserved. Join the waitlist below!");
                            }
                          }}
                        >
                          {isAiChoice && (
                            <span style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: 'gold', color: 'black', fontSize: '0.65rem', fontWeight: '800', padding: '1px 6px', borderRadius: '10px', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)' }}>
                              AI Suggest
                            </span>
                          )}
                          <div style={{ fontWeight: '700' }}>T-{table.table_number}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{table.capacity} Pax</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'capitalize' }}>{table.location_tag}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No tables available for this restaurant setup.</p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Special Requests</label>
                <textarea className="input-field" placeholder="Any dietary restrictions, baby seat need..." rows="2" style={{ resize: 'none' }} value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={bookingInProgress} className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                  {bookingInProgress ? "Booking..." : "Book Selected Table"}
                </button>
                <button type="button" onClick={handleJoinWaitlist} disabled={bookingInProgress} className="btn btn-secondary" style={{ padding: '12px' }}>
                  Join Waitlist
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;
