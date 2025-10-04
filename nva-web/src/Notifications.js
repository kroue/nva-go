import React, { useEffect, useMemo, useState } from 'react';
import './Notifications.css';
import { supabase } from './SupabaseClient';

const formatWhen = (ts) => {
  try { return new Date(ts).toLocaleString(); } catch { return ''; }
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
            // only react to rows targeted to me or broadcast
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
          Unread {unread.length ? `(${unread.length})` : ''}
        </button>
      </div>

      <div className="Notifications-section">
        <div className="Notifications-section-title">
          {tab === 'unread' ? 'Unread' : 'Latest'}
        </div>

        {loading && <div className="Notifications-item">Loading…</div>}
        {!loading && list.length === 0 && (
          <div className="Notifications-item">No notifications.</div>
        )}

        {list.map((n) => (
          <div
            key={n.id}
            className={`Notifications-item ${email && !(n.read_by || []).includes(email) ? 'unread' : ''}`}
            onClick={() => markRead(n.id)}
            role="button"
            title="Mark as read"
          >
            <div>
              <div style={{ fontWeight: 700 }}>{n.title || n.type}</div>
              <div style={{ color: '#667085', fontSize: 13 }}>{n.body}</div>
              <div style={{ color: '#98a2b3', fontSize: 12, marginTop: 4 }}>{formatWhen(n.created_at)}</div>
            </div>
            {email && !(n.read_by || []).includes(email) && <span className="Notifications-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
}