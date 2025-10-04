import React, { useState, useEffect } from 'react';
import { supabase } from './SupabaseClient';
import './ValidatePayment.css';

// Replace toNumber with a currency-safe parser
const toNumber = (v, d = 0) => {
  if (v === null || v === undefined) return d;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  try {
    const cleaned = String(v).replace(/[^0-9.-]/g, '');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : d;
  } catch {
    return d;
  }
};

const getMonthText = (date = new Date()) =>
  date.toLocaleString('en-US', { month: 'long' });

// Map an orders row -> sales row using your actual columns
const buildSaleFromOrder = (o) => {
  const qty = Math.max(1, toNumber(o.quantity, 1));
  const total = toNumber(o.total, 0); // take price from orders.total
  const unit = qty > 0 ? Number((total / qty).toFixed(2)) : 0;
  const subtotal = Number(total.toFixed(2)); // same as total, no layout fee column on orders
  const layoutFee = 0;

  const width = toNumber(o.width, 0);
  const height = toNumber(o.height, 0);
  const variantDims = (width || height) ? `${width}x${height}` : null;

  const saleDate = new Date();

  return {
    order_id: o.id,
    customer_email: o.email ?? 'unknown@local',
    customer_name: [o.first_name, o.last_name].filter(Boolean).join(' ') || 'Customer',
    product_name: o.variant || 'Order',       // use orders.variant as product name
    variant: variantDims,
    quantity: qty,
    unit_price: unit,
    subtotal,
    layout_fee: layoutFee,
    total_amount: subtotal,
    sale_date: saleDate.toISOString(),
    sale_month: getMonthText(saleDate),
    sale_year: saleDate.getFullYear(),
    employee_email: o.employee_email ?? null,
    employee_name: [o.employee_first_name, o.employee_last_name].filter(Boolean).join(' ') || null,
    order_source: o.order_source || 'web',
    status: 'completed'
  };
};

const ValidatePayment = () => {
  const [payments, setPayments] = useState([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .not('payment_proof', 'is', null)
        .order('created_at', { ascending: false });
      if (data) setPayments(data);
    };
    fetchPayments();
  }, []);

  // Replace handleValidate with a version that fetches the fresh order and inserts a sale
  const handleValidate = async (orderId) => {
    if (!orderId) return;

    // 1) Update order status to Layout Approval
    const { error: updErr } = await supabase
      .from('orders')
      .update({ status: 'Layout Approval' })
      .eq('id', orderId);

    if (updErr) {
      console.error('Update order status failed:', updErr);
      return;
    }

    // 2) Fetch the fresh order row from DB
    const { data: orderRow, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchErr || !orderRow) {
      console.error('Fetch order failed:', fetchErr);
      return;
    }

    // 3) Skip if sale already exists for this order
    const { data: existing, error: existErr } = await supabase
      .from('sales')
      .select('id')
      .eq('order_id', orderId)
      .limit(1);

    if (existErr) {
      console.error('Check existing sale failed:', existErr);
      return;
    }

    if (!existing || existing.length === 0) {
      const saleRow = buildSaleFromOrder(orderRow);

      const { error: insErr } = await supabase.from('sales').insert(saleRow);
      if (insErr) {
        console.error('Insert sale failed:', insErr, saleRow);
      }
    }

    // 4) Reflect locally (do not remove item)
    setPayments((prev) =>
      prev.map((p) => (p.id === orderId ? { ...p, status: 'Layout Approval' } : p))
    );
  };

  const handleDecline = async (orderId) => {
    await supabase.from('orders').update({ status: 'Declined' }).eq('id', orderId);
    setPayments((prev) => prev.filter((p) => p.id !== orderId));
    setSelected(0);
  };

  if (payments.length === 0) {
    return (
      <div className="ValidatePayment-page">
        <div className="Orders-header">Orders</div>
        <div className="ValidatePayment-section-title">Validate Payment</div>
        <div className="ValidatePayment-container">
          <div style={{ padding: 32, color: '#888' }}>No payments to validate.</div>
        </div>
      </div>
    );
  }

  const selectedPayment = payments[selected] || {};
  const isValidated = selectedPayment?.status === 'Layout Approval';

  return (
    <div className="ValidatePayment-page">
      <div className="Orders-header">Orders</div>
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
                  <span className="ValidatePayment-card-id">No. {String(p.id).slice(0, 8)}</span>
                </div>
                <div className="ValidatePayment-card-file">
                  {p.payment_proof ? p.payment_proof.split('/').pop() : 'No file'}
                  <span className="ValidatePayment-card-method">Gcash</span>
                  <span
                    className={`ValidatePayment-card-status ${
                      p.status === 'Layout Approval'
                        ? 'validated'
                        : p.status === 'Declined'
                        ? 'declined'
                        : 'pending'
                    }`}
                    style={{
                      marginLeft: 8,
                      padding: '2px 6px',
                      borderRadius: 6,
                      fontSize: 12,
                      border: '1px solid #ccc',
                      background:
                        p.status === 'Layout Approval'
                          ? '#e6ffef'
                          : p.status === 'Declined'
                          ? '#ffe9e9'
                          : '#f2f3f5',
                      color:
                        p.status === 'Layout Approval'
                          ? '#1a7f37'
                          : p.status === 'Declined'
                          ? '#b42318'
                          : '#444'
                    }}
                  >
                    {p.status === 'Layout Approval'
                      ? 'Validated'
                      : p.status === 'Declined'
                      ? 'Declined'
                      : 'Pending'}
                  </span>
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
                disabled={isValidated}
                title={isValidated ? 'Already validated' : 'Validate this payment'}
              >
                {isValidated ? 'Validated' : 'Validate Payment'}
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