import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import nvagologo from '../assets/nvalogomini.png';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { supabase } from '../SupabaseClient';
import { useAuth } from '../hooks/useAuth';

const Header = () => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email) return;

    const fetchUnreadCount = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, read_by, target_email')
        .or(`target_email.is.null,target_email.eq.${user.email}`);

      if (!error && data) {
        const unread = data.filter(n => !(n.read_by || []).includes(user.email));
        setUnreadCount(unread.length);
      }
    };

    fetchUnreadCount();

    // Realtime subscription
    const channel = supabase
      .channel('header-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email]);

  return (
    <header className="Header">
      <div className="Header-left">
        <div className="Header-logo" onClick={() => navigate('/homepage')} style={{ cursor: 'pointer' }}>
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
        <button className="Header-action-btn" title="Notifications" onClick={() => navigate('/notifications')}>
          <NotificationsNoneOutlinedIcon />
          {unreadCount > 0 && <span className="action-badge">{unreadCount}</span>}
        </button>
        <button className="Header-action-btn" title="Messages" onClick={() => navigate('/messages')}>
          <ChatBubbleOutlineOutlinedIcon />
        </button>
        <button className="Header-action-btn" title="About" onClick={() => navigate('/about')}>
          <HelpOutlineOutlinedIcon />
        </button>
      </div>
    </header>
  );
};

export default Header;