import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { supabase } from '../../SupabaseClient'; // Adjust the import based on your project structure
  
const navItems = [
  { label: 'Home', icon: <HomeOutlinedIcon />, path: '/adminhomepage' },
  { label: 'Orders', icon: <AssignmentOutlinedIcon />, path: '/admin/orders' },
  { label: 'Products', icon: <PrintOutlinedIcon />, path: '/admin/products' },
  { label: 'Employees', icon: <GroupsOutlinedIcon />, path: '/adminemployees' },
  { label: 'Customers', icon: <GroupOutlinedIcon />, path: '/admin/customers' },
  { label: 'Sales Report', icon: <BarChartOutlinedIcon />, path: '/admin/sales-report' },
  { label: 'View System Logs', icon: <EventNoteOutlinedIcon />, path: '/admin/system-logs' },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  // Add this function for the profile arrow
  const handleProfileArrowClick = () => {
    setShowProfileModal(true);
  };

  const handleCloseModal = () => {
    setShowProfileModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/adminlogin');
  };

  const handleEditProfile = () => {
    setShowProfileModal(false);
    navigate('/admin/profile');
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
            onClick={() => navigate('/admin/notifications')}
          >
            <NotificationsNoneOutlinedIcon />
          </button>
          <button
            className="Sidebar-footer-button"
            onClick={() => navigate('/admin/messages')}
          >
            <ChatBubbleOutlineOutlinedIcon />
          </button>
          <button className="Sidebar-footer-button"><HelpOutlineOutlinedIcon /></button>
        </div>
        <div className="Sidebar-profile">
          <span className="Sidebar-profile-name">Aljohn Arranguez</span>
          <button
            className="Sidebar-profile-button"
            onClick={handleProfileArrowClick}
          >
            <ArrowForwardIosOutlinedIcon />
          </button>
        </div>
      </div>
      {/* Profile Modal */}
      {showProfileModal && (
        <div className="Sidebar-profile-modal">
          <div className="Sidebar-profile-modal-content">
            <button onClick={handleEditProfile} className="Sidebar-profile-modal-btn">
              Edit Profile
            </button>
            <button onClick={handleLogout} className="Sidebar-profile-modal-btn">
              Log Out
            </button>
            <button onClick={handleCloseModal} className="Sidebar-profile-modal-btn Sidebar-profile-modal-close">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;