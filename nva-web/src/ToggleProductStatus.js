import React, { useState, useEffect } from 'react';
import { supabase } from './SupabaseClient';
import './ToggleProductStatus.css';

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
        // Update local state
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
        // Update local variants state
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
      <div className="ToggleProductStatus-loading">Loading...</div>
    );
  }

  return (
    <div className="ToggleProductStatus-page">
      <div className="ToggleProductStatus-header">Product Status</div>
      <div className="ToggleProductStatus-container">
        {products.map((product) => (
          <div
            key={product.product_id}
            className={`ToggleProductStatus-item ${getStatusClass(product.status || 'available')}`}
            onClick={() => product.status !== 'unavailable' ? handleProductClick(product) : null}
          >
            <div className="ToggleProductStatus-product-info">
              <img
                src={product.image_url || '/images/default-product.jpg'}
                alt={product.name}
                className="ToggleProductStatus-product-image"
              />
              <div className="ToggleProductStatus-product-details">
                <h3 className="ToggleProductStatus-product-name">
                  {product.name}
                  {product.status === 'limited' && <span className="status-tag limited">LIMITED</span>}
                  {product.status === 'unavailable' && <span className="status-tag unavailable">UNAVAILABLE</span>}
                </h3>
                <p className="ToggleProductStatus-product-category">{product.category}</p>
              </div>
            </div>
            <div className="ToggleProductStatus-status-buttons">
              <button
                className={`status-btn ${product.status === 'available' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  updateProductStatus(product.product_id, 'available');
                }}
              >
                Available
              </button>
              <button
                className={`status-btn ${product.status === 'limited' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  updateProductStatus(product.product_id, 'limited');
                }}
              >
                Limited Stocks
              </button>
              <button
                className={`status-btn ${product.status === 'unavailable' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  updateProductStatus(product.product_id, 'unavailable');
                }}
              >
                Unavailable
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Variant Modal */}
      {modalOpen && selectedProduct && (
        <div className="ToggleProductStatus-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="ToggleProductStatus-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ToggleProductStatus-modal-header">
              <h2>{selectedProduct.name} - Variants</h2>
              <button className="close-btn" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="ToggleProductStatus-modal-content">
              {variants.length === 0 ? (
                <p>No variants found for this product.</p>
              ) : (
                variants.map((variant) => (
                  <div key={variant.variant_id} className="variant-item">
                    <div className="variant-info">
                      <h4>{variant.description || variant.size || 'Variant'}</h4>
                      <p>Retail: ₱{variant.retail_price} | Wholesale: ₱{variant.wholesale_price}</p>
                    </div>
                    <div className="variant-status-buttons">
                      <button
                        className={`variant-status-btn ${variant.status === 'available' ? 'active' : ''}`}
                        onClick={() => updateVariantStatus(variant.variant_id, 'available')}
                      >
                        Available
                      </button>
                      <button
                        className={`variant-status-btn ${variant.status === 'limited' ? 'active' : ''}`}
                        onClick={() => updateVariantStatus(variant.variant_id, 'limited')}
                      >
                        Limited
                      </button>
                      <button
                        className={`variant-status-btn ${variant.status === 'unavailable' ? 'active' : ''}`}
                        onClick={() => updateVariantStatus(variant.variant_id, 'unavailable')}
                      >
                        Unavailable
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToggleProductStatus;