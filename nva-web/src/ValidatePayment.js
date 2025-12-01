import React, { useState, useEffect } from 'react';
import { supabase } from './SupabaseClient';
import './ValidatePayment.css';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import ZoomInOutlinedIcon from '@mui/icons-material/ZoomInOutlined';

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
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      // Fetch all orders with payment proof, including validated ones
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

    // 1) Update order status to Layout Approval (payment validated, ready for layout)
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

    // 4) Update the local state to mark as validated
    setPayments((prev) =>
      prev.map((p) => (p.id === orderId ? { ...p, status: 'Layout Approval' } : p))
    );
  };

  const handleDecline = async (orderId) => {
    // First, get the order details to find the customer email
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('email, first_name, last_name, id')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      console.error('Error fetching order for decline:', fetchError);
      return;
    }

    // Update order status to Denied (was Cancelled/Declined)
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'Denied' })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return;
    }

    // Send automatic denial message to customer
    try {
      // Get current user (admin/employee) session
      const { data: { session } } = await supabase.auth.getSession();
      const adminEmail = session?.user?.email;

      if (adminEmail && order.email) {
        // Create a chat_id for this conversation
        const chatId = [adminEmail, order.email].sort().join('_');

        const declineMessage = {
          chat_id: chatId,
          sender: adminEmail,
          receiver: order.email,
          text: `⚠️ Your payment for order #${String(orderId).slice(0, 8)} has been denied. Please order again and upload the correct payment receipt.`,
          created_at: new Date().toISOString(),
          read: false
        };

        const { error: messageError } = await supabase
          .from('messages')
          .insert(declineMessage);

        if (messageError) {
          console.error('Error sending decline message:', messageError);
        }
      }
    } catch (err) {
      console.error('Exception sending decline message:', err);
    }
    
    // Update the local state to mark as denied
    setPayments((prev) =>
      prev.map((p) => (p.id === orderId ? { ...p, status: 'Denied' } : p))
    );
  };

  const openImageModal = () => {
    if (selectedPayment.payment_proof) {
      setImageModalOpen(true);
    }
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
  };

  if (payments.length === 0) {
    return (
      <div className="ValidatePayment-page">
        <div className="ValidatePayment-header">
          <div className="ValidatePayment-header-content">
            <VerifiedOutlinedIcon className="ValidatePayment-header-icon" />
            <div className="ValidatePayment-header-text">
              <h1>Validate Payment</h1>
              <p>Review and approve payment submissions</p>
            </div>
          </div>
        </div>
        <div className="ValidatePayment-container">
          <div className="ValidatePayment-empty">
            <VerifiedOutlinedIcon style={{ fontSize: 64, opacity: 0.3 }} />
            <p>No payments to validate</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedPayment = payments[selected] || {};
  const isValidated = selectedPayment?.status === 'Layout Approval';

  return (
    <div className="ValidatePayment-page">
      <div className="ValidatePayment-header">
        <div className="ValidatePayment-header-content">
          <VerifiedOutlinedIcon className="ValidatePayment-header-icon" />
          <div className="ValidatePayment-header-text">
            <h1>Validate Payment</h1>
            <p>Review and approve payment submissions</p>
          </div>
        </div>
        <div className="ValidatePayment-stats">
          <div className="stat-badge">
            <span className="stat-number">{payments.filter(p => p.status !== 'Layout Approval' && p.status !== 'Denied' && p.status !== 'Printing' && p.status !== 'For Pickup' && p.status !== 'Finished').length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-badge">
            <span className="stat-number">{payments.filter(p => p.status === 'Layout Approval' || p.status === 'Printing' || p.status === 'For Pickup' || p.status === 'Finished').length}</span>
            <span className="stat-label">Validated</span>
          </div>
        </div>
      </div>

      <div className="ValidatePayment-container">
        <div className="ValidatePayment-grid">
          <div className="ValidatePayment-list">
            <h3 className="list-title">Payment Submissions</h3>
            {payments.map((p, idx) => (
              <div
                className={`ValidatePayment-card${selected === idx ? ' active' : ''} ${
                  p.status === 'Layout Approval' || p.status === 'Printing' || p.status === 'For Pickup' || p.status === 'Finished' ? 'validated' : p.status === 'Denied' ? 'denied' : ''
                }`}
                key={p.id}
                onClick={() => setSelected(idx)}
              >
                {/* Denied tag */}
                {p.status === 'Denied' && (
                  <div className="deny-tag">Denied</div>
                )}
                <div className="card-header">
                  <div className="card-customer">
                    <PersonOutlineOutlinedIcon className="card-icon" />
                    <div>
                      <strong>{p.first_name} {p.last_name}</strong>
                      <span className="card-order-id">#{String(p.id).slice(0, 8)}</span>
                    </div>
                  </div>
                  <div className={`status-badge ${
                    p.status === 'Layout Approval' || p.status === 'Printing' || p.status === 'For Pickup' || p.status === 'Finished' ? 'success' : p.status === 'Denied' ? 'error' : 'pending'
                  }`}>
                    {p.status === 'Layout Approval' || p.status === 'Printing' || p.status === 'For Pickup' || p.status === 'Finished' ? (
                      <>
                        <CheckCircleOutlineOutlinedIcon style={{ fontSize: 14 }} />
                        Validated
                      </>
                    ) : p.status === 'Denied' ? (
                      <>
                        <CancelOutlinedIcon style={{ fontSize: 14 }} />
                        Denied
                      </>
                     ) : (
                       'Pending'
                     )}
                  </div>
                </div>
                <div className="card-details">
                  <div className="detail-item">
                    <AttachFileOutlinedIcon className="detail-icon" />
                    <span>{p.payment_proof ? p.payment_proof.split('/').pop() : 'No file'}</span>
                  </div>
                  <div className="detail-item">
                    <AccountBalanceWalletOutlinedIcon className="detail-icon" />
                    <span>GCash</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="ValidatePayment-preview">
            <div className="preview-header">
              <ImageOutlinedIcon className="preview-icon" />
              <h3>Payment Proof</h3>
            </div>
            
            <div className="preview-content">
              {selectedPayment.payment_proof ? (
                <div className="preview-image-wrapper" onClick={openImageModal}>
                  <img
                    src={selectedPayment.payment_proof}
                    alt="Payment Proof"
                    className="ValidatePayment-preview-img"
                  />
                  <div className="image-overlay">
                    <ZoomInOutlinedIcon className="zoom-icon" />
                    <span>Click to view full size</span>
                  </div>
                </div>
              ) : (
                <div className="preview-empty">
                  <ImageOutlinedIcon style={{ fontSize: 48, opacity: 0.3 }} />
                  <p>No payment proof uploaded</p>
                </div>
              )}
            </div>

            <div className="preview-info">
              <div className="info-row">
                <PersonOutlineOutlinedIcon className="info-icon" />
                <div>
                  <span className="info-label">Customer</span>
                  <span className="info-value">{selectedPayment.first_name} {selectedPayment.last_name}</span>
                </div>
              </div>
              <div className="info-row">
                <AttachFileOutlinedIcon className="info-icon" />
                <div>
                  <span className="info-label">Order ID</span>
                  <span className="info-value">#{String(selectedPayment.id || '').slice(0, 8)}</span>
                </div>
              </div>
            </div>

            <div className="ValidatePayment-preview-actions">
              <button
                className="action-btn validate"
                onClick={() => handleValidate(selectedPayment.id)}
                disabled={selectedPayment.status === 'Layout Approval' || selectedPayment.status === 'Printing' || selectedPayment.status === 'For Pickup' || selectedPayment.status === 'Finished' || selectedPayment.status === 'Cancelled' || selectedPayment.status === 'Denied'}
              >
                <CheckCircleOutlineOutlinedIcon style={{ fontSize: 18 }} />
                {selectedPayment.status === 'Layout Approval' || selectedPayment.status === 'Printing' || selectedPayment.status === 'For Pickup' || selectedPayment.status === 'Finished' ? 'Already Validated' : 'Validate Payment'}
              </button>
              <button
                className="action-btn decline"
                onClick={() => handleDecline(selectedPayment.id)}
                disabled={selectedPayment.status === 'Denied' || selectedPayment.status === 'Layout Approval' || selectedPayment.status === 'Printing' || selectedPayment.status === 'For Pickup' || selectedPayment.status === 'Finished' || selectedPayment.status === 'Cancelled'}
              >
                <CancelOutlinedIcon style={{ fontSize: 18 }} />
                Decline Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="modal-backdrop" />
          <button className="modal-close" onClick={closeImageModal}>
            <CloseOutlinedIcon />
          </button>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPayment.payment_proof}
              alt="Payment Proof Full View"
              className="modal-image"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidatePayment;