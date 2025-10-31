import React, { useState } from 'react';
import './SignUp.css';
import nvagologo from './assets/nvagologo.png'; // Import the logo image
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { supabase } from './SupabaseClient'; // Import Supabase client

const SignUp = () => {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!firstname || !lastname || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agree) {
      setError('You must agree to the privacy and policy.');
      return;
    }

    try {
      // Send OTP to email and create user on verification (passwordless initially)
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          data: {
            first_name: firstname.trim(),
            last_name: lastname.trim(),
          },
        },
      });

      if (otpErr) {
        setError(otpErr.message || 'Failed to send OTP.');
        return;
      }

      // Navigate to verification page with data
      navigate('/verification', {
        state: {
          email: email.trim(),
          password,
          first_name: firstname.trim(),
          last_name: lastname.trim(),
        },
      });
    } catch (e) {
      setError('Network error. Please try again.');
    }
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
            {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
            <form onSubmit={handleSignUp}>
              <div className="SignUpForm-field double">
                <input
                  type="text"
                  id="firstname"
                  placeholder="Firstname"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                />
                <input
                  type="text"
                  id="lastname"
                  placeholder="Lastname"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                />
              </div>
              <div className="SignUpForm-field">
                <input
                  type="email"
                  id="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="SignUpForm-field">
                <div className="PasswordWrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                  /> I agree with the{' '}
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
