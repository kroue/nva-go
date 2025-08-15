import React, { useState } from 'react';
import './Products.css';
import ProductModal from './ProductModal';

const products = [
  { name: 'TARPAULIN', img: '/images/tarpaulin.jpg' },
  { name: 'SOLVENT TARP', img: '/images/solvent-tarp.jpg' },
  { name: 'VINYL TICKEE STICKER', img: '/images/vinyl-tickee.jpg' },
  { name: 'VINYL SOFIE STICKER', img: '/images/vinyl-sofie.jpg' },
  { name: 'CLEAR STICKER', img: '/images/clear-sticker.jpg' },
  { name: 'REFLECTIVE STICKER', img: '/images/reflective-sticker.jpg' },
];

const Products = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');

  const handleCardClick = (name) => {
    setSelectedProduct(name);
    setModalOpen(true);
  };

  return (
    <div className="Products-page">
      <div className="Products-header">Products</div>
      <div className="Products-section-title">Product Catalog</div>
      <div className="Products-container">
        <div className="Products-grid">
          {products.map((item, idx) => (
            <div
              className="Products-card"
              key={idx}
              onClick={() => handleCardClick(item.name)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={item.img}
                alt={item.name}
                className="Products-card-img"
              />
              <div className="Products-card-name">{item.name}</div>
            </div>
          ))}
        </div>
      </div>
      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        productName={selectedProduct}
      />
    </div>
  );
};

export default Products;