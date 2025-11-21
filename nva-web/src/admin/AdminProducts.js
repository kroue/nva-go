import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import './AdminProducts.css';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ProductModal from './ProductModal';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('product_id,name,status')
        .order('name', { ascending: true });
      if (!error && data) setProducts(data);
    };
    fetchProducts();
  }, []);

  const updateStatus = async (product_id, status) => {
    setUpdatingId(product_id);
    const { error } = await supabase.from('products').update({ status }).eq('product_id', product_id);
    if (error) {
      console.error('Update product status failed:', error);
      alert('Failed to update product status.');
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.product_id === product_id ? { ...p, status } : p))
      );
    }
    setUpdatingId(null);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'status-available';
      case 'limited': return 'status-limited';
      case 'unavailable': return 'status-unavailable';
      default: return '';
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  return (
    <div className="AdminProducts">
      <div className="AdminProducts-title">
        <Inventory2OutlinedIcon style={{ fontSize: 28 }} />
        Manage Products
      </div>

      <div className="AdminProducts-card">
        <div className="AdminProducts-list">
          {products.map((p) => (
            <div key={p.product_id} className="product-row">
              <div className="product-info" onClick={() => handleProductClick(p)} style={{ cursor: 'pointer' }}>
                <div className="product-name-wrapper">
                  <div className="product-name">{p.name}</div>
                  <SettingsOutlinedIcon className="product-settings-icon" />
                </div>
              </div>
              <div className={`product-status-badge ${getStatusColor(p.status)}`}>
                {p.status || 'unknown'}
              </div>
              <div className="product-actions">
                <button
                  className={`status-btn ${p.status === 'available' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStatus(p.product_id, 'available');
                  }}
                  disabled={!!updatingId}
                >
                  Available
                </button>
                <button
                  className={`status-btn ${p.status === 'limited' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStatus(p.product_id, 'limited');
                  }}
                  disabled={!!updatingId}
                >
                  Limited
                </button>
                <button
                  className={`status-btn ${p.status === 'unavailable' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStatus(p.product_id, 'unavailable');
                  }}
                  disabled={!!updatingId}
                >
                  Unavailable
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="products-empty">
              <Inventory2OutlinedIcon style={{ fontSize: 48, opacity: 0.3 }} />
              <p>No products found</p>
            </div>
          )}
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