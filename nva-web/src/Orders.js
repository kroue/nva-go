import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import { supabase } from './SupabaseClient';
import './Orders.css';

const actionCards = [
  { label: 'Process Orders', icon: <CheckCircleOutlineIcon style={{ fontSize: 48 }} />, path: '/orders/process' },
  { label: 'Validate Payment', icon: <CheckCircleOutlineIcon style={{ fontSize: 48 }} />, path: '/orders/validate' },
  { label: 'Send Receipt', icon: <CheckCircleOutlineIcon style={{ fontSize: 48 }} />, path: '/orders/receipt' },
];

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  return (
    <div className="Orders-page">
      <div className="Orders-header">Orders</div>
      
      <div className="Orders-section-title">
        All Orders <FilterListIcon style={{ verticalAlign: 'middle', marginLeft: 8 }} />
      </div>
      <div className="Orders-grid">
        <div className="Orders-list">
          <div className="Orders-list-title">All Orders</div>
          {loading ? (
            <div className="Orders-loading">Loading orders...</div>
          ) : (
            orders.map(order => (
              <div 
                className={`Orders-card ${order.status === 'Finished' ? 'finished' : ''}`}
                key={order.id}
                onClick={() => handleOrderClick(order.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="Orders-card-main">
                  <span className="Orders-card-product">{order.variant}</span>
                  <span className="Orders-card-id">No. {order.id.slice(0, 7)}</span>
                </div>
                <div className="Orders-card-details">
                  <span>{order.height && order.width ? `${order.height} × ${order.width}` : ''}</span>
                  <span>{order.quantity} pcs</span>
                  <span>₱{order.total}</span>
                </div>
                <div className="Orders-card-footer">
                  <span className="Orders-card-customer">
                    Order by: <b>{order.first_name} {order.last_name}</b>
                  </span>
                  <span className={`Orders-card-status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="Orders-actions">
          {actionCards.map(card => (
            <div
              className="Orders-action-card"
              key={card.label}
              onClick={() => navigate(card.path)}
              style={{ cursor: 'pointer' }}
            >
              {card.icon}
              <span className="Orders-action-label">{card.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;