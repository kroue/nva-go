import React, { useState, useEffect } from 'react';
import { supabase } from '../SupabaseClient';
import ProductModal from './ProductModal';

const AdminProducts = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Fetch products from the database
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('product_id,name,category,image_url');
      if (!error && data) {
        setProducts(data);
      }
    };
    fetchProducts();
  }, []);

  const handleCardClick = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <div
      className="Products-page"
      style={{
        minHeight: '100vh',
        boxSizing: 'border-box',
        paddingBottom: 120 // Increase this to match or exceed your footer height
      }}
    >
      <div className="Products-header">Products</div>
      <div className="Products-section-title">Product Catalog</div>
      <div className="Products-container" style={{ paddingBottom: 32 }}>
        <div className="Products-grid">
          {products.map((item) => (
            <div
              className="Products-card"
              key={item.product_id}
              onClick={() => handleCardClick(item)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={item.image_url || '/images/default-product.jpg'}
                alt={item.name}
                className="Products-card-img"
              />
              <div className="Products-card-name">{item.name}</div>
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

export default AdminProducts;