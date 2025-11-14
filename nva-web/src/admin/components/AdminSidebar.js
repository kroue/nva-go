import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import nvagologo from '../../assets/nvalogomini.png';
import { supabase } from '../../SupabaseClient';

const navItems = [
  { label: 'Home', icon: <HomeOutlinedIcon />, path: '/adminhomepage' },
  { label: 'Orders', icon: <DescriptionOutlinedIcon />, path: '/admin/orders' },
  { label: 'Products', icon: <Inventory2OutlinedIcon />, path: '/admin/products' },
  { label: 'Employees', icon: <GroupsOutlinedIcon />, path: '/adminemployees' },
  { label: 'Customers', icon: <GroupOutlinedIcon />, path: '/admin/customers' },
  { label: 'Sales Report', icon: <BarChartOutlinedIcon />, path: '/admin/sales-report' },
  { label: 'View System Logs', icon: <EventNoteOutlinedIcon />, path: '/admin/system-logs' },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('Loading…');
  const [notificationCount, setNotificationCount] = useState(3);

  useEffect(() => {
    // Get admin username from localStorage
    const username = localStorage.getItem('admin_username');
    setProfileName(username || 'Admin');
  }, []);

  const handleNavClick = (item) => {
    if (item.subItems) {
      setExpanded(expanded === item.label ? '' : item.label);
    } else {
      setExpanded('');
      navigate(item.path);
    }
  };

  const isActive = (item) => {
    if (item.subItems) {
      return location.pathname.startsWith(item.path);
    }
    return location.pathname === item.path;
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_email');
    navigate('/adminlogin');
  };

  return (
    <div className="Sidebar">
      {/* User Profile Card */}
      <div className="Sidebar-user-card">
        <div className="Sidebar-user-avatar">
          <div className="avatar-circle">
            {profileName.charAt(0).toUpperCase()}
          </div>
          <div className="avatar-status"></div>
        </div>
        <div className="Sidebar-user-info">
          <h3>{profileName}</h3>
        </div>
        <button 
          className="Sidebar-user-menu-btn"
          onClick={() => setProfileModalOpen(!profileModalOpen)}
        >
          <ExpandMoreIcon className={profileModalOpen ? 'rotated' : ''} />
        </button>
        
        {profileModalOpen && (
          <div className="Sidebar-dropdown">
            <button onClick={() => { setProfileModalOpen(false); navigate('/admin/profile'); }}>
              <PersonOutlineIcon />
              <span>Edit Profile</span>
            </button>
            <button onClick={() => { setProfileModalOpen(false); navigate('/admin/settings'); }}>
              <SettingsOutlinedIcon />
              <span>Settings</span>
            </button>
            <div className="dropdown-divider"></div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogoutOutlinedIcon />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="Sidebar-nav">
        <div className="nav-section-label">MENU</div>
        <ul className="nav-list">
          {navItems.map(item => (
            <li key={item.label} className="nav-item-wrapper">
              <div
                className={`nav-item ${isActive(item) ? 'active' : ''} ${item.subItems && expanded === item.label ? 'expanded' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                <div className="nav-item-icon">
                  {item.icon}
                </div>
                <span className="nav-item-label">{item.label}</span>
                {item.subItems && (
                  <ExpandMoreIcon className={`expand-icon ${expanded === item.label ? 'rotated' : ''}`} />
                )}
              </div>
              
              {item.subItems && expanded === item.label && (
                <ul className="nav-subitems">
                  {item.subItems.map(sub => (
                    <li
                      key={sub.label}
                      className={`nav-subitem ${location.pathname === sub.path ? 'active' : ''}`}
                      onClick={() => navigate(sub.path)}
                    >
                      <FiberManualRecordIcon className="dot-icon" />
                      <span>{sub.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="Sidebar-footer">
        <div className="footer-version">
          <span>Version 2.1.0</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
