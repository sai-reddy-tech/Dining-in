import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import RestaurantDetails from '../pages/RestaurantDetails';
import CustomerDashboard from '../pages/CustomerDashboard';
import OwnerDashboard from '../pages/OwnerDashboard';
import AdminDashboard from '../pages/AdminDashboard';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="animate-fade" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', fontWeight: 'bold' }}>Verifying...</div>;
  return user ? children : <Navigate to="/login" />;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="animate-fade" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', fontWeight: 'bold' }}>Verifying...</div>;
  if (!user) return <Navigate to="/login" />;
  return allowedRoles.includes(user.role) ? children : <Navigate to="/" />;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Customer Routing */}
        <Route path="/" element={<Home />} />
        <Route path="/restaurant/:id" element={
          <PrivateRoute>
            <RestaurantDetails />
          </PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <RoleRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </RoleRoute>
        } />

        {/* Restaurant Owner Routing */}
        <Route path="/owner" element={
          <RoleRoute allowedRoles={['owner', 'admin']}>
            <OwnerDashboard />
          </RoleRoute>
        } />

        {/* Admin Routing */}
        <Route path="/admin" element={
          <RoleRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </RoleRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
