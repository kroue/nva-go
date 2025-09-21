import React, { useState } from 'react';
import './Customers.css';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const customers = [
  'Kharlo Edulan',
  'Kriz Cultura',
  'Ariana Palle',
  'Melvin Piolo',
  'Jake Pilapil',
  'Rodel Madrid',
  'Kunja Salamanca',
  'Lloyd Catipay',
];

const orders = [
  {
    customer: 'Kharlo Edulan',
    product: 'High Quality Tarpaulin',
    id: '2025313',
    img: '/images/sample-invite.jpg',
  },
];

const Customers = () => {
  const [selected, setSelected] = useState(customers[0]);

  const order = orders.find(o => o.customer === selected);

  return (
    <div className="Customers-page">
      <div className="Customers-header">Customers</div>
      <div className="Customers-section-title">Customer Profiles</div>
      <div className="Customers-container">
        <div className="Customers-grid">
          <div className="Customers-list">
            {customers.map(name => (
              <div
                key={name}
                className={`Customers-list-item${selected === name ? ' active' : ''}`}
                onClick={() => setSelected(name)}
              >
                <AccountCircleIcon style={{ marginRight: 8 }} />
                {name}
              </div>
            ))}
          </div>
          <div className="Customers-history">
            <div className="Customers-history-title">Order History</div>
            {order && (
              <div className="Customers-history-card">
                <img
                  src={order.img}
                  alt={order.product}
                  className="Customers-history-img"
                />
                <span className="Customers-history-product">{order.product}</span>
                <span className="Customers-history-id">No. {order.id}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;