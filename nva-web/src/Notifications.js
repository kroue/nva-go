import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './Notifications.css';

const Notifications = () => {
  const [tab, setTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
      }
      if (data) setNotifications(data);
      setLoading(false);
    };

    fetchUserAndNotifications();

    // Subscribe to auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
        } else {
          setUserId(null);
          setNotifications([]);
        }
      }
    );

    // Subscribe to new notifications
    let notificationSubscription;
    if (userId) {
      notificationSubscription = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `recipient=eq.${userId}` 
          },
          payload => {
            setNotifications(current => [payload.new, ...current]);
          }
        )
        .subscribe();
    }

    return () => {
      if (notificationSubscription) {
        notificationSubscription.unsubscribe();
      }
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [userId]);

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);

      setNotifications(current =>
        current.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    }

    // Navigate based on type
    if (notification.type === 'order') {
      navigate(`/orders/${notification.reference_id}`);
    } else if (notification.type === 'message') {
      navigate(`/messages/${notification.chat_id}`);
    } else if (notification.type === 'payment') {
      navigate(`/orders/validate`);
    }
  };

  const filteredNotifications = notifications.filter(notification =>
    tab === 'all' || (tab === 'unread' && !notification.read)
  );

  const newNotifications = filteredNotifications.filter(n => !n.read);
  const earlierNotifications = filteredNotifications.filter(n => n.read);

  if (loading) return <div className="Notifications-loading">Loading...</div>;

  return (
    <div className="Notifications-page">
      <div className="Notifications-header">Notifications</div>
      <div className="Notifications-tabs">
        <button
          className={`Notifications-tab${tab === 'all' ? ' active' : ''}`}
          onClick={() => setTab('all')}
        >
          All
        </button>
        <button
          className={`Notifications-tab${tab === 'unread' ? ' active' : ''}`}
          onClick={() => setTab('unread')}
        >
          Unread ({newNotifications.length})
        </button>
      </div>

      {newNotifications.length > 0 && (
        <div className="Notifications-section">
          <div className="Notifications-section-title">New</div>
          {newNotifications.map((notification) => (
            <div 
              className="Notifications-item" 
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="Notifications-item-content">
                <span>{notification.message}</span>
                <span className="Notifications-timestamp">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
              <span className="Notifications-dot"></span>
            </div>
          ))}
        </div>
      )}

      {earlierNotifications.length > 0 && (
        <div className="Notifications-section">
          <div className="Notifications-section-title">Earlier</div>
          {earlierNotifications.map((notification) => (
            <div 
              className="Notifications-item" 
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="Notifications-item-content">
                <span>{notification.message}</span>
                <span className="Notifications-timestamp">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredNotifications.length === 0 && (
        <div className="Notifications-empty">
          No notifications found
        </div>
      )}
    </div>
  );
};

export default Notifications;