import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './Login.css';
import nvagologo from './assets/nvagologo.png'; // Import the logo image

const Login = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  const handleCreateAccountClick = () => {
    navigate('/signup'); // Redirect to the signup page
  };

  const handleLoginClick = (event) => {
    event.preventDefault(); // Prevent the default form submission behavior
    navigate('/homepage'); // Redirect to the homepage
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
                <input type="text" id="username" placeholder="Username" />
              </div>
              <div className="LoginForm-field">
                <input type="password" id="password" placeholder="Password" />
              </div>
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