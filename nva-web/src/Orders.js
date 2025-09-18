import React from 'react';
import { useNavigate } from 'react-router-dom'; // <-- Add this
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FilterListIcon from '@mui/icons-material/FilterList';
import './Orders.css';

const orders = [
  {
    id: '2025312',
    product: 'High Quality Tarpaulin',
    customer: 'Rodel Madrid',
    status: 'Pending',
  },
];

const actionCards = [
  { label: 'Process Orders', icon: <CheckCircleOutlineIcon style={{ fontSize: 48 }} />, path: '/orders/process' },
  { label: 'Validate Payment', icon: <CheckCircleOutlineIcon style={{ fontSize: 48 }} />, path: '/orders/validate' },
  { label: 'Send Receipt', icon: <CheckCircleOutlineIcon style={{ fontSize: 48 }} />, path: '/orders/receipt' },
];

const Orders = () => {
  const navigate = useNavigate(); // <-- Add this

  return (
    <div className="Orders-page">
      <div className="Orders-header">Orders</div>
      
      <div className="Orders-section-title">
        All Orders <FilterListIcon style={{ verticalAlign: 'middle', marginLeft: 8 }} />
      </div>
      <div className="Orders-grid">
        <div className="Orders-list">
          <div className="Orders-list-title">All Orders</div>
          {orders.map(order => (
            <div className="Orders-card" key={order.id}>
              <div className="Orders-card-main">
                <span className="Orders-card-product">{order.product}</span>
                <span className="Orders-card-id">No. {order.id}</span>
              </div>
              <div className="Orders-card-footer">
                <span className="Orders-card-customer">
                  Order made by: <b>{order.customer}</b>
                </span>
                <span className="Orders-card-status">{order.status}</span>
              </div>
            </div>
          ))}
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