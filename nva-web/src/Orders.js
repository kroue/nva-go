import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import { supabase } from './SupabaseClient';
import './Orders.css';

const actionCards = [
  { label: 'Process Orders', icon: <CheckCircleOutlineIcon style={{ fontSize: 48 }} />, path: '/orders/process' },
  { label: 'Validate Payment', icon: <CheckCircleOutlineIcon style={{ fontSize: 48 }} />, path: '/orders/validate' },
  { label: 'Send Receipt', icon: <CheckCircleOutlineIcon style={{ fontSize: 48 }} />, path: '/send-receipt' },
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

        if (error) {
          console.error('Error fetching orders:', error);
        } else {
          setOrders(data || []);
        }
      } catch (error) {
        console.error('Exception fetching orders:', error);
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
      
      <div className="Orders-section-title">All Orders</div>
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
                  <span className="Orders-card-product">{order.product_name ? `${order.product_name} - ${order.variant}` : order.variant}</span>
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
                  <span className={`Orders-card-status ${order.status?.toLowerCase() || 'pending'}`}>
                    {order.status || 'Pending'}
                  </span>
                </div>
                <div className="Orders-card-meta">
                  <span className="Orders-card-time">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                  {(order.employee_first_name || order.employee_email) && (
                    <span className="Orders-card-employee">
                      Employee: {order.employee_first_name && order.employee_last_name 
                        ? `${order.employee_first_name} ${order.employee_last_name}`
                        : order.employee_email?.split('@')[0] || 'Unknown'}
                    </span>
                  )}
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