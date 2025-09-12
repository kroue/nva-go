import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check for admin session (you can also check supabase.auth.getUser() if you want)
  const adminUsername = localStorage.getItem('admin_username');
  if (!adminUsername) {
    return <Navigate to="/adminlogin" replace />;
  }
  return children;
};

export default ProtectedRoute;