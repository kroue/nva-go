import React from 'react';
import './Header.css';
import nvagologo from '../../assets/nvalogomini.png';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const AdminHeader = () => {
  return (
    <header className="Header">
      <div className="Header-left">
        <div className="Header-logo">
          <img src={nvagologo} alt="NVA Go Logo" />
        </div>
        <div className="Header-title">
          <h2>Admin Dashboard</h2>
          <p>System Management</p>
        </div>
      </div>

      <div className="Header-center">
      </div>

      <div className="Header-right">
        <button 
          className="Header-action-btn" 
          title="Notifications"
        >
          <NotificationsNoneOutlinedIcon />
        </button>
        <button 
          className="Header-action-btn" 
          title="Settings"
        >
          <SettingsOutlinedIcon />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;