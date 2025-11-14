import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './Login.css';
import nvagologo from './assets/nvagologo.png';

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleCreateAccountClick = () => {
    navigate('/signup'); // Redirect to the signup page
  };

  const handleLoginClick = async (event) => {
    event.preventDefault();
    setError('');
    const username = event.target.username.value;
    const password = event.target.password.value;

    console.log('username input:', username);

    // Find employee by username
    const { data: empData, error: empError } = await supabase
      .from('employees')
      .select('email')
      .eq('username', username)
      .maybeSingle();

    console.log('empData:', empData, 'empError:', empError);

    if (empError || !empData) {
      setError('Invalid username');
      return;
    }

    // Login with Supabase Auth using employee email
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: empData.email,
      password,
    });

    if (authError) {
      setError('Invalid password');
      return;
    }

    navigate('/homepage');
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
              {error && <div className="LoginForm-error">{error}</div>}
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
              <button type="submit" className="LoginForm-button">Log In</button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="LoginPage-footer">NVA Printing Services 2025</footer>
    </div>
  );
}

export default Login;