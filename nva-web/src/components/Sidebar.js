import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import nvagologo from '../assets/nvalogomini.png';
import { supabase } from '../SupabaseClient';

const navItems = [
  { label: 'Home', icon: <HomeOutlinedIcon />, path: '/homepage' },
  { 
    label: 'Orders', 
    icon: <DescriptionOutlinedIcon />, 
    path: '/orders', 
    subItems: [
      { label: 'Process Orders', path: '/orders/process' },
      { label: 'Validate Payment', path: '/orders/validate' },
      { label: 'Send Receipt', path: '/send-receipt' },
    ]
  },
  { 
    label: 'Products', 
    icon: <Inventory2OutlinedIcon />, 
    path: '/products', 
    subItems: [
      { label: 'Catalog', path: '/products' },
      { label: 'Manage Status', path: '/products/toggle' },
    ]
  },
  { label: 'Customers', icon: <GroupOutlinedIcon />, path: '/customers' },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState('');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('Loading…');
  const [notificationCount, setNotificationCount] = useState(3);

  useEffect(() => {
    let mounted = true;

    const preferName = ({ first_name, last_name, username, email, meta }) => {
      const first = (first_name || meta?.first_name || '').trim();
      const last = (last_name || meta?.last_name || '').trim();
      let name = [first, last].filter(Boolean).join(' ').trim();
      if (!name) name = (username || meta?.full_name || '').trim();
      if (!name && email) name = email.split('@')[0];
      return name || 'User';
    };

    const loadProfileName = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email || null;
        const meta = session?.user?.user_metadata || {};
        if (!email) {
          if (mounted) setProfileName('Guest');
          return;
        }

        const { data: employee, error: empErr } = await supabase
          .from('employees')
          .select('first_name,last_name,username,email')
          .eq('email', email)
          .maybeSingle();

        if (!empErr && employee) {
          if (mounted) setProfileName(preferName({ ...employee, meta }));
          return;
        }

        if (mounted) setProfileName(preferName({ email, meta }));
      } catch (e) {
        console.error('Sidebar: failed to load employee name', e);
        if (mounted) setProfileName('User');
      }
    };

    loadProfileName();
    return () => { mounted = false; };
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
    navigate('/login');
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
            <button onClick={() => { setProfileModalOpen(false); navigate('/edit-profile'); }}>
              <PersonOutlineIcon />
              <span>My Profile</span>
            </button>
            <button onClick={() => { setProfileModalOpen(false); navigate('/settings'); }}>
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