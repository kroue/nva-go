import React, { useState } from 'react';
import './ValidatePayment.css';

const payments = [
  {
    id: '2025313',
    name: 'Kriz Cultura',
    file: 'Screenshot(102).jpg',
    method: 'Gcash',
    img: '/proof.png', // Replace with your image path
  },
  {
    id: '2025313',
    name: 'Ariana Palle',
    file: 'Screenshot(102).jpg',
    method: 'Gcash',
    img: '/proof.png',
  },
  {
    id: '2025313',
    name: 'Melvin Piolo',
    file: 'Screenshot(102).jpg',
    method: 'Gcash',
    img: '/proof.png',
  },
  {
    id: '2025313',
    name: 'Jake Pilapil',
    file: 'Screenshot(102).jpg',
    method: 'Gcash',
    img: '/proof.png',
  },
];

const ValidatePayment = () => {
  const [selected, setSelected] = useState(0);

  return (
    <div className="ValidatePayment-page">
      <div className="ValidatePayment-header">Process Order</div>
      <div className="ValidatePayment-section-title">Validate Payment</div>
      <div className="ValidatePayment-container">
        <div className="ValidatePayment-grid">
          <div className="ValidatePayment-list">
            {payments.map((p, idx) => (
              <div
                className={`ValidatePayment-card${selected === idx ? ' active' : ''}`}
                key={idx}
                onClick={() => setSelected(idx)}
              >
                <div>
                  <b>{p.name}</b> sent proof of Payment
                  <span className="ValidatePayment-card-id">No. {p.id}</span>
                </div>
                <div className="ValidatePayment-card-file">
                  {p.file}
                  <span className="ValidatePayment-card-method">{p.method}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="ValidatePayment-preview">
            <div className="ValidatePayment-preview-title">Proof of Payment</div>
            <img
              src={payments[selected].img}
              alt="Proof"
              className="ValidatePayment-preview-img"
            />
            <div className="ValidatePayment-preview-actions">
              <button className="ValidatePayment-btn validate">Validate Payment</button>
              <button className="ValidatePayment-btn decline">Decline Payment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidatePayment;