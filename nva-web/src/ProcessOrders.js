import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './ProcessOrders.css';

const statuses = ['Validation', 'Layout Approval', 'Printing', 'For Pickup'];

const ProcessOrders = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*');
      if (!error) setOrders(data);
    };
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    // Refresh orders after update
    const { data } = await supabase.from('orders').select('*');
    setOrders(data);
  };

  const handleCardClick = (order) => {
    navigate(`/orders/${order.id}`);
  };

  return (
    <div className="ProcessOrders-page">
      <div className="ProcessOrders-section-title">Process Orders</div>
      <div className="ProcessOrders-container">
        <div className="ProcessOrders-grid">
          {orders.map(order => (
            <div
              className="ProcessOrders-card"
              key={order.id}
              onClick={() => handleCardClick(order)}
              style={{ cursor: 'pointer' }}
            >
              <div className="ProcessOrders-card-header">
                <span className="ProcessOrders-card-name">{order.first_name} {order.last_name}</span>
                <span className="ProcessOrders-card-id">
                  No. {order.id ? order.id.slice(0, 8) : ''}
                </span>
              </div>
              <div className="ProcessOrders-card-product">{order.variant}</div>
              <div className="ProcessOrders-card-details">
                <div>Size: {order.height && order.width ? `${order.height} x ${order.width}` : '---'}</div>
                <div>Pickup: {order.pickup_date}</div>
                <div>Date: {order.pickup_date}</div>
                <div>Time: {order.pickup_time}</div>
              </div>
              <input
                className="ProcessOrders-card-description"
                type="text"
                value={order.instructions || ''}
                disabled
              />
              <button className="ProcessOrders-card-viewmore" disabled>View more</button>
              <div className="ProcessOrders-card-statuses">
                {statuses.map(s => (
                  <button
                    key={s}
                    className={`ProcessOrders-status-btn${order.status === s ? ' active' : ''}`}
                    onClick={() => handleStatusChange(order.id, s)}
                    disabled={order.status === s}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcessOrders;