import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { FiSearch, FiMapPin, FiCompass, FiStar, FiFilter, FiLogOut, FiUser, FiMoon, FiSun } from 'react-icons/fi';

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [restaurants, setRestaurants] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  // Search parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [nlpParsing, setNlpParsing] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // If user is Owner or Admin, redirect to their dashboards
  useEffect(() => {
    if (user) {
      if (user.role === 'owner') navigate('/owner');
      if (user.role === 'admin') navigate('/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchRestaurants();
    if (user && user.role === 'customer') {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = {};
      if (locationFilter) params.location = locationFilter;
      if (cuisineFilter) params.cuisine = cuisineFilter;
      if (priceFilter) params.price_range = priceFilter;
      if (searchQuery && !nlpParsing) params.q = searchQuery;

      const res = await api.get('/restaurants/profiles/', { params });
      setRestaurants(res.data);
    } catch (err) {
      toast.error("Failed to load restaurants list.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await api.get('/ai/recommend/restaurants/');
      setRecommendations(res.data);
    } catch (err) {
      console.log("Recommendations failed (probably cold start):", err);
    }
  };

  // Run the search filters whenever selectors change
  useEffect(() => {
    fetchRestaurants();
  }, [locationFilter, cuisineFilter, priceFilter]);

  const handleNlpSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    if (!user) {
      toast.error("Please log in to use the AI Booking Assistant.");
      navigate('/login');
      return;
    }

    try {
      setNlpParsing(true);
      const res = await api.post('/ai/chatbot/', { query: searchQuery });
      const parsed = res.data.parsed_parameters;
      
      toast.success(`AI Extracted: Guests: ${parsed.guests_count}, Date: ${parsed.date}, Time: ${parsed.time_slot}`);
      
      // Update filters and fetch
      if (parsed.location) {
        setLocationFilter(parsed.location);
      }
      
      if (res.data.suggestions && res.data.suggestions.length > 0) {
        setRestaurants(res.data.suggestions);
      } else {
        fetchRestaurants();
      }
      
      // If a single restaurant is strongly matched, suggest navigating to it!
      if (res.data.suggested_restaurant) {
        const confirmGo = window.confirm(`AI recommends: "${res.data.suggested_restaurant.name}". Do you want to view their availability and book?`);
        if (confirmGo) {
          navigate(`/restaurant/${res.data.suggested_restaurant.id}?guests=${parsed.guests_count}&date=${parsed.date}&time=${parsed.time_slot}`);
        }
      }
    } catch (err) {
      toast.error("AI was unable to parse query. Using normal keyword search instead.");
      fetchRestaurants();
    } finally {
      setNlpParsing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', paddingBottom: '80px' }}>
      {/* Navigation Header */}
      <header className="glass" style={{ sticky: 'top', top: 0, zIndex: 100, padding: '16px 0', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-glass)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-display)' }} className="text-gradient">
            DiningIn AI
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={toggleTheme} className="btn btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
              {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
            </button>
            
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link to="/dashboard" className="btn btn-secondary">
                  <FiUser /> Dashboard
                </Link>
                <button onClick={logout} className="btn btn-danger" style={{ padding: '10px 14px' }}>
                  <FiLogOut />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link to="/login" className="btn btn-secondary">Log In</Link>
                <Link to="/register" className="btn btn-primary">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '80px 0 60px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: '250px', height: '250px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(70px)', top: '10%', left: '5%', zIndex: 0 }}></div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3.2rem', fontWeight: '800', marginBottom: '16px', lineHeight: '1.2' }}>
            Reserve tables with <span className="text-gradient">AI Intelligence</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '640px', margin: '0 auto 40px auto' }}>
            Experience real-time table layout selection, intelligent booking forecasting, and interactive AI chatbot booking assistants.
          </p>

          {/* AI Search Parser Box */}
          <form onSubmit={handleNlpSearch} className="glass" style={{ maxWidth: '750px', margin: '0 auto', padding: '8px', borderRadius: 'var(--radius-xl)', display: 'flex', gap: '8px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: '16px', gap: '10px' }}>
              <FiSearch style={{ color: 'var(--text-muted)' }} size={20} />
              <input
                type="text"
                placeholder="Ask AI: 'Table for four tomorrow at 8 PM near Madhapur' or type a restaurant name..."
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', fontSize: '1.05rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" disabled={nlpParsing} className="btn btn-primary" style={{ borderRadius: 'var(--radius-xl)', padding: '12px 28px' }}>
              {nlpParsing ? "Analyzing..." : "Ask AI"}
            </button>
          </form>
          <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Protip: The AI automatically extracts party size, date, time, and location parameters.
          </div>
        </div>
      </section>

      {/* Main Directory & Recommendations */}
      <main className="container">
        {/* AI Recommendations Section */}
        {user && recommendations.length > 0 && (
          <section style={{ marginBottom: '50px' }} className="animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <FiCompass size={22} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: '700' }}>Recommended for You</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {recommendations.map(rest => (
                <div key={`rec-${rest.id}`} className="glass glow-hover" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'all var(--transition-smooth)' }}>
                  <img src={rest.cover_image_url} alt={rest.name} style={{ width: '100%', height: '170px', objectFit: 'cover' }} />
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>{rest.name}</h3>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: '700' }}>
                        <FiStar size={12} fill="currentColor" /> {rest.rating || 'New'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{rest.cuisine}</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                      <FiMapPin size={12} /> {rest.location}
                    </p>
                    <Link to={`/restaurant/${rest.id}`} className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                      Book Table
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Normal Directory Filters */}
        <section style={{ borderTop: '1px solid var(--border-color)', paddingTop: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: '700' }}>Explore Restaurants</h2>
            
            {/* Filters panel */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface)', padding: '4px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <FiMapPin size={14} style={{ color: 'var(--text-muted)' }} />
                <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <option value="">All Locations</option>
                  <option value="Madhapur">Madhapur</option>
                  <option value="Gachibowli">Gachibowli</option>
                  <option value="Jubilee Hills">Jubilee Hills</option>
                  <option value="Banjara Hills">Banjara Hills</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface)', padding: '4px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <FiFilter size={14} style={{ color: 'var(--text-muted)' }} />
                <select value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <option value="">All Cuisines</option>
                  <option value="Italian">Italian</option>
                  <option value="Indian">Indian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Asian">Asian</option>
                  <option value="Continental">Continental</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface)', padding: '4px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Price</span>
                <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <option value="">All Prices</option>
                  <option value="$">$ (Budget)</option>
                  <option value="$$">$$ (Medium)</option>
                  <option value="$$$">$$$ (Fine Dining)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Directory Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading restaurants...</div>
          ) : restaurants.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {restaurants.map(rest => (
                <div key={rest.id} className="glass glow-hover animate-fade" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'all var(--transition-smooth)' }}>
                  <img src={rest.cover_image_url} alt={rest.name} style={{ width: '100%', height: '170px', objectFit: 'cover' }} />
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>{rest.name}</h3>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: '700' }}>
                        <FiStar size={12} fill="currentColor" /> {rest.rating || 'New'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{rest.cuisine} • {rest.price_range}</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
                      <FiMapPin size={12} /> {rest.location}
                    </p>
                    <Link to={`/restaurant/${rest.id}`} className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                      Book Table
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
              No restaurants found matching your criteria. Try adjusting your filters or ask AI!
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;
