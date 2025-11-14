import React, { useState } from 'react';
import './Header.css';
import nvagologo from '../assets/nvalogomini.png';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const Header = () => {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="Header">
      <div className="Header-left">
        <div className="Header-logo">
          <img src={nvagologo} alt="NVA Go Logo" />
        </div>
        <div className="Header-title">
          <h2>Dashboard</h2>
          <p>Welcome back!</p>
        </div>
      </div>

      <div className="Header-center">
      </div>

      <div className="Header-right">
        <button className="Header-action-btn" title="Notifications">
          <NotificationsNoneOutlinedIcon />
          <span className="action-badge">3</span>
        </button>
        <button className="Header-action-btn" title="Messages">
          <ChatBubbleOutlineOutlinedIcon />
        </button>
        <button className="Header-action-btn" title="Settings">
          <SettingsOutlinedIcon />
        </button>
      </div>
    </header>
  );
};

export default Header;