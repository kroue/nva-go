import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const navItems = [
  { label: 'Home', icon: <HomeOutlinedIcon />, path: '/homepage' },
  { label: 'Orders', icon: <DescriptionOutlinedIcon />, path: '/orders', subItems: [
    { label: 'Process Orders', path: '/orders/process' },
    { label: 'Validate Payment', path: '/orders/validate' },
    { label: 'Send Digital Receipt', path: '/orders/receipt' },
  ]},
  { label: 'Products', icon: <Inventory2OutlinedIcon />, path: '/products', subItems: [
    { label: 'Product Catalog', path: '/products/catalog' },
    { label: 'Toggle Product Status', path: '/products/toggle' },
  ]},
  { label: 'Customers', icon: <GroupOutlinedIcon />, path: '/customers' },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const arrowRef = useRef(null);

  const handleNavClick = (item) => {
    if (item.subItems) {
      setExpanded(expanded === item.label ? '' : item.label);
      navigate(item.path);
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

  const handleProfileArrowClick = () => {
    setProfileModalOpen(!profileModalOpen);
  };

  const handleEditProfile = () => {
    setProfileModalOpen(false);
    navigate('/edit-profile');
  };

  const handleLogout = () => {
    setProfileModalOpen(false);
    navigate('/login');
  };

  return (
    <div className="Sidebar">
      {/* Search Bar */}
      <div className="Sidebar-search">
        <input type="text" placeholder="Search" className="Sidebar-search-input" />
      </div>

      {/* Navigation */}
      <nav className="Sidebar-nav">
        <ul>
          {navItems.map(item => (
            <React.Fragment key={item.label}>
              <li
                className={`Sidebar-item${isActive(item) ? ' active' : ''}`}
                onClick={() => handleNavClick(item)}
                style={{ cursor: 'pointer' }}
              >
                <span className="Sidebar-icon">{item.icon}</span>
                <span className="Sidebar-text">{item.label}</span>
              </li>
              {item.subItems && expanded === item.label && (
                <ul className="Sidebar-subitems">
                  {item.subItems.map(sub => (
                    <li
                      key={sub.label}
                      className={`Sidebar-subitem${location.pathname === sub.path ? ' active' : ''}`}
                      onClick={() => navigate(sub.path)}
                      style={{ cursor: 'pointer' }}
                    >
                      <ChevronRightIcon fontSize="small" />
                      <span className="Sidebar-text">{sub.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </React.Fragment>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="Sidebar-footer">
        <div className="Sidebar-footer-buttons">
          <button
            className="Sidebar-footer-button"
            onClick={() => navigate('/notifications')}
          >
            <NotificationsNoneOutlinedIcon />
          </button>
          <button
            className="Sidebar-footer-button"
            onClick={() => navigate('/messages')}
          >
            <ChatBubbleOutlineOutlinedIcon />
          </button>
          <button className="Sidebar-footer-button"><HelpOutlineOutlinedIcon /></button>
        </div>
        <div className="Sidebar-profile" style={{ position: 'relative' }}>
          <span className="Sidebar-profile-name">Aljohn Arranguez</span>
          <button
            className="Sidebar-profile-button"
            ref={arrowRef}
            onClick={handleProfileArrowClick}
            style={{ position: 'relative', zIndex: 2 }}
          >
            <ArrowForwardIosOutlinedIcon />
          </button>
          {profileModalOpen && (
            <div
              className="Sidebar-profile-modal"
              style={{
                position: 'absolute',
                bottom: '100%', // expand upwards
                right: 0,
                background: '#fff', 
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                borderRadius: '10px',
                padding: '12px 0',
                minWidth: '160px',
                zIndex: 10,
                animation: 'fadeInModal 0.18s ease'
              }}
            >
              <button
                className="Sidebar-profile-modal-item"
                style={{
                  width: '100%',
                  padding: '10px 18px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
                onClick={handleEditProfile}
              >
                Edit Profile
              </button>
              <button
                className="Sidebar-profile-modal-item"
                style={{
                  width: '100%',
                  padding: '10px 18px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '16px',
                  cursor: 'pointer',
                  color: '#d32f2f',
                }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;