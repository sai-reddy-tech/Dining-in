import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiLock, FiSun, FiMoon, FiHome } from 'react-icons/fi';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer'); // customer or owner
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'owner') navigate('/owner');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      setLoading(true);
      await register(email, name, phone, role, password);
      toast.success("Account created successfully! Please log in.");
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.email?.[0] || err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '100px 16px 24px 16px', background: 'var(--bg-app)' }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(80px)', top: '-50px', left: '-50px', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(80px)', bottom: '-50px', right: '-50px', zIndex: 0 }}></div>
      
      {/* Navigation Header */}
      <header className="glass" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '16px 0', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-glass)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-display)', textDecoration: 'none' }} className="text-gradient">
            DiningIn AI
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiHome /> Back to Home
            </Link>
            <button onClick={toggleTheme} className="btn btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
              {theme === 'light' ? <FiMoon size={16} /> : <FiSun size={16} />}
            </button>
          </div>
        </div>
      </header>

      <div className="glass animate-fade" style={{ width: '100%', maxWidth: '460px', padding: '40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 className="text-gradient" style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>DiningIn AI</h2>
          <p style={{ color: 'var(--text-muted)' }}>Create your custom reservation profile</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Full Name *</label>
            <div style={{ position: 'relative' }}>
              <FiUser style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="John Doe"
                className="input-field"
                style={{ paddingLeft: '44px' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Email Address *</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="john@example.com"
                className="input-field"
                style={{ paddingLeft: '44px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Phone Number</label>
            <div style={{ position: 'relative' }}>
              <FiPhone style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                className="input-field"
                style={{ paddingLeft: '44px' }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>I am a *</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className={`btn ${role === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setRole('customer')}
              >
                Customer
              </button>
              <button
                type="button"
                className={`btn ${role === 'owner' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setRole('owner')}
              >
                Restaurant Owner
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Password *</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="Minimum 6 characters"
                className="input-field"
                style={{ paddingLeft: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '10px', padding: '14px' }}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
