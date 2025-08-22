import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';
import nvagologo from '../assets/nvagologo.png';
import { supabase } from '../SupabaseClient'; // Import Supabase client

const Login = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  const handleCreateAccountClick = () => {
    navigate('/signup'); // Redirect to the signup page
  };

  const handleLoginClick = async (event) => {
    event.preventDefault();
    setError('');
    const username = event.target.username.value;
    const password = event.target.password.value;

    // Debug: log username
    console.log('Trying to login with username:', username);

    // Supabase query for admin email
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('email')
      .eq('username', username)
      .limit(1)
      .maybeSingle();

    // Debug: log query result and error
    console.log('adminData:', adminData);
    console.log('adminError:', adminError);

    if (adminError || !adminData) {
      setError('Invalid admin username');
      return;
    }

    // Login with Supabase Auth using admin email
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: adminData.email,
      password,
    });

    // Debug: log auth error
    console.log('authError:', authError);

    if (authError) {
      setError('Invalid password');
      return;
    }

    navigate('/adminhomepage');
  };

  const handleForgotPasswordClick = () => {
    navigate('/forgot-password'); // Redirect to the forgot password page
  };

  const handleAdminLoginClick = () => {
    navigate('/adminlogin'); // Redirect to the admin login page
  };

  return (
    <div className="LoginPage">
      {/* Header */}
      <header className="LoginPage-header">
      </header>

      {/* Body */}
      <div className="LoginPage-body">
        {/* Left Section */}
        <div className="LoginPage-left">
          <img src={nvagologo} alt="NVA Go Logo" className="LoginPage-logo-large" />
          <p className="LoginPage-description">
            NVAGo is intuitive, reliable online and offline, and offers a wide range of options to meet all your printing business needs. Set it up in minutes, start selling in seconds, and keep both your staff and clients satisfied!
          </p>
          <button
            className="AdminLogin-button"
            onClick={handleAdminLoginClick}
            style={{
              marginTop: '24px',
              padding: '10px 24px',
              background: '#252b55',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Admin Login
          </button>
        </div>

        {/* Right Section */}
        <div className="LoginPage-right">
          <div className="LoginForm">
            <h2 className="LoginForm-title">Log In</h2>
            <form onSubmit={handleLoginClick}>
              <div className="LoginForm-field">
                <input type="text" id="username" name="username" placeholder="Username" />
              </div>
              <div className="LoginForm-field">
                <input type="password" id="password" name="password" placeholder="Password" />
              </div>
              {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
              <div className="LoginForm-options">
                <label>
                  <input type="checkbox" /> Remember me
                </label>
                <button
                  type="button"
                  className="ForgotPassword"
                  onClick={handleForgotPasswordClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'blue',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Forgot Password
                </button>
              </div>
              <button type="submit" className="LoginForm-button">Admin Log In</button>
            </form>
            <div className="CreateAccount">
              <p>
                Don't have an account?{' '}
                <button className="CreateAccount-link" onClick={handleCreateAccountClick}>
                  Create Account
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="LoginPage-footer">NVA Printing Services 2025</footer>
    </div>
  );
}

export default Login;