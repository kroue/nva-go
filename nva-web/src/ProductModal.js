import React from 'react';
import './ProductModal.css';

const modalContent = {
  'TARPAULIN': {
    title: 'ECO SOLVENT TARP',
    qualities: [
      'High Quality Tarp',
      'Middle Quality Tarp',
      'Low Quality Tarp',
      'Budget Low Quality Tarp',
    ],
  },
  'SOLVENT TARP': {
    title: 'SOLVENT TARP',
    qualities: [
      'High Quality Solvent',
      'Middle Quality Solvent',
      'Low Quality Solvent',
    ],
  },
  'VINYL TICKEE STICKER': {
    title: 'VINYL TICKEE STICKER',
    qualities: [
      'Premium',
      'Standard',
    ],
  },
  'VINYL SOFIE STICKER': {
    title: 'VINYL SOFIE STICKER',
    qualities: [
      'Premium',
      'Standard',
    ],
  },
  'CLEAR STICKER': {
    title: 'CLEAR STICKER',
    qualities: [
      'Premium',
      'Standard',
    ],
  },
  'REFLECTIVE STICKER': {
    title: 'REFLECTIVE STICKER',
    qualities: [
      'Premium',
      'Standard',
    ],
  },
};

const ProductModal = ({ open, onClose, productName }) => {
  if (!open || !productName) return null;
  const content = modalContent[productName] || { title: productName, qualities: [] };
  return (
    <div className="ProductModal-backdrop" onClick={onClose}>
      <div className="ProductModal-content" onClick={e => e.stopPropagation()}>
        <div className="ProductModal-title">{content.title}</div>
        <div className="ProductModal-list">
          {content.qualities.map((q, idx) => (
            <div className="ProductModal-row" key={idx}>
              <span className="ProductModal-quality">{q}</span>
              <div className="ProductModal-status-group">
                <button className="ProductModal-status available">Available</button>
                <button className="ProductModal-status limited">Limited Stocks</button>
                <button className="ProductModal-status unavailable">Unavailable</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductModal;