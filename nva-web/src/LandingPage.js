import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './App.css';
import './LandingPage.css'; // Add a new CSS file for custom styles
import landingbg from './assets/landingbg.png';
import nvagologo from './assets/nvagologo.png'; // Import the logo image

const LandingPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSignInClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false); // Simulate loading for 2 seconds
      navigate('/login'); // Redirect to the login page
    }, 2000);
  };

  return (
    <div className="LandingPage">
      {isLoading ? (
        <div className="LoadingScreen">
          <div className="LoadingCircle"></div>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="LandingPage-header">
            <img src={nvagologo} alt="NVA Go Logo" className="LandingPage-logo" />
            <button className="SignIn-button" onClick={handleSignInClick}>
              Sign In
            </button>
          </header>

          {/* Body */}
          <div
            className="LandingPage-body"
            style={{
              backgroundImage: `url(${landingbg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></div>

          {/* Footer */}
          <footer className="LandingPage-footer">NVA Printing Services 2025</footer>
        </>
      )}
    </div>
  );
}

export default LandingPage;