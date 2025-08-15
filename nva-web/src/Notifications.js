import React, { useState } from 'react';
import './Notifications.css';

const newNotifications = [
  'New message from customer regarding Order #1058.',
  'Payment proof uploaded for Order #1058. Please validate payment.',
  'Order #1053 status updated to "In Progress" by Employee Aljohn.',
];

const earlierNotifications = [
  'New order assigned: Order #1058. Please review and process.',
  'Order #1057 status changed to "Approved" by Admin Nicholson.',
  'Product "Tarpaulin Print 3×5" status updated to "Available" by Admin.',
];

const Notifications = () => {
  const [tab, setTab] = useState('all');

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
          Unread
        </button>
      </div>
      <div className="Notifications-section">
        <div className="Notifications-section-title">New</div>
        {newNotifications.map((msg, idx) => (
          <div className="Notifications-item" key={idx}>
            <span>{msg}</span>
            <span className="Notifications-dot"></span>
          </div>
        ))}
      </div>
      <div className="Notifications-section">
        <div className="Notifications-section-title">Earlier</div>
        {earlierNotifications.map((msg, idx) => (
          <div className="Notifications-item" key={idx}>
            <span>{msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;