import React, { useState, useEffect } from 'react';
import { supabase } from './SupabaseClient';
import './ToggleProductStatus.css';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';

const ToggleProductStatus = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('product_id, name, category, image_url, status')
        .order('name');
      
      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const fetchVariants = async (productId) => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId);
      
      if (!error && data) {
        setVariants(data);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    }
  };

  const updateProductStatus = async (productId, newStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('product_id', productId);

      if (!error) {
        setProducts(products.map(product => 
          product.product_id === productId 
            ? { ...product, status: newStatus }
            : product
        ));
      } else {
        console.error('Error updating product status:', error);
      }
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const updateVariantStatus = async (variantId, newStatus) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ status: newStatus })
        .eq('variant_id', variantId);

      if (!error) {
        setVariants(variants.map(variant => 
          variant.variant_id === variantId 
            ? { ...variant, status: newStatus }
            : variant
        ));
      } else {
        console.error('Error updating variant status:', error);
      }
    } catch (error) {
      console.error('Error updating variant status:', error);
    }
  };

  const handleProductClick = async (product) => {
    setSelectedProduct(product);
    await fetchVariants(product.product_id);
    setModalOpen(true);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'available': return 'available';
      case 'limited': return 'limited';
      case 'unavailable': return 'unavailable';
      default: return 'available';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available';
      case 'limited': return 'Limited Stocks';
      case 'unavailable': return 'Unavailable';
      default: return 'Available';
    }
  };

  if (loading) {
    return (
      <div className="ToggleProductStatus-page">
        <div className="ToggleProductStatus-loading">
          <InventoryOutlinedIcon style={{ fontSize: 64, opacity: 0.3 }} />
          <h2>Loading Products...</h2>
          <p>Please wait while we fetch the product information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ToggleProductStatus-page">
      <div className="ToggleProductStatus-header">
        <div className="ToggleProductStatus-header-content">
          <ToggleOnOutlinedIcon className="ToggleProductStatus-header-icon" />
          <div className="ToggleProductStatus-header-text">
            <h1>Product Status Management</h1>
            <p>Manage product and variant availability</p>
          </div>
        </div>
        <div className="ToggleProductStatus-stats">
          <div className="stat-badge">
            <span className="stat-number">{products.filter(p => p.status === 'available').length}</span>
            <span className="stat-label">Available</span>
          </div>
          <div className="stat-badge">
            <span className="stat-number">{products.filter(p => p.status === 'limited').length}</span>
            <span className="stat-label">Limited</span>
          </div>
          <div className="stat-badge">
            <span className="stat-number">{products.filter(p => p.status === 'unavailable').length}</span>
            <span className="stat-label">Unavailable</span>
          </div>
        </div>
      </div>

      <div className="ToggleProductStatus-container">
        <div className="ToggleProductStatus-grid">
          {products.map((product) => (
            <div
              key={product.product_id}
              className={`ToggleProductStatus-card ${product.status || 'available'}`}
              onClick={() => handleProductClick(product)}
            >
              <div className="product-card-header">
                <div className="product-image-wrapper">
                  <img
                    src={product.image_url || '/images/default-product.jpg'}
                    alt={product.name}
                    className="product-image"
                  />
                  {product.status === 'limited' && (
                    <div className="status-badge-overlay limited">
                      <WarningAmberOutlinedIcon style={{ fontSize: 14 }} />
                      <span>Limited</span>
                    </div>
                  )}
                  {product.status === 'unavailable' && (
                    <div className="status-badge-overlay unavailable">
                      <BlockOutlinedIcon style={{ fontSize: 14 }} />
                      <span>Unavailable</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="product-card-content">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-category">
                  <CategoryOutlinedIcon style={{ fontSize: 14, marginRight: 4 }} />
                  {product.category}
                </div>
              </div>

              <div className="product-status-buttons">
                <button
                  className={`status-btn available ${product.status === 'available' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateProductStatus(product.product_id, 'available');
                  }}
                >
                  <CheckCircleOutlineOutlinedIcon style={{ fontSize: 16 }} />
                  <span>Available</span>
                </button>
                <button
                  className={`status-btn limited ${product.status === 'limited' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateProductStatus(product.product_id, 'limited');
                  }}
                >
                  <WarningAmberOutlinedIcon style={{ fontSize: 16 }} />
                  <span>Limited</span>
                </button>
                <button
                  className={`status-btn unavailable ${product.status === 'unavailable' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateProductStatus(product.product_id, 'unavailable');
                  }}
                >
                  <BlockOutlinedIcon style={{ fontSize: 16 }} />
                  <span>Unavailable</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variant Modal */}
      {modalOpen && selectedProduct && (
        <div className="ToggleProductStatus-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="ToggleProductStatus-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ToggleProductStatus-modal-header">
              <div className="modal-header-content">
                <InventoryOutlinedIcon style={{ fontSize: 24, color: '#667eea' }} />
                <h2>{selectedProduct.name} - Variants</h2>
              </div>
              <button className="close-btn" onClick={() => setModalOpen(false)}>
                <CloseOutlinedIcon />
              </button>
            </div>
            <div className="ToggleProductStatus-modal-content">
              {variants.length === 0 ? (
                <div className="no-variants">
                  <InventoryOutlinedIcon style={{ fontSize: 48, opacity: 0.3 }} />
                  <p>No variants found for this product.</p>
                </div>
              ) : (
                <div className="variants-list">
                  {variants.map((variant) => (
                    <div key={variant.variant_id} className="variant-card">
                      <div className="variant-header">
                        <div className="variant-info">
                          <h4>{variant.description || variant.size || 'Variant'}</h4>
                          <div className="variant-prices">
                            <span className="price-item">
                              <AttachMoneyOutlinedIcon style={{ fontSize: 14 }} />
                              Retail: ₱{variant.retail_price}
                            </span>
                            <span className="price-divider">|</span>
                            <span className="price-item">
                              <AttachMoneyOutlinedIcon style={{ fontSize: 14 }} />
                              Wholesale: ₱{variant.wholesale_price}
                            </span>
                          </div>
                        </div>
                        {variant.status === 'limited' && (
                          <div className="variant-status-badge limited">
                            <WarningAmberOutlinedIcon style={{ fontSize: 12 }} />
                            Limited
                          </div>
                        )}
                        {variant.status === 'unavailable' && (
                          <div className="variant-status-badge unavailable">
                            <BlockOutlinedIcon style={{ fontSize: 12 }} />
                            Unavailable
                          </div>
                        )}
                      </div>
                      <div className="variant-status-buttons">
                        <button
                          className={`variant-status-btn available ${variant.status === 'available' ? 'active' : ''}`}
                          onClick={() => updateVariantStatus(variant.variant_id, 'available')}
                        >
                          <CheckCircleOutlineOutlinedIcon style={{ fontSize: 14 }} />
                          Available
                        </button>
                        <button
                          className={`variant-status-btn limited ${variant.status === 'limited' ? 'active' : ''}`}
                          onClick={() => updateVariantStatus(variant.variant_id, 'limited')}
                        >
                          <WarningAmberOutlinedIcon style={{ fontSize: 14 }} />
                          Limited
                        </button>
                        <button
                          className={`variant-status-btn unavailable ${variant.status === 'unavailable' ? 'active' : ''}`}
                          onClick={() => updateVariantStatus(variant.variant_id, 'unavailable')}
                        >
                          <BlockOutlinedIcon style={{ fontSize: 14 }} />
                          Unavailable
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToggleProductStatus;