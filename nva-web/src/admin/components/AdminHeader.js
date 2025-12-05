import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import nvagologo from '../../assets/nvalogomini.png';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';

const AdminHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="Header">
      <div className="Header-left">
        <div className="Header-logo" onClick={() => navigate('/adminhomepage')} style={{ cursor: 'pointer' }}>
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
          title="Admin Messages"
          onClick={() => navigate('/admin/messages')}
        >
          <ChatBubbleOutlineOutlinedIcon />
        </button>
        <button 
          className="Header-action-btn" 
          title="Notifications"
          onClick={() => navigate('/admin/notifications')}
        >
          <NotificationsNoneOutlinedIcon />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;