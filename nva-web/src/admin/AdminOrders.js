import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../SupabaseClient';
import './AdminOrders.css';

const peso = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n || 0));

const statusClass = (s) => {
  switch ((s || '').toLowerCase()) {
    case 'validation':
      return 'badge badge--pending';
    case 'layout approval':
      return 'badge badge--info';
    case 'printing':
      return 'badge badge--processing';
    case 'for pickup':
      return 'badge badge--shipped';
    case 'finished':
      return 'badge badge--delivered';
    case 'declined':
    case 'cancelled':
      return 'badge badge--cancelled';
    default:
      return 'badge badge--neutral';
  }
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('id,first_name,last_name,status,total,created_at')
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="AdminOrders">
      <div className="AdminOrders-title">Orders</div>

      <div className="AdminOrders-tableWrap">
        <table className="AdminOrders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="AdminOrders-empty">Loading…</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="AdminOrders-empty">No orders found.</td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr
                  key={o.id}
                  className="AdminOrders-row"
                  onClick={() => navigate(`/orders/${o.id}`)}
                >
                  <td className="muted">#{String(o.id).slice(0, 8)}</td>
                  <td>{[o.first_name, o.last_name].filter(Boolean).join(' ') || 'Customer'}</td>
                  <td>
                    <span className={statusClass(o.status)}>{o.status || '—'}</span>
                  </td>
                  <td>{peso(o.total)}</td>
                  <td>
                    <button
                      className="AdminOrders-menuBtn"
                      onClick={(e) => e.stopPropagation()}
                      title="More"
                      aria-label="More actions"
                    >
                      ⋮
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;