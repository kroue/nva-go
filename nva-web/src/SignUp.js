import React, { useState } from 'react';
import './SignUp.css';
import nvagologo from './assets/nvagologo.png'; // Import the logo image
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handlePrivacyPolicyClick = () => {
    navigate('/privacy-policy'); // Redirect to the privacy policy page
  };

  const handleSignInClick = () => {
    navigate('/login'); // Redirect to the login page
  };

  const handleTryFreeClick = () => {
    navigate('/try-free'); // Redirect to the try-free page
  };

  return (
    <div className="SignUpPage">
      {/* Header */}
      <header className="SignUpPage-header">
        <img src={nvagologo} alt="NVA Go Logo" className="SignUpPage-logo" />
        <div className="SignUpPage-actions">
          <button className="SignIn-button" onClick={handleSignInClick}>
            Sign In
          </button>
          <button className="TryFree-button" onClick={handleTryFreeClick}>
            Try it free
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="SignUpPage-body">
        {/* Left Section */}
        <div className="SignUpPage-left">
          <img src={nvagologo} alt="NVA Go Logo" className="SignUpPage-logo-large" />
          <p className="SignUpPage-description">
            NVAGo is intuitive, reliable online and offline, and offers a wide range of options to meet all your printing business needs. Set it up in minutes, start selling in seconds, and keep both your staff and clients satisfied!
          </p>
        </div>

        {/* Right Section */}
        <div className="SignUpPage-right">
          <div className="SignUpForm">
            <h2 className="SignUpForm-title">Sign Up</h2>
            <form>
              <div className="SignUpForm-field double">
                <input type="text" id="firstname" placeholder="Firstname" />
                <input type="text" id="lastname" placeholder="Lastname" />
              </div>
              <div className="SignUpForm-field">
                <input type="email" id="email" placeholder="Email" />
              </div>
              <div className="SignUpForm-field">
                <div className="PasswordWrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="TogglePassword-button"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="SignUpForm-field">
                <div className="PasswordWrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-password"
                    placeholder="Confirm Password"
                  />
                  <button
                    type="button"
                    className="TogglePassword-button"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="SignUpForm-options">
                <label>
                  <input type="checkbox" /> I agree with the{' '}
                  <button
                    type="button"
                    className="PrivacyPolicy-link"
                    onClick={handlePrivacyPolicyClick}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'blue',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    privacy and policy
                  </button>
                </label>
              </div>
              <button type="submit" className="SignUpForm-button">Sign Up</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;