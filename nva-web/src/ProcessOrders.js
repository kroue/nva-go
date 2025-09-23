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
      if (!error) {
        // Sort orders: active first, finished last
        const sortedOrders = data.sort((a, b) => {
          if (a.status === 'Finished' && b.status !== 'Finished') return 1;
          if (a.status !== 'Finished' && b.status === 'Finished') return -1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setOrders(sortedOrders);
      }
    };
    fetchOrders();
  }, []);

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
              className={`ProcessOrders-card ${order.status === 'Finished' ? 'finished' : ''}`}
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
              <div className="ProcessOrders-card-meta">
                <div className="ProcessOrders-card-time">
                  Created: {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                </div>
                {(order.employee_first_name || order.employee_email) && (
                  <div className="ProcessOrders-card-employee">
                    Employee: {order.employee_first_name && order.employee_last_name 
                      ? `${order.employee_first_name} ${order.employee_last_name}`
                      : order.employee_email?.split('@')[0] || 'Unknown'}
                  </div>
                )}
              </div>
              <div className="ProcessOrders-card-product">{order.variant}</div>
              <div className="ProcessOrders-card-details">
                <div>Size: {order.height && order.width ? `${order.height} x ${order.width}` : '---'}</div>
                <div>Pickup: {order.pickup_date}</div>
                <div>Time: {order.pickup_time}</div>
              </div>
              <input
                className="ProcessOrders-card-description"
                type="text"
                value={order.instructions || ''}
                disabled
              />
              <div className="status-tracker">
                {statuses.map(status => (
                  <div
                    key={status}
                    className={`status-pill ${order.status === status ? 'active' : ''}`}
                  >
                    {status}
                  </div>
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