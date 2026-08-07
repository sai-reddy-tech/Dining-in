import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiSun, FiMoon, FiHome } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useContext(AuthContext);
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
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      setLoading(true);
      const userData = await login(email, password);
      toast.success(`Welcome back, ${userData.name}!`);
      if (userData.role === 'owner') navigate('/owner');
      else if (userData.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid login credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '100px 16px 16px 16px', background: 'var(--bg-app)' }}>
      {/* Background blobs for premium depth */}
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

      <div className="glass animate-fade" style={{ width: '100%', maxWidth: '420px', padding: '40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 className="text-gradient" style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '8px' }}>DiningIn AI</h2>
          <p style={{ color: 'var(--text-muted)' }}>Log in to discover and reserve tables</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="you@example.com"
                className="input-field"
                style={{ paddingLeft: '44px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                style={{ paddingLeft: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '14px' }}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Create account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
