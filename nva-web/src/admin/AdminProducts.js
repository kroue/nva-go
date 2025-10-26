import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';

const pillBase = {
  padding: '8px 14px',
  borderRadius: 999,
  border: '1.5px solid #252b55',
  background: '#fff',
  color: '#252b55',
  fontWeight: 700,
  cursor: 'pointer',
};
const pillActive = {
  ...pillBase,
  background: '#252b55',
  color: '#fff',
};
const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '1.5fr 1fr',
  alignItems: 'center',
  gap: 15,
  padding: '12px 6px',
  borderBottom: '1px solid #f1f1f4',
};
const nameStyle = { fontSize: 15, fontWeight: 700, color: '#22263f', textAlign: 'left', textTransform: 'lower'};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

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

  return (
    <div style={{ padding: 12 }}>
      <div
         style={{
            background: '#d9d9d9',
            color: '#252b55',
            fontSize: 15,
            fontWeight: 800,
            padding: '10px 18px',
            borderRadius: 8,
            marginBottom: 10,
            textTransform: 'uppercase',
            textAlign: 'left',
         }}
      >
        Manage Products
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #eef0f4',
          borderRadius: 12,
          padding: 12,
        }}
      >
        {products.map((p) => (
          <div key={p.product_id} style={rowStyle}>
            <div style={nameStyle}>{p.name}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={p.status === 'available' ? pillActive : pillBase}
                onClick={() => updateStatus(p.product_id, 'available')}
                disabled={!!updatingId}
              >
                Available
              </button>
              <button
                style={p.status === 'limited' ? pillActive : pillBase}
                onClick={() => updateStatus(p.product_id, 'limited')}
                disabled={!!updatingId}
              >
                Limited Stocks
              </button>
              <button
                style={p.status === 'unavailable' ? pillActive : pillBase}
                onClick={() => updateStatus(p.product_id, 'unavailable')}
                disabled={!!updatingId}
              >
                Unavailable
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div style={{ padding: 16, color: '#667085' }}>No products found.</div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;