import React, { useState, useEffect } from 'react';
import { supabase } from './SupabaseClient';
import './ValidatePayment.css';

const ValidatePayment = () => {
  const [payments, setPayments] = useState([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('payment_proof', 'is', null)
        .order('created_at', { ascending: false });
      if (data) setPayments(data);
    };
    fetchPayments();
  }, []);

  const handleValidate = async (orderId) => {
    await supabase
      .from('orders')
      .update({ status: 'Validation' })
      .eq('id', orderId);
    // Optionally remove from list or refresh
    setPayments(payments.filter(p => p.id !== orderId));
    setSelected(0);
  };

  const handleDecline = async (orderId) => {
    await supabase
      .from('orders')
      .update({ status: 'Declined' })
      .eq('id', orderId);
    setPayments(payments.filter(p => p.id !== orderId));
    setSelected(0);
  };

  if (payments.length === 0) {
    return (
      <div className="ValidatePayment-page">
        <div className="ValidatePayment-header">Process Order</div>
        <div className="ValidatePayment-section-title">Validate Payment</div>
        <div className="ValidatePayment-container">
          <div style={{ padding: 32, color: '#888' }}>No payments to validate.</div>
        </div>
      </div>
    );
  }

  const selectedPayment = payments[selected];

  return (
    <div className="ValidatePayment-page">
      <div className="ValidatePayment-header">Process Order</div>
      <div className="ValidatePayment-section-title">Validate Payment</div>
      <div className="ValidatePayment-container">
        <div className="ValidatePayment-grid">
          <div className="ValidatePayment-list">
            {payments.map((p, idx) => (
              <div
                className={`ValidatePayment-card${selected === idx ? ' active' : ''}`}
                key={p.id}
                onClick={() => setSelected(idx)}
              >
                <div>
                  <b>{p.first_name} {p.last_name}</b> sent proof of Payment
                  <span className="ValidatePayment-card-id">No. {p.id.slice(0, 8)}</span>
                </div>
                <div className="ValidatePayment-card-file">
                  {p.payment_proof ? p.payment_proof.split('/').pop() : 'No file'}
                  <span className="ValidatePayment-card-method">Gcash</span>
                </div>
              </div>
            ))}
          </div>
          <div className="ValidatePayment-preview">
            <div className="ValidatePayment-preview-title">Proof of Payment</div>
            {selectedPayment.payment_proof ? (
              <img
                src={selectedPayment.payment_proof}
                alt="Proof"
                className="ValidatePayment-preview-img"
                style={{ maxWidth: 320, maxHeight: 320, borderRadius: 10, border: '1.5px solid #252b55', background: '#fff' }}
              />
            ) : (
              <div style={{ color: '#888' }}>No payment proof uploaded.</div>
            )}
            <div className="ValidatePayment-preview-actions">
              <button
                className="ValidatePayment-btn validate"
                onClick={() => handleValidate(selectedPayment.id)}
              >
                Validate Payment
              </button>
              <button
                className="ValidatePayment-btn decline"
                onClick={() => handleDecline(selectedPayment.id)}
              >
                Decline Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidatePayment;