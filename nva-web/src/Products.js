import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './Products.css';
import ProductModal from './ProductModal';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';

const Products = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct] = useState(null);
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
      <div className="Products-header">
        <div className="Products-header-content">
          <InventoryOutlinedIcon className="Products-header-icon" />
          <div className="Products-header-text">
            <h1>Product Catalog</h1>
            <p>Browse our available printing products and services</p>
          </div>
        </div>
        <div className="Products-stats">
          <div className="stat-badge">
            <span className="stat-number">{grouped.avail.length + 1}</span>
            <span className="stat-label">Available</span>
          </div>
          <div className="stat-badge">
            <span className="stat-number">{grouped.unavail.length}</span>
            <span className="stat-label">Unavailable</span>
          </div>
        </div>
      </div>

      <div className="Products-container">
        {/* Available Products Section */}
        <div className="Products-section-header">
          <CheckCircleOutlineOutlinedIcon style={{ fontSize: 20 }} />
          <span>Available Products</span>
        </div>

        <div className="Products-grid">
          {grouped.avail.map((item) => (
            <div
              className={`Products-card ${item.status === 'limited' ? 'limited' : ''}`}
              key={item.product_id}
              onClick={() => handleCardClick(item)}
            >
              <div className="Products-card-image-wrapper">
                <img
                  src={item.image_url || '/images/default-product.jpg'}
                  alt={item.name}
                  className="Products-card-img"
                />
                {item.status === 'limited' && (
                  <div className="status-badge limited-badge">
                    <WarningAmberOutlinedIcon style={{ fontSize: 14 }} />
                    <span>Limited Stock</span>
                  </div>
                )}
              </div>
              <div className="Products-card-content">
                <div className="Products-card-name">{item.name}</div>
                <div className="Products-card-category">
                  <CategoryOutlinedIcon style={{ fontSize: 14, marginRight: 4 }} />
                  {item.category}
                </div>
              </div>
            </div>
          ))}

          {/* Other Products Card */}
          <div
            className="Products-card special-card"
            onClick={() => navigate('/order-form?product=Other Products')}
          >
            <div className="Products-card-image-wrapper">
              <div className="Products-card-img-placeholder">
                <AddCircleOutlineOutlinedIcon style={{ fontSize: 64, opacity: 0.3 }} />
              </div>
            </div>
            <div className="Products-card-content">
              <div className="Products-card-name">Other Products</div>
              <div className="Products-card-category">
                <CategoryOutlinedIcon style={{ fontSize: 14, marginRight: 4 }} />
                Custom Order
              </div>
            </div>
          </div>
        </div>

        {/* Unavailable Products Section */}
        {grouped.unavail.length > 0 && (
          <>
            <div className="Products-section-header unavailable-header">
              <BlockOutlinedIcon style={{ fontSize: 20 }} />
              <span>Unavailable Products</span>
            </div>

            <div className="Products-grid">
              {grouped.unavail.map((item) => (
                <div
                  className="Products-card unavailable"
                  key={item.product_id}
                >
                  <div className="Products-card-image-wrapper">
                    <img
                      src={item.image_url || '/images/default-product.jpg'}
                      alt={item.name}
                      className="Products-card-img"
                    />
                    <div className="status-badge unavailable-badge">
                      <BlockOutlinedIcon style={{ fontSize: 14 }} />
                      <span>Unavailable</span>
                    </div>
                  </div>
                  <div className="Products-card-content">
                    <div className="Products-card-name">{item.name}</div>
                    <div className="Products-card-category">
                      <CategoryOutlinedIcon style={{ fontSize: 14, marginRight: 4 }} />
                      {item.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
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
