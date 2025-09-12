import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import './ProductModal.css';

const ProductModal = ({ open, onClose, productId, productName }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !productId) return;
    setLoading(true);
    supabase
      .from('product_variants')
      .select('description,retail_price,wholesale_price,size')
      .eq('product_id', productId)
      .then(({ data, error }) => {
        setVariants(data || []);
        setLoading(false);
      });
  }, [open, productId]);

  if (!open || !productId) return null;

  return (
    <div className="ProductModal-backdrop" onClick={onClose}>
      <div className="ProductModal-content" onClick={e => e.stopPropagation()}>
        <div className="ProductModal-title">{productName}</div>
        <div className="ProductModal-list">
          {loading && <div>Loading variants...</div>}
          {!loading && variants.length === 0 && <div>No variants found.</div>}
          {!loading && variants.map((variant, idx) => (
            <div className="ProductModal-row" key={idx}>
              <span className="ProductModal-quality">{variant.description} ({variant.size})</span>
              <span className="ProductModal-price">
                Retail: ₱{variant.retail_price} | Wholesale: ₱{variant.wholesale_price}
              </span>
              {/* You can add selection logic here if needed */}
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