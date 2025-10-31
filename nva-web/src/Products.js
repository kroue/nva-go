import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './Products.css';
import ProductModal from './ProductModal';

const Products = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Fetch ALL products from the database (including unavailable ones)
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('product_id,name,category,image_url,status');
      if (!error && data) {
        setProducts(data);
      }
    };
    fetchProducts();
  }, []);

  // Group for display: available/limited first, unavailable below
  const grouped = useMemo(() => {
    const avail = [];
    const unavail = [];
    for (const p of products) {
      if (p.status === 'unavailable') unavail.push(p);
      else avail.push(p);
    }
    // Optional: sort by name for consistent order
    avail.sort((a, b) => a.name.localeCompare(b.name));
    unavail.sort((a, b) => a.name.localeCompare(b.name));
    return { avail, unavail };
  }, [products]);

  const handleCardClick = (product) => {
    if (product.status === 'unavailable') return; // disable
    navigate('/order-form?product=' + encodeURIComponent(product.name));
  };

  return (
    <div className="Products-page">
      <div className="Products-header">Products</div>
      <div className="Products-section-title">Product Catalog</div>

      {/* Available and Limited Stocks */}
      <div className="Products-container">
        <div className="Products-grid">
          {grouped.avail.map((item) => (
            <div
              className={`Products-card ${item.status === 'limited' ? 'limited' : ''}`}
              key={item.product_id}
              onClick={() => handleCardClick(item)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={item.image_url || '/images/default-product.jpg'}
                alt={item.name}
                className="Products-card-img"
              />
              <div className="Products-card-name">
                {item.name}
                {item.status === 'limited' && <span className="limited-tag">LIMITED</span>}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{item.category}</div>
            </div>
          ))}
          {/* Other Products Card */}
          <div
            className="Products-card"
            onClick={() => navigate('/order-form?product=Other Products')}
            style={{ cursor: 'pointer' }}
          >
            <img
              src="/images/default-product.jpg"
              alt="Other Products"
              className="Products-card-img"
            />
            <div className="Products-card-name">Other Products</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Custom Order</div>
          </div>
        </div>
      </div>

      {/* Unavailable section below, not clickable */}
      {grouped.unavail.length > 0 && (
        <>
          <div className="Products-section-title" style={{ marginTop: 8 }}>
            Unavailable
          </div>
          <div className="Products-container">
            <div className="Products-grid">
              {grouped.unavail.map((item) => (
                <div
                  className="Products-card unavailable"
                  key={item.product_id}
                  style={{ cursor: 'not-allowed', opacity: 0.5 }}
                >
                  <img
                    src={item.image_url || '/images/default-product.jpg'}
                    alt={item.name}
                    className="Products-card-img"
                  />
                  <div className="Products-card-name">
                    {item.name}
                    <span className="unavailable-tag">UNAVAILABLE</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{item.category}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        productId={selectedProduct?.product_id}
        productName={selectedProduct?.name}
      />
    </div>
  );
};

export default Products;
