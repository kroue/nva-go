import React from 'react';
import './ProcessOrders.css';

const order = {
  id: '2025313',
  name: 'Kharlo Edulan',
  product: 'High Quality Tarpaulin',
  size: '---',
  pickup: '---',
  date: 'May 19, 2025',
  time: '1:00 PM',
  status: 'Printing',
};

const statuses = ['Validation', 'Layout Approval', 'Printing', 'For Pickup'];

const ProcessOrders = () => (
  <div className="ProcessOrders-page">
    <div className="ProcessOrders-section-title">Process Orders</div>
    <div className="ProcessOrders-container">
      <div className="ProcessOrders-grid">
        <div className="ProcessOrders-card">
          <div className="ProcessOrders-card-header">
            <span className="ProcessOrders-card-name">{order.name}</span>
            <span className="ProcessOrders-card-id">No. {order.id}</span>
          </div>
          <div className="ProcessOrders-card-product">{order.product}</div>
          <div className="ProcessOrders-card-details">
            <div>Size: {order.size}</div>
            <div>Pickup: {order.pickup}</div>
            <div>Date: {order.date}</div>
            <div>Time: {order.time}</div>
          </div>
          <input
            className="ProcessOrders-card-description"
            type="text"
            placeholder="Description of Tarpaulin"
            disabled
          />
          <button className="ProcessOrders-card-viewmore" disabled>View more</button>
          <div className="ProcessOrders-card-statuses">
            {statuses.map(s => (
              <button
                key={s}
                className={`ProcessOrders-status-btn${order.status === s ? ' active' : ''}`}
                disabled
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {/* Empty cards for layout */}
        <div className="ProcessOrders-empty-card"></div>
        <div className="ProcessOrders-empty-card"></div>
        <div className="ProcessOrders-empty-card"></div>
        <div className="ProcessOrders-empty-card"></div>
        <div className="ProcessOrders-empty-card"></div>
      </div>
    </div>
  </div>
);

export default ProcessOrders;