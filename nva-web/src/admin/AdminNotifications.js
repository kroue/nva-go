import React, { useEffect, useMemo, useState } from 'react';
import './AdminNotifications.css';
import { supabase } from '../SupabaseClient';

const formatWhen = (ts) => {
  try { return new Date(ts).toLocaleString(); } catch { return ''; }
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
    await supabase.rpc('mark_notification_read', { nid: id, user_email: null }); // Admin mark as read for all
    setItems((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_by: [] } : n // Simplify for admin
      )
    );
  };

  return (
    <div className="AdminNotifications-page">
      <div className="AdminNotifications-header">Notifications</div>

      <div className="AdminNotifications-tabs">
        <button
          className={`AdminNotifications-tab${tab === 'all' ? ' active' : ''}`}
          onClick={() => setTab('all')}
        >
          All
        </button>
        <button
          className={`AdminNotifications-tab${tab === 'unread' ? ' active' : ''}`}
          onClick={() => setTab('unread')}
        >
          Unread {unread.length ? `(${unread.length})` : ''}
        </button>
      </div>

      <div className="AdminNotifications-section">
        <div className="AdminNotifications-section-title">
          {tab === 'unread' ? 'Unread' : 'Latest'}
        </div>

        {loading && <div className="AdminNotifications-item">Loading…</div>}
        {!loading && list.length === 0 && (
          <div className="AdminNotifications-item">No notifications.</div>
        )}

        {list.map((n) => (
          <div
            key={n.id}
            className={`AdminNotifications-item ${!(n.read_by || []).length ? 'unread' : ''}`}
            onClick={() => markRead(n.id)}
            role="button"
            title="Mark as read"
          >
            <div>
              <div style={{ fontWeight: 700 }}>{n.title || n.type}</div>
              <div style={{ color: '#667085', fontSize: 13 }}>{n.body}</div>
              <div style={{ color: '#98a2b3', fontSize: 12, marginTop: 4 }}>{formatWhen(n.created_at)}</div>
            </div>
            {!(n.read_by || []).length && <span className="AdminNotifications-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
}
