import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { FiLayout, FiCoffee, FiCalendar, FiTrendingUp, FiPlus, FiTrash2, FiAlertTriangle, FiUser, FiInfo, FiLogOut } from 'react-icons/fi';

const OwnerDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeSubTab, setActiveSubTab] = useState('bookings'); // bookings, tables, menu, analytics, profile
  const [restaurant, setRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // Forms states
  const [newTableNo, setNewTableNo] = useState('');
  const [newTableCap, setNewTableCap] = useState(4);
  const [newTableLoc, setNewTableLoc] = useState('Main Room');
  
  const [menuName, setMenuName] = useState('');
  const [menuDesc, setMenuDesc] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuCategory, setMenuCategory] = useState('Main Course');

  const [restName, setRestName] = useState('');
  const [restCuisine, setRestCuisine] = useState('');
  const [restLoc, setRestLoc] = useState('');
  const [restDesc, setRestDesc] = useState('');
  const [restHours, setRestHours] = useState('11:00 AM - 11:00 PM');
  const [restPriceRange, setRestPriceRange] = useState('$$');
  const [savingRest, setSavingRest] = useState(false);

  // Analytics states
  const [demandForecast, setDemandForecast] = useState([]);
  const [noShowRisks, setNoShowRisks] = useState({});

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    try {
      // 1. Get my restaurants
      const res = await api.get('/restaurants/profiles/my_restaurants/');
      if (res.data.length > 0) {
        const restData = res.data[0];
        setRestaurant(restData);
        setRestName(restData.name);
        setRestCuisine(restData.cuisine);
        setRestLoc(restData.location);
        setRestDesc(restData.description || '');
        setRestHours(restData.operating_hours || '11:00 AM - 11:00 PM');
        setRestPriceRange(restData.price_range || '$$');

        // 2. Fetch dependencies
        fetchRestaurantTables(restData.id);
        fetchRestaurantMenu(restData.id);
        fetchReservations(restData.id);
        fetchAnalytics(restData.id);
      }
    } catch (err) {
      toast.error("Failed to load owner configurations.");
    }
  };

  const fetchRestaurantTables = async (restId) => {
    const res = await api.get(`/restaurants/tables/?restaurant=${restId}`);
    setTables(res.data);
  };

  const fetchRestaurantMenu = async (restId) => {
    const res = await api.get(`/restaurants/menu/?restaurant=${restId}`);
    setMenuItems(res.data);
  };

  const fetchReservations = async (restId) => {
    const res = await api.get('/reservations/bookings/');
    // Filter bookings on client if necessary, though queryset already filters based on owner
    setBookings(res.data);
    
    // Evaluate no-show risks for active bookings
    res.data.forEach(booking => {
      if (booking.status === 'confirmed') {
        fetchNoShowRisk(booking.id, booking.user, booking.guests_count);
      }
    });
  };

  const fetchAnalytics = async (restId) => {
    try {
      const res = await api.get(`/ai/predict/demand/?restaurant=${restId}`);
      setDemandForecast(res.data);
    } catch (err) {
      console.log("Analytics loading failed:", err);
    }
  };

  const fetchNoShowRisk = async (bookingId, userId, guestsCount) => {
    try {
      const res = await api.get(`/ai/predict/noshow/?user=${userId}&guests_count=${guestsCount}&lead_time_days=3`);
      setNoShowRisks(prev => ({
        ...prev,
        [bookingId]: res.data
      }));
    } catch (err) {
      console.log(err);
    }
  };

  // Save Restaurant Profile details
  const handleSaveRestaurant = async (e) => {
    e.preventDefault();
    try {
      setSavingRest(true);
      const data = {
        name: restName,
        cuisine: restCuisine,
        location: restLoc,
        description: restDesc,
        operating_hours: restHours,
        price_range: restPriceRange
      };
      
      if (restaurant) {
        // PUT
        const res = await api.put(`/restaurants/profiles/${restaurant.id}/`, data);
        setRestaurant(res.data);
        toast.success("Restaurant profile updated.");
      } else {
        // POST
        const res = await api.post('/restaurants/profiles/', data);
        setRestaurant(res.data);
        toast.success("Restaurant registered successfully! Setup your tables and menus next.");
        fetchOwnerData();
      }
    } catch (err) {
      toast.error("Failed to save restaurant profile.");
    } finally {
      setSavingRest(false);
    }
  };

  // Table operations
  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!restaurant) {
      toast.error("Configure your restaurant profile first.");
      return;
    }
    try {
      await api.post('/restaurants/tables/', {
        restaurant: restaurant.id,
        table_number: newTableNo,
        capacity: newTableCap,
        location_tag: newTableLoc
      });
      toast.success("Table added successfully.");
      setNewTableNo('');
      fetchRestaurantTables(restaurant.id);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Table number already exists.");
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm("Delete this table configuration?")) return;
    try {
      await api.delete(`/restaurants/tables/${tableId}/`);
      toast.success("Table configuration deleted.");
      fetchRestaurantTables(restaurant.id);
    } catch (err) {
      toast.error("Failed to delete table.");
    }
  };

  // Menu operations
  const handleAddMenu = async (e) => {
    e.preventDefault();
    if (!restaurant) {
      toast.error("Configure restaurant profile first.");
      return;
    }
    try {
      await api.post('/restaurants/menu/', {
        restaurant: restaurant.id,
        name: menuName,
        description: menuDesc,
        price: parseFloat(menuPrice),
        category: menuCategory
      });
      toast.success("Menu item added.");
      setMenuName('');
      setMenuDesc('');
      setMenuPrice('');
      fetchRestaurantMenu(restaurant.id);
    } catch (err) {
      toast.error("Failed to add menu item.");
    }
  };

  const handleDeleteMenu = async (menuId) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      await api.delete(`/restaurants/menu/${menuId}/`);
      toast.success("Menu item removed.");
      fetchRestaurantMenu(restaurant.id);
    } catch (err) {
      toast.error("Failed to delete menu item.");
    }
  };

  // Complete Booking trigger
  const handleCompleteBooking = async (bookingId) => {
    try {
      // For developer convenience, complete changes status to completed
      await api.patch(`/reservations/bookings/${bookingId}/`, { status: 'completed' });
      toast.success("Reservation marked as Completed.");
      fetchReservations(restaurant.id);
    } catch (err) {
      toast.error("Failed to complete booking.");
    }
  };

  // Static review breakdown scores for charting
  const pieData = restaurant ? [
    { name: 'Food quality', value: restaurant.rating > 0 ? parseFloat((restaurant.rating + 0.1).toFixed(1)) : 4.5 },
    { name: 'Service speed', value: restaurant.rating > 0 ? parseFloat((restaurant.rating - 0.2).toFixed(1)) : 4.0 },
    { name: 'Ambience', value: restaurant.rating > 0 ? parseFloat((restaurant.rating + 0.2).toFixed(1)) : 4.8 }
  ] : [];

  const COLORS = ['#f59e0b', '#2563eb', '#8b5cf6'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', paddingBottom: '100px' }}>
      <header className="glass" style={{ sticky: 'top', top: 0, zIndex: 100, padding: '16px 0', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-glass)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-display)' }} className="text-gradient">
            DiningIn AI <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>| Owner Hub</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Logged in: {user?.name}</span>
            <button onClick={logout} className="btn btn-danger" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container" style={{ marginTop: '40px' }}>
        <div className="dashboard-grid" style={{ gap: '40px' }}>
          {/* Sidebar */}
          <aside className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>{restaurant?.name || "My Restaurant"}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{restaurant?.cuisine || "Cuisine setup needed"}</p>
            </div>
            
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => setActiveSubTab('bookings')} className={`btn ${activeSubTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <FiCalendar /> Bookings Log
              </button>
              <button onClick={() => setActiveSubTab('tables')} className={`btn ${activeSubTab === 'tables' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <FiLayout /> Manage Tables
              </button>
              <button onClick={() => setActiveSubTab('menu')} className={`btn ${activeSubTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <FiCoffee /> Menu Manager
              </button>
              <button onClick={() => setActiveSubTab('analytics')} className={`btn ${activeSubTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <FiTrendingUp /> AI Analytics Hub
              </button>
              <button onClick={() => setActiveSubTab('profile')} className={`btn ${activeSubTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <FiUser /> Profile details
              </button>
            </nav>
          </aside>

          {/* Content area */}
          <main style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {activeSubTab === 'bookings' && (
              <div className="glass animate-fade" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700', marginBottom: '24px' }}>Reservations logs</h2>
                
                {bookings.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {bookings.map(b => {
                      const risk = noShowRisks[b.id];
                      const isHighRisk = risk && risk.risk_level === 'High Risk';
                      
                      return (
                        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', flexWrap: 'wrap', gap: '16px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <h4 style={{ fontWeight: '700', fontSize: '1.05rem' }}>{b.user_name} ({b.user_email})</h4>
                              <span style={{ fontSize: '0.75rem', background: b.status === 'completed' ? 'hsla(142,70%,45%,0.1)' : 'var(--primary-glow)', color: b.status === 'completed' ? 'var(--success)' : 'var(--primary)', padding: '2px 8px', borderRadius: '10px', textTransform: 'capitalize', fontWeight: '700' }}>
                                {b.status}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                              Date: {b.date} • Time: {b.time_slot} • Table {b.table_number || 'Auto'} ({b.guests_count} Pax)
                            </p>
                            
                            {/* AI No-Show warning flag */}
                            {b.status === 'confirmed' && risk && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', padding: '4px 10px', borderRadius: '6px', background: isHighRisk ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: isHighRisk ? 'var(--danger)' : 'var(--success)', fontSize: '0.8rem', fontWeight: '700' }}>
                                <FiAlertTriangle /> AI No-Show probability: {risk.no_show_probability}% ({risk.risk_level})
                              </div>
                            )}
                          </div>
                          
                          {b.status === 'confirmed' && (
                            <button onClick={() => handleCompleteBooking(b.id)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                              Mark Visited
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No bookings recorded yet.</p>
                )}
              </div>
            )}

            {activeSubTab === 'tables' && (
              <div className="glass animate-fade" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700', marginBottom: '24px' }}>Dining Room Table configuration</h2>
                
                {/* Form to add table */}
                <form onSubmit={handleAddTable} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Table Number</label>
                    <input type="text" className="input-field" placeholder="e.g. 104" value={newTableNo} onChange={(e) => setNewTableNo(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Capacity (Pax)</label>
                    <input type="number" className="input-field" min="1" value={newTableCap} onChange={(e) => setNewTableCap(parseInt(e.target.value))} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Location Tag</label>
                    <select className="input-field" value={newTableLoc} onChange={(e) => setNewTableLoc(e.target.value)}>
                      <option value="Main Room">Main Dining Room</option>
                      <option value="window">Near Window</option>
                      <option value="patio">Outdoor Patio</option>
                      <option value="bar">Bar Area</option>
                      <option value="private">Quiet Corner</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: '45px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <FiPlus /> Add Table
                  </button>
                </form>

                {/* Tables Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                  {tables.map(t => (
                    <div key={t.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '4px' }}>Table {t.table_number}</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Capacity: {t.capacity} Guests</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'capitalize' }}>{t.location_tag}</span>
                      </div>
                      <button onClick={() => handleDeleteTable(t.id)} className="btn btn-secondary" style={{ marginTop: '16px', padding: '6px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}>
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === 'menu' && (
              <div className="glass animate-fade" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700', marginBottom: '24px' }}>Manage restaurant Menu</h2>
                
                {/* Add menu item form */}
                <form onSubmit={handleAddMenu} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px', maxWidth: '500px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Item Name</label>
                      <input type="text" className="input-field" placeholder="e.g. Margherita Pizza" value={menuName} onChange={(e) => setMenuName(e.target.value)} required />
                    </div>
                    <div style={{ width: '120px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Price (₹)</label>
                      <input type="number" className="input-field" placeholder="399" value={menuPrice} onChange={(e) => setMenuPrice(e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Description</label>
                    <input type="text" className="input-field" placeholder="Brief ingredients description..." value={menuDesc} onChange={(e) => setMenuDesc(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Category</label>
                    <select className="input-field" value={menuCategory} onChange={(e) => setMenuCategory(e.target.value)}>
                      <option value="Appetizer">Appetizer</option>
                      <option value="Main Course">Main Course</option>
                      <option value="Dessert">Dessert</option>
                      <option value="Drink">Drink</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', padding: '12px 28px' }}>
                    Add Menu Item
                  </button>
                </form>

                {/* Menu items display list */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {menuItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <img src={item.image_url} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                        <div>
                          <strong style={{ display: 'block' }}>{item.name}</strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>{item.description || 'Tasty fresh course'}</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)' }}>₹{item.price}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteMenu(item.id)} className="btn btn-secondary" style={{ padding: '8px', color: 'var(--danger)' }}>
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === 'analytics' && (
              <div className="glass animate-fade" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700', marginBottom: '32px' }}>AI Operations & predictive reports</h2>
                
                {/* 1. Demand Forecast Chart */}
                <div style={{ marginBottom: '50px' }}>
                  <h4 style={{ fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    7-Day Booking Demand forecasting
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
                    This model evaluates historical reservation logs to predict dining load and suggest staffing.
                  </p>
                  
                  {demandForecast.length > 0 ? (
                    <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px 16px' }}>
                      <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={demandForecast}>
                            <defs>
                              <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="weekday" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                            <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }} />
                            <Area type="monotone" dataKey="expected_demand" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorDemand)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Grid listing predicted load and staffing recommendations */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', textAlign: 'center' }}>
                        {demandForecast.map((day, i) => (
                          <div key={i} style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                            <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{day.weekday}</strong>
                            <div style={{ fontSize: '1.2rem', fontWeight: '800', margin: '4px 0', color: 'var(--primary)' }}>{day.expected_demand}</div>
                            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' }}>{day.staffing_recommendation.split(' ')[0]} Staff</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No demand records available. Build reservation history to generate forecast.</p>
                  )}
                </div>

                {/* 2. Reviews sentiment Breakdown Chart */}
                <div>
                  <h4 style={{ fontWeight: '700', marginBottom: '8px' }}>Review Sentiment category analysis</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
                    Scores represent average ratings extracted by NLP sentiment analysis on comment submissions.
                  </p>
                  
                  {pieData.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
                      <div style={{ height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={pieData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 5]} />
                            <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }} />
                            <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        {pieData.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[idx] }} />
                              <span>{item.name}</span>
                            </div>
                            <strong>{item.value} / 5.0</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No review score metrics to analyze.</p>
                  )}
                </div>

              </div>
            )}

            {activeSubTab === 'profile' && (
              <div className="glass animate-fade" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '700', marginBottom: '24px' }}>Configure Restaurant Profile</h2>
                
                <form onSubmit={handleSaveRestaurant} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>Restaurant Name *</label>
                    <input type="text" className="input-field" value={restName} onChange={(e) => setRestName(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>Cuisine Cuisines (comma separated) *</label>
                    <input type="text" className="input-field" placeholder="e.g. Italian, Pasta, Pizza" value={restCuisine} onChange={(e) => setRestCuisine(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>Location Address *</label>
                    <input type="text" className="input-field" placeholder="e.g. Madhapur, Hyderabad" value={restLoc} onChange={(e) => setRestLoc(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>Operating Hours</label>
                    <input type="text" className="input-field" value={restHours} onChange={(e) => setRestHours(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>Budget Range</label>
                      <select className="input-field" value={restPriceRange} onChange={(e) => setRestPriceRange(e.target.value)}>
                        <option value="$">$ (Budget)</option>
                        <option value="$$">$$ (Medium)</option>
                        <option value="$$$">$$$ (Fine Dining)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: '600' }}>Restaurant Description</label>
                    <textarea className="input-field" rows="3" style={{ resize: 'none' }} value={restDesc} onChange={(e) => setRestDesc(e.target.value)} />
                  </div>
                  
                  <button type="submit" disabled={savingRest} className="btn btn-primary" style={{ width: 'fit-content', padding: '12px 28px', marginTop: '10px' }}>
                    {savingRest ? "Saving configuration..." : "Save Restaurant Settings"}
                  </button>
                </form>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
