import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ThemeContext } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { FiCheckCircle, FiCalendar, FiClock, FiUser, FiMapPin, FiHome, FiList } from 'react-icons/fi';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reservations/bookings/${bookingId}/`);
      setBooking(res.data);
    } catch (err) {
      toast.error("Failed to load booking details.");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-app)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 'bold' }}>Retrieving your booking ticket...</p>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 16px', position: 'relative', overflow: 'hidden' }}>
      {/* Background Glows */}
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(80px)', top: '-50px', left: '-50px', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(80px)', bottom: '-50px', right: '-50px', zIndex: 0 }}></div>

      <div className="glass animate-fade" style={{ width: '100%', maxWidth: '480px', padding: '40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 1, textAlign: 'center' }}>
        
        {/* Success Icon */}
        <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', borderRadius: '50%', marginBottom: '24px' }}>
          <FiCheckCircle size={48} />
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }} className="text-gradient">
          Reservation Confirmed!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '32px' }}>
          Your table is booked. Present this ticket at the restaurant for check-in.
        </p>

        {/* Check-in Ticket Pass */}
        <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'left', marginBottom: '32px', position: 'relative' }}>
          
          {/* Ticket jagged punchholes */}
          <div style={{ position: 'absolute', width: '16px', height: '16px', background: 'var(--bg-app)', borderRight: '1px solid var(--border-color)', borderRadius: '50%', left: '-9px', top: '50%', transform: 'translateY(-50%)' }}></div>
          <div style={{ position: 'absolute', width: '16px', height: '16px', background: 'var(--bg-app)', borderLeft: '1px solid var(--border-color)', borderRadius: '50%', right: '-9px', top: '50%', transform: 'translateY(-50%)' }}></div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '12px' }}>
            {booking.restaurant_name}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiCalendar style={{ color: 'var(--primary)' }} />
              <span><strong>Date:</strong> {booking.date}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiClock style={{ color: 'var(--primary)' }} />
              <span><strong>Time:</strong> {booking.time_slot} PM</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiUser style={{ color: 'var(--primary)' }} />
              <span><strong>Party Size:</strong> {booking.guests_count} Guests</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiMapPin style={{ color: 'var(--primary)' }} />
              <span><strong>Table Code:</strong> T-{booking.table_number || 'Auto'}</span>
            </div>
          </div>

          {/* QR Code Container */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed var(--border-color)' }}>
            <div style={{ background: 'white', padding: '12px', borderRadius: '8px', display: 'inline-block' }}>
              <QRCode value={`res_id:${booking.id}_uid:${booking.user}`} size={130} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Pass ID: #{booking.id}
            </span>
          </div>

        </div>

        {/* Navigation Action Buttons */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/" className="btn btn-secondary" style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <FiHome /> Home
          </Link>
          <Link to="/dashboard" className="btn btn-primary" style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <FiList /> My Bookings
          </Link>
        </div>

      </div>
    </div>
  );
};

export default BookingConfirmation;
