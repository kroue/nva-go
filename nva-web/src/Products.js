import React, { useState, useEffect } from 'react';
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

  const handleCardClick = (product) => {
    // Only allow clicking if product is available or limited
    if (product.status === 'unavailable') return;
    
    // Navigate to OrderForm with product name as query parameter
    navigate('/order-form?product=' + encodeURIComponent(product.name));
  };

  return (
    <div className="Products-page">
      <div className="Products-header">Products</div>
      <div className="Products-section-title">Product Catalog</div>
      <div className="Products-container">
        <div className="Products-grid">
          {products.map((item) => (
            <div
              className={`Products-card ${item.status === 'limited' ? 'limited' : ''} ${item.status === 'unavailable' ? 'unavailable' : ''}`}
              key={item.product_id}
              onClick={() => handleCardClick(item)}
              style={{ 
                cursor: item.status === 'unavailable' ? 'not-allowed' : 'pointer',
                opacity: item.status === 'unavailable' ? 0.5 : 1
              }}
            >
              <img
                src={item.image_url || '/images/default-product.jpg'}
                alt={item.name}
                className="Products-card-img"
              />
              <div className="Products-card-name">
                {item.name}
                {item.status === 'limited' && <span className="limited-tag">LIMITED</span>}
                {item.status === 'unavailable' && <span className="unavailable-tag">UNAVAILABLE</span>}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{item.category}</div>
            </div>
          ))}
        </div>
      </div>
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