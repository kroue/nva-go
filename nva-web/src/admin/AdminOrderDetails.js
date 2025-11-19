import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../SupabaseClient';
import './AdminOrderDetails.css';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import AspectRatioOutlinedIcon from '@mui/icons-material/AspectRatioOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DirectionsWalkOutlinedIcon from '@mui/icons-material/DirectionsWalkOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';

const LAYOUT_FEE = 150;

const useOrder = (id) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          setError('Error fetching order');
          console.error('Error fetching order:', error);
        } else {
          setOrder(data);
        }
      } catch (err) {
        setError('Exception fetching order');
        console.error('Exception fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  return { order, loading, error };
};

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { order, loading, error } = useOrder(id);

  const { subtotal, layoutFee, isWalkIn } = useMemo(() => {
    if (!order) return { subtotal: 0, layoutFee: 0, isWalkIn: false };
    const sub = order.has_file ? order.total : (order.total - LAYOUT_FEE);
    const fee = order.has_file ? 0 : LAYOUT_FEE;
    const walkIn = !order.email || order.order_source === 'walk-in';
    return { subtotal: sub, layoutFee: fee, isWalkIn: walkIn };
  }, [order]);

  if (loading) {
    return (
      <div className="AdminOrderDetails-loading">
        <ReceiptLongOutlinedIcon style={{ fontSize: 64, opacity: 0.3 }} />
        <h2>Loading Order...</h2>
        <p>Please wait while we fetch the order details.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="AdminOrderDetails-error">
        <p>Error: {error}</p>
        <button onClick={() => navigate('/admin/orders')}>Back to Orders</button>
      </div>
    );
  }

  if (!order) return <div>Order not found.</div>;

  return (
    <div className="AdminOrderDetails-page">
      <div className="AdminOrderDetails-header">
        <div className="AdminOrderDetails-header-content">
          <button className="AdminOrderDetails-back-btn" onClick={() => navigate('/admin/orders')}>
            <ArrowBackOutlinedIcon />
          </button>
          <ReceiptLongOutlinedIcon className="AdminOrderDetails-header-icon" />
          <div className="AdminOrderDetails-header-text">
            <h1>Order #{order.id.slice(0, 8)}</h1>
            <p>{order.first_name} {order.last_name}</p>
          </div>
        </div>
        <div className="AdminOrderDetails-header-badges">
          <div className={`status-badge ${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>
            {order.status || 'Pending'}
          </div>
          {isWalkIn && (
            <div className="walkin-badge">
              <DirectionsWalkOutlinedIcon style={{ fontSize: 16 }} />
              <span>Walk-in Order</span>
            </div>
          )}
        </div>
      </div>

      <div className="AdminOrderDetails-container">
        <div className="AdminOrderDetails-layout">
          <div className="AdminOrderDetails-left">
            <div className="detail-section">
              <div className="section-header">
                <PersonOutlineOutlinedIcon className="section-icon" />
                <h3>Customer Information</h3>
              </div>
              <div className="customer-info-grid">
                <div className="info-item">
                  <PersonOutlineOutlinedIcon className="info-icon" />
                  <div>
                    <span className="info-label">Name</span>
                    <span className="info-value">{order.first_name} {order.last_name}</span>
                  </div>
                </div>
                {!isWalkIn && (
                  <>
                    <div className="info-item">
                      <EmailOutlinedIcon className="info-icon" />
                      <div>
                        <span className="info-label">Email</span>
                        <span className="info-value">{order.email}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <PhoneOutlinedIcon className="info-icon" />
                      <div>
                        <span className="info-label">Phone</span>
                        <span className="info-value">{order.phone_number}</span>
                      </div>
                    </div>
                    <div className="info-item full-width">
                      <LocationOnOutlinedIcon className="info-icon" />
                      <div>
                        <span className="info-label">Address</span>
                        <span className="info-value">{order.address}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="detail-section">
              <div className="section-header">
                <InventoryOutlinedIcon className="section-icon" />
                <h3>Order Details</h3>
              </div>
              <div className="order-product-card">
                <h4 className="product-name">
                  {order.product_name ? `${order.product_name} - ${order.variant}` : order.variant}
                </h4>
                <div className="product-details-grid">
                  <div className="product-detail">
                    <AspectRatioOutlinedIcon style={{ fontSize: 18 }} />
                    <span>Size: {order.height && order.width ? `${order.height} × ${order.width}` : 'Custom'}</span>
                  </div>
                  <div className="product-detail">
                    <InventoryOutlinedIcon style={{ fontSize: 18 }} />
                    <span>Quantity: {order.quantity} pcs</span>
                  </div>
                  {order.eyelets && (
                    <div className="product-detail">
                      <span>Eyelets: {order.eyelets}</span>
                    </div>
                  )}
                  <div className="product-detail">
                    <CalendarTodayOutlinedIcon style={{ fontSize: 18 }} />
                    <span>Pickup: {order.pickup_date}</span>
                  </div>
                  <div className="product-detail">
                    <AccessTimeOutlinedIcon style={{ fontSize: 18 }} />
                    <span>Time: {order.pickup_time}</span>
                  </div>
                </div>
              </div>

              {order.instructions && (
                <div className="instructions-card">
                  <div className="instructions-header">
                    <DescriptionOutlinedIcon style={{ fontSize: 18 }} />
                    <span>Special Instructions</span>
                  </div>
                  <p>{order.instructions}</p>
                </div>
              )}

              {order.attached_file && (
                <div className="file-card">
                  <div className="file-header">
                    <AttachFileOutlinedIcon style={{ fontSize: 18 }} />
                    <span>Customer's File</span>
                  </div>
                  <div className="file-content">
                    <span className="file-name">{order.attached_file.split('/').pop()}</span>
                    <button
                      className="file-download-btn"
                      onClick={() => window.open(order.attached_file, '_blank')}
                    >
                      <VisibilityOutlinedIcon style={{ fontSize: 16 }} />
                      View/Download
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="detail-section">
              <div className="order-metadata">
                <div className="metadata-item">
                  <span className="metadata-label">Order ID:</span>
                  <span className="metadata-value">{order.id.slice(0, 8)}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Created:</span>
                  <span className="metadata-value">
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>
                {(order.employee_first_name || order.employee_email) && (
                  <div className="metadata-item">
                    <span className="metadata-label">Processed by:</span>
                    <span className="metadata-value">
                      {order.employee_first_name && order.employee_last_name
                        ? `${order.employee_first_name} ${order.employee_last_name}`
                        : order.employee_email || 'Unknown'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="AdminOrderDetails-right">
            <div className="detail-section">
              <div className="section-header">
                <AttachMoneyOutlinedIcon className="section-icon" />
                <h3>Payment Summary</h3>
              </div>
              <div className="payment-card">
                <div className="payment-row">
                  <span>Subtotal</span>
                  <span>₱{subtotal}</span>
                </div>
                {layoutFee > 0 && (
                  <div className="payment-row">
                    <span>Layout Fee</span>
                    <span>₱{layoutFee}</span>
                  </div>
                )}
                <div className="payment-row total">
                  <strong>Total Amount</strong>
                  <strong>₱{order.total}</strong>
                </div>
              </div>

              {order.payment_proof && (
                <div className="payment-proof">
                  <span className="proof-label">Payment Proof:</span>
                  <a
                    href={order.payment_proof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="proof-link"
                  >
                    <VisibilityOutlinedIcon style={{ fontSize: 16 }} />
                    View Payment Proof
                  </a>
                </div>
              )}
            </div>

            {order.approval_file && (
              <div className="detail-section">
                <div className="section-header">
                  <AttachFileOutlinedIcon className="section-icon" />
                  <h3>Layout File</h3>
                </div>
                <div className="approval-info-row">
                  <span>Approval Status:</span>
                  <span className={`approval-value ${order.approved === 'yes' ? 'approved' : 'pending'}`}>
                    {order.approved === 'yes' ? '✓ Approved' : '⏳ Pending'}
                  </span>
                </div>
                <div className="file-card">
                  <div className="file-content">
                    <span className="file-name">Layout File</span>
                    <button
                      className="file-download-btn"
                      onClick={() => window.open(order.approval_file, '_blank')}
                    >
                      <VisibilityOutlinedIcon style={{ fontSize: 16 }} />
                      View Layout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
