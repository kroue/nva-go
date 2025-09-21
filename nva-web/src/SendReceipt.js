import React from 'react';
import './SendReceipt.css';

const order = {
  id: '2025313',
  name: 'Kharlo Edulan',
  product: 'High Quality Tarpaulin',
  status: 'Printing',
  pickup: 'May 19, 2025',
  time: '1:00 PM',
  size: '5 × 3',
  pcs: 1,
  eyelets: 4,
  quality: 'High Quality',
  subtotal: 229,
  layout: 150,
  total: 379,
  instructions: '',
};

const SendReceipt = () => (
  <div className="SendReceipt-page">
    <div className="Orders-header">Orders</div>
    <div className="SendReceipt-section-title">Order Details</div>
    <div className="SendReceipt-container">
      <div className="SendReceipt-grid">
        <div className="SendReceipt-details">
          <div className="SendReceipt-details-header">
            <span className="SendReceipt-details-name">{order.name}</span>
            <span className="SendReceipt-details-status">{order.status}</span>
          </div>
          <div className="SendReceipt-details-product">{order.product}</div>
          <img
            src="/sample-invite.jpg"
            alt="Order Preview"
            className="SendReceipt-details-img"
          />
          <div className="SendReceipt-details-card">
            <div className="SendReceipt-details-product">{order.product}</div>
            <div className="SendReceipt-details-desc">Description of Tarpaulin</div>
            <div className="SendReceipt-details-pickup">
              Pickup:<br />
              Date: {order.pickup}<br />
              Time: {order.time}
            </div>
            <div className="SendReceipt-details-id">No. {order.id}</div>
          </div>
        </div>
        <div className="SendReceipt-summary">
          <div className="SendReceipt-summary-title">Order Summary</div>
          <input
            className="SendReceipt-summary-file"
            type="text"
            value="No file attached"
            disabled
          />
          <div className="SendReceipt-summary-info">
            <div>Size <span>{order.size}</span></div>
            <div>No. of pcs <span>{order.pcs} pcs</span></div>
            <div>Eyelets <span>{order.eyelets}</span></div>
            <div>Quality <span>{order.quality}</span></div>
          </div>
          <div className="SendReceipt-summary-instructions">
            Instructions
            <textarea disabled value={order.instructions} />
          </div>
          <div className="SendReceipt-summary-totals">
            <div>Subtotal <span>₱ {order.subtotal}</span></div>
            <div>Layout <span>₱ {order.layout}</span></div>
            <div className="SendReceipt-summary-total">TOTAL <span>₱ {order.total}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SendReceipt;