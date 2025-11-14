import React, { useEffect, useMemo, useState } from 'react';
import './Notifications.css';
import { supabase } from './SupabaseClient';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';

const formatWhen = (ts) => {
  try {
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
};

const getNotificationIcon = (type, read) => {
  const iconStyle = { fontSize: 20 };
  
  if (type === 'success') {
    return <CheckCircleOutlineOutlinedIcon style={iconStyle} />;
  } else if (type === 'error' || type === 'warning') {
    return <ErrorOutlineOutlinedIcon style={iconStyle} />;
  } else if (!read) {
    return <NotificationsActiveOutlinedIcon style={iconStyle} />;
  }
  return <InfoOutlinedIcon style={iconStyle} />;
};

export default function Notifications() {
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (userEmail) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`target_email.is.null,target_email.eq.${userEmail}`)
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || null;
      setEmail(userEmail);
      if (userEmail) await load(userEmail);

      // Realtime subscription
      const channel = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          (payload) => {
            if (!mounted) return;
            const row = payload.new || payload.old;
            if (!row) return;
            if (row.target_email && row.target_email !== userEmail) return;
            load(userEmail);
          }
        )
        .subscribe();

      return () => {
        mounted = false;
        supabase.removeChannel(channel);
      };
    })();
  }, []);

  const unread = useMemo(() => {
    if (!email) return [];
    return items.filter((n) => !(n.read_by || []).includes(email));
  }, [items, email]);

  const list = tab === 'unread' ? unread : items;

  const markRead = async (id) => {
    if (!email) return;
    await supabase.rpc('mark_notification_read', { nid: id, user_email: email });
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_by: Array.from(new Set([...(n.read_by || []), email])) } : n
      )
    );
  };

  const markAllRead = async () => {
    if (!email || unread.length === 0) return;
    
    for (const notification of unread) {
      await supabase.rpc('mark_notification_read', { nid: notification.id, user_email: email });
    }
    
    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        read_by: Array.from(new Set([...(n.read_by || []), email]))
      }))
    );
  };

  return (
    <div className="Notifications-page">
      <div className="Notifications-header">
        <div className="Notifications-header-content">
          <NotificationsOutlinedIcon className="Notifications-header-icon" />
          <div className="Notifications-header-text">
            <h1>Notifications</h1>
            <p>Stay updated with your latest activities</p>
          </div>
        </div>
        <div className="Notifications-stats">
          <div className="stat-badge">
            <span className="stat-number">{items.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-badge">
            <span className="stat-number">{unread.length}</span>
            <span className="stat-label">Unread</span>
          </div>
        </div>
      </div>

      <div className="Notifications-container">
        <div className="Notifications-controls">
          <div className="Notifications-tabs">
            <button
              className={`Notifications-tab ${tab === 'all' ? 'active' : ''}`}
              onClick={() => setTab('all')}
            >
              All Notifications
            </button>
            <button
              className={`Notifications-tab ${tab === 'unread' ? 'active' : ''}`}
              onClick={() => setTab('unread')}
            >
              Unread
              {unread.length > 0 && <span className="tab-count">{unread.length}</span>}
            </button>
          </div>

          {unread.length > 0 && (
            <button className="mark-all-read-btn" onClick={markAllRead}>
              <MarkEmailReadOutlinedIcon style={{ fontSize: 18 }} />
              Mark All as Read
            </button>
          )}
        </div>

        <div className="Notifications-list">
          {loading && (
            <div className="Notifications-loading">
              <NotificationsOutlinedIcon style={{ fontSize: 64, opacity: 0.3 }} />
              <h2>Loading Notifications...</h2>
              <p>Please wait while we fetch your notifications.</p>
            </div>
          )}

          {!loading && list.length === 0 && (
            <div className="Notifications-empty">
              <NotificationsOutlinedIcon style={{ fontSize: 64, opacity: 0.3 }} />
              <h2>No Notifications</h2>
              <p>{tab === 'unread' ? 'You have no unread notifications.' : 'You have no notifications yet.'}</p>
            </div>
          )}

          {!loading && list.map((n) => {
            const isUnread = email && !(n.read_by || []).includes(email);
            return (
              <div
                key={n.id}
                className={`Notifications-item ${isUnread ? 'unread' : ''} ${n.type || ''}`}
                onClick={() => {
                  markRead(n.id);
                  if (n.link) {
                    window.location.href = n.link;
                  }
                }}
              >
                <div className="notification-icon-wrapper">
                  {getNotificationIcon(n.type, !isUnread)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h4 className="notification-title">{n.title || n.type || 'Notification'}</h4>
                    {isUnread && <span className="unread-dot" />}
                  </div>
                  
                  {n.body && (
                    <p className="notification-body">{n.body}</p>
                  )}
                  
                  <div className="notification-time">
                    <AccessTimeOutlinedIcon style={{ fontSize: 14 }} />
                    <span>{formatWhen(n.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}