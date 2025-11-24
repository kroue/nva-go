import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';

const ForgotPassword = () => {
  const navigate = useNavigate();

  return (
    <div className="ForgotPassword-page">
      <div className="ForgotPassword-container">
        <button className="back-to-login-btn" onClick={() => navigate('/login')}>
          <ArrowBackOutlinedIcon style={{ fontSize: 18 }} />
          Back to Login
        </button>

        <div className="ForgotPassword-card">
          <div className="card-icon-wrapper">
            <LockResetOutlinedIcon className="main-icon" />
          </div>

          <h1 className="card-title">Password Reset Required</h1>
          <p className="card-subtitle">
            For security reasons, password resets must be handled by an administrator
          </p>

          <div className="info-section">
            <div className="info-header">
              <AdminPanelSettingsOutlinedIcon style={{ fontSize: 20 }} />
              <h3>Contact Administrator</h3>
            </div>

            <div className="contact-card">
              <div className="contact-item">
                <EmailOutlinedIcon className="contact-icon" />
                <div className="contact-details">
                  <span className="contact-label">Email</span>
                  <span className="contact-value">nvaprintingservices@gmail.com</span>
                </div>
              </div>

              <div className="contact-item">
                <PhoneOutlinedIcon className="contact-icon" />
                <div className="contact-details">
                  <span className="contact-label">Phone</span>
                  <span className="contact-value">0953 5383 369</span>
                </div>
              </div>
            </div>

            <div className="instructions">
              <h4>What to include in your request:</h4>
              <ul>
                <li>Your registered email address</li>
                <li>Your full name</li>
                <li>Reason for password reset</li>
              </ul>
            </div>
          </div>

          <div className="action-section">
            <button className="primary-btn" onClick={() => navigate('/login')}>
              Return to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
