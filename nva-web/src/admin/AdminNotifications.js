import React, { useEffect, useMemo, useState } from 'react';
import './AdminNotifications.css';
import { supabase } from '../SupabaseClient';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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

export default function AdminNotifications() {
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await load();

      // Realtime subscription
      const channel = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          (payload) => {
            if (!mounted) return;
            load();
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
    return items.filter((n) => !(n.read_by || []).length);
  }, [items]);

  const list = tab === 'unread' ? unread : items;

  const markRead = async (id) => {
    await supabase.rpc('mark_notification_read', { nid: id, user_email: null });
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_by: ['admin'] } : n
      )
    );
  };

  const markAllRead = async () => {
    const promises = unread.map((n) => markRead(n.id));
    await Promise.all(promises);
    load();
  };

  return (
    <div className="AdminNotifications-page">
      <div className="AdminNotifications-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <NotificationsIcon style={{ fontSize: '40px' }} />
          <div>
            <div>Admin Notifications</div>
            <div style={{ fontSize: '14px', fontWeight: '500', marginTop: '4px', opacity: 0.9 }}>
              Stay updated with system activities
            </div>
          </div>
        </div>
        {unread.length > 0 && (
          <button
            onClick={markAllRead}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <DoneAllIcon style={{ fontSize: '18px' }} />
            Mark All Read
          </button>
        )}
      </div>

      <div className="AdminNotifications-tabs">
        <button
          className={`AdminNotifications-tab${tab === 'all' ? ' active' : ''}`}
          onClick={() => setTab('all')}
        >
          All Notifications
          {items.length > 0 && (
            <span style={{
              background: tab === 'all' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(102, 126, 234, 0.1)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {items.length}
            </span>
          )}
        </button>
        <button
          className={`AdminNotifications-tab${tab === 'unread' ? ' active' : ''}`}
          onClick={() => setTab('unread')}
        >
          Unread
          {unread.length > 0 && (
            <span style={{
              background: tab === 'unread' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(102, 126, 234, 0.1)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {unread.length}
            </span>
          )}
        </button>
      </div>

      <div className="AdminNotifications-section">
        <div className="AdminNotifications-section-title">
          {tab === 'unread' ? 'Unread Notifications' : 'All Notifications'}
        </div>

        {loading && (
          <div className="AdminNotifications-loading">
            <NotificationsIcon style={{ fontSize: '64px', color: '#dfe4ea', opacity: 0.5 }} />
            <h2>Loading Notifications</h2>
            <p>Please wait while we fetch your notifications...</p>
          </div>
        )}

        {!loading && list.length === 0 && (
          <div className="AdminNotifications-empty">
            <NotificationsIcon style={{ fontSize: '64px', color: '#dfe4ea', opacity: 0.5 }} />
            <h2>No Notifications</h2>
            <p>{tab === 'unread' ? 'You have no unread notifications.' : 'No notifications to display.'}</p>
          </div>
        )}

        {!loading && list.map((n) => {
          const isUnread = !(n.read_by || []).length;
          return (
            <div
              key={n.id}
              className={`AdminNotifications-item ${isUnread ? 'unread' : ''}`}
              onClick={() => isUnread && markRead(n.id)}
              role="button"
              title={isUnread ? 'Click to mark as read' : 'Read'}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
                    {n.title || n.type}
                  </div>
                </div>
                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px', lineHeight: '1.5' }}>
                  {n.body}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  <AccessTimeIcon style={{ fontSize: '14px' }} />
                  {formatWhen(n.created_at)}
                </div>
              </div>
              {isUnread && <span className="AdminNotifications-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
