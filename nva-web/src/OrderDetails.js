import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import axios from 'axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

import './OrderDetails.css';
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
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DirectionsWalkOutlinedIcon from '@mui/icons-material/DirectionsWalkOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';

// Constants
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dfejxqixw/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'proofs';
const LAYOUT_FEE = 150;

// Status hierarchy - defines the order of statuses
const STATUS_ORDER = ['Validation', 'Layout Approval', 'Printing', 'For Pickup', 'Finished'];

// Helper function to check if status transition is allowed
const canTransitionTo = (currentStatus, targetStatus) => {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const targetIndex = STATUS_ORDER.indexOf(targetStatus);
  
  // Can't go backwards or skip steps (must be exactly next step or same step)
  return targetIndex <= currentIndex + 1;
};

// Helper function to get required status message
const getRequiredStatusMessage = (targetStatus) => {
  const targetIndex = STATUS_ORDER.indexOf(targetStatus);
  if (targetIndex > 0) {
    return `Order must be in "${STATUS_ORDER[targetIndex - 1]}" status first`;
  }
  return '';
};

// Custom hook for fetching order
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

  return { order, setOrder, loading, error };
};

// Custom hook for employee details
const useEmployee = () => {
  const [employee, setEmployee] = useState({
    email: null,
    firstName: null,
    lastName: null,
  });

  useEffect(() => {
    const getEmployeeDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmployee(prev => ({ ...prev, email: session.user.email }));
          console.log('Employee email set:', session.user.email);

          const { data: emp, error } = await supabase
            .from('employees')
            .select('first_name, last_name')
            .eq('email', session.user.email)
            .single();

          if (!error && emp) {
            setEmployee(prev => ({
              ...prev,
              firstName: emp.first_name,
              lastName: emp.last_name,
            }));
            console.log('Employee details:', emp.first_name, emp.last_name);
          } else {
            console.error('Could not fetch employee details:', error);
            setEmployee(prev => ({
              ...prev,
              firstName: 'Employee',
              lastName: 'Name',
            }));
          }
        }
      } catch (err) {
        console.error('Error getting employee details:', err);
      }
    };

    getEmployeeDetails();
  }, []);

  return employee;
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { order, setOrder, loading, error } = useOrder(id);
  const employee = useEmployee();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Memoized calculations for performance
  const { subtotal, layoutFee, isWalkIn } = useMemo(() => {
    if (!order) return { subtotal: 0, layoutFee: 0, isWalkIn: false };
    const sub = order.has_file ? order.total : (order.total - LAYOUT_FEE);
    const fee = order.has_file ? 0 : LAYOUT_FEE;
    const walkIn = !order.email || order.order_source === 'walk-in';
    return { subtotal: sub, layoutFee: fee, isWalkIn: walkIn };
  }, [order]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      if (fileType !== 'image/jpeg' && fileType !== 'image/png') {
        alert('Only JPEG and PNG files are allowed.');
        e.target.value = ''; // Clear the input
        return;
      }
      setFile(selectedFile);
    }
  };

  // NEW: Walk-in approve -> set status to "Printing"
  const handleWalkInApprove = async () => {
    if (!order) return;
    
    // Check if order is in Layout Approval status
    if (order.status !== 'Layout Approval') {
      alert(`Cannot approve. ${getRequiredStatusMessage('Printing')}`);
      return;
    }
    
    try {
      setUploading(true);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Printing', approved: 'yes' })
        .eq('id', order.id);

      if (error) {
        console.error('Failed to mark as Printing:', error);
        alert('Failed to update order status.');
        setUploading(false);
        return;
      }

      setOrder((prev) => ({ ...prev, status: 'Printing', approved: 'yes' }));
      alert('Order marked as Printing.');
    } catch (e) {
      console.error('Error updating order status:', e);
      alert('Error updating order status.');
    } finally {
      setUploading(false);
    }
  };

  const handleSendApproval = async () => {
    if (!order) return;
    
    // Check if order is in Validation status (payment validated)
    if (order.status !== 'Validation' && order.status !== 'Layout Approval') {
      alert(`Cannot send approval. ${getRequiredStatusMessage('Layout Approval')}`);
      return;
    }
    
    // Do not send approval for walk-in orders (no customer email / walk-in source)
    if (isWalkIn) {
      alert('Approval is not required for walk-in orders.');
      return;
    }
    try {
      setUploading(true);

      let fileUrl = order.approval_file || null;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const { data: uploadRes } = await axios.post(CLOUDINARY_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        fileUrl = uploadRes.secure_url;
      }

      if (!fileUrl) {
        alert('Please select a layout file to send for approval.');
        setUploading(false);
        return;
      }

      // Write approval file + stamp the employee who processed it
      const updatePayload = {
        approval_file: fileUrl,
        approved: 'no',
        status: 'Layout Approval',
        employee_email: employee.email || order.employee_email || null,
        employee_first_name: employee.firstName || order.employee_first_name || null,
        employee_last_name: employee.lastName || order.employee_last_name || null
      };

      const { error: updErr } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (updErr) {
        console.error('Error updating order with approval file:', updErr);
        alert('Failed to update order with approval file.');
        setUploading(false);
        return;
      }

      const messageText = `[APPROVAL_REQUEST]|${order.id}
Order ID: ${order.id}
Product: ${order.product_name || order.variant}
Size: ${order.height && order.width ? `${order.height} × ${order.width}` : 'Custom size'}
Quantity: ${order.quantity} pcs
Total: ₱${order.total}

${order.approval_file ? '⚠️ This is a revised layout. Please review the new version.' : 'Please review and approve the layout:'}
${fileUrl}`;

      const messageData = {
        sender: employee.email,
        receiver: order.email,
        text: messageText,
        chat_id: [employee.email, order.email].sort().join('-'),
        created_at: new Date().toISOString(),
        read: false
      };

      const { error: msgErr } = await supabase.from('messages').insert(messageData);
      if (msgErr) {
        console.error('Error sending approval message:', msgErr);
        alert('Failed to send approval message.');
      }

      // Reflect locally, including employee who processed it
      setOrder((prev) => ({
        ...prev,
        approval_file: fileUrl,
        approved: 'no',
        status: 'Layout Approval',
        employee_email: updatePayload.employee_email,
        employee_first_name: updatePayload.employee_first_name,
        employee_last_name: updatePayload.employee_last_name
      }));
      setFile(null);
      alert('Layout sent for approval.');
    } catch (e) {
      console.error('Error sending approval:', e);
      alert('Error sending approval. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    // Validate status transition
    if (!canTransitionTo(order.status, newStatus)) {
      alert(`Cannot update to ${newStatus}. ${getRequiredStatusMessage(newStatus)}`);
      return;
    }
    
    try {
      setUploading(true);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) {
        console.error('Failed to update status:', error);
        alert('Failed to update order status.');
        return;
      }

      // Send message if status is 'For Pickup'
      if (newStatus === 'For Pickup') {
        if (order.email) {
          const messageText = `[ORDER_READY]|${orderId}
Your order is ready for pickup!

Order ID: ${orderId}
Product: ${order.product_name || order.variant}
Size: ${order.height && order.width ? `${order.height} × ${order.width}` : 'Custom size'}
Quantity: ${order.quantity} pcs

Please come to our store to pick up your order.`;

          const messageData = {
            sender: employee.email,
            receiver: order.email,
            text: messageText,
            chat_id: [employee.email, order.email].sort().join('-'),
            created_at: new Date().toISOString(),
            read: false
          };

          const { error: msgErr } = await supabase.from('messages').insert(messageData);
          if (msgErr) {
            console.error('Error sending ready for pickup message:', msgErr);
          }
        }
      }

      // Send message if status is 'Finished'
      if (newStatus === 'Finished') {
        if (order.email) {
          const messageText = `[PICKUP_READY]|${orderId}
Your order has been completed and picked up. Thank you for your business!

Order ID: ${orderId}
Product: ${order.product_name || order.variant}

This conversation will now be archived.`;

          const chatId = [employee.email, order.email].sort().join('-');
          const messageData = {
            sender: employee.email,
            receiver: order.email,
            text: messageText,
            chat_id: chatId,
            created_at: new Date().toISOString(),
            read: false
          };

          const { error: msgErr } = await supabase.from('messages').insert(messageData);
          if (!msgErr) {
            // Mark all messages in this chat as archived
            const { error: archiveErr } = await supabase
              .from('messages')
              .update({ is_archived: 'true' })
              .eq('chat_id', chatId);
            
            if (archiveErr) {
              console.error('Error archiving messages:', archiveErr);
            } else {
              console.log('Successfully archived messages for chat:', chatId);
            }
          } else {
            console.error('Error sending finished order message:', msgErr);
          }
        }
      }

      setOrder((prev) => ({ ...prev, status: newStatus }));
      alert(`Order status updated to ${newStatus}.`);
    } catch (e) {
      console.error('Error updating order status:', e);
      alert('Error updating order status.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <Header />
        <div className="MainContent">
          <Sidebar />
          <div className="PageContent">
            <div className="OrderDetails-loading">
              <ReceiptLongOutlinedIcon style={{ fontSize: 64, opacity: 0.3 }} />
              <h2>Loading Order...</h2>
              <p>Please wait while we fetch the order details.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <Header />
        <div className="MainContent">
          <Sidebar />
          <div className="PageContent">
            <div className="OrderDetails-error">
              <p>Error: {error}</p>
              <button onClick={() => navigate('/process-orders')}>Back to Orders</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return <div>Order not found.</div>;

  return (
    <div className="App">
      <Header />
      <div className="MainContent">
        <Sidebar />
        <div className="PageContent">
          <div className="OrderDetails-page">
            {/* Header */}
            <div className="OrderDetails-header">
              <div className="OrderDetails-header-content">
                <button className="OrderDetails-back-btn" onClick={() => navigate('/process-orders')}>
                  <ArrowBackOutlinedIcon />
                </button>
                <ReceiptLongOutlinedIcon className="OrderDetails-header-icon" />
                <div className="OrderDetails-header-text">
                  <h1>Order #{order.id.slice(0, 8)}</h1>
                  <p>{order.first_name} {order.last_name}</p>
                </div>
              </div>
              <div className="OrderDetails-header-badges">
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

            {/* Main Content */}
            <div className="OrderDetails-container">
              <div className="OrderDetails-layout">
                {/* Left Column - Customer & Order Info */}
                <div className="OrderDetails-left">
                  {/* Customer Information */}
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

                  {/* Order Details */}
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

                  {/* Order Metadata */}
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

                {/* Right Column - Payment & Actions */}
                <div className="OrderDetails-right">
                  {/* Payment Summary */}
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

                  {/* Approval Section */}
                  <div className="detail-section">
                    <div className="section-header">
                      <CheckCircleOutlineOutlinedIcon className="section-icon" />
                      <h3>Layout Approval</h3>
                    </div>

                    {isWalkIn ? (
                      <div className="walkin-approval-section">
                        <div className="walkin-notice">
                          <DirectionsWalkOutlinedIcon style={{ fontSize: 20 }} />
                          <p>Approval is not required for walk-in orders.</p>
                        </div>
                        <button
                          onClick={handleWalkInApprove}
                          disabled={uploading || order.status !== 'Layout Approval'}
                          className="approve-btn primary"
                          title={order.status !== 'Layout Approval' ? getRequiredStatusMessage('Printing') : ''}
                        >
                          <CheckCircleOutlineOutlinedIcon style={{ fontSize: 18 }} />
                          {order.status === 'Printing' ? 'Already Printing' : 'Mark as Approved'}
                        </button>
                      </div>
                    ) : (
                      <div className="approval-section">
                        <div className="approval-status">
                          <div className="approval-info-row">
                            <span>Status:</span>
                            <span className={`approval-value ${order.approved === 'yes' ? 'approved' : 'pending'}`}>
                              {order.approved === 'yes' ? '✓ Approved' : '⏳ Pending'}
                            </span>
                          </div>
                          {order.approval_file && (
                            <div className="approval-info-row">
                              <span>Current Layout:</span>
                              <a
                                href={order.approval_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="approval-link"
                              >
                                <VisibilityOutlinedIcon style={{ fontSize: 16 }} />
                                View Layout
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="file-upload-section">
                          <label className="file-upload-label">
                            <CloudUploadOutlinedIcon style={{ fontSize: 20 }} />
                            <span>{file ? file.name : 'Choose layout file to upload'}</span>
                            <input
                              type="file"
                              onChange={handleFileChange}
                              accept="image/jpeg,image/png"
                              style={{ display: 'none' }}
                            />
                          </label>

                          <button
                            onClick={handleSendApproval}
                            disabled={uploading || order.approved === 'yes' || (order.status !== 'Validation' && order.status !== 'Layout Approval')}
                            className="approve-btn primary"
                            title={order.status !== 'Validation' && order.status !== 'Layout Approval' ? getRequiredStatusMessage('Layout Approval') : ''}
                          >
                            <CloudUploadOutlinedIcon style={{ fontSize: 18 }} />
                            {uploading
                              ? 'Uploading...'
                              : order.approval_file
                              ? 'Send New Version'
                              : 'Send Layout for Approval'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Update Actions */}
                  <div className="detail-section">
                    <div className="section-header">
                      <LocalShippingOutlinedIcon className="section-icon" />
                      <h3>Update Order Status</h3>
                    </div>
                    <div className="status-actions">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'For Pickup')}
                        disabled={
                          uploading ||
                          order.status === 'For Pickup' ||
                          order.status === 'Finished' ||
                          !canTransitionTo(order.status, 'For Pickup')
                        }
                        className="status-btn pickup"
                        title={!canTransitionTo(order.status, 'For Pickup') ? getRequiredStatusMessage('For Pickup') : ''}
                      >
                        <LocalShippingOutlinedIcon style={{ fontSize: 18 }} />
                        Mark as Ready for Pickup
                      </button>

                      <button
                        onClick={() => updateOrderStatus(order.id, 'Finished')}
                        disabled={uploading || order.status === 'Finished' || !canTransitionTo(order.status, 'Finished')}
                        className="status-btn finished"
                        title={!canTransitionTo(order.status, 'Finished') ? getRequiredStatusMessage('Finished') : ''}
                      >
                        <CheckCircleOutlineOutlinedIcon style={{ fontSize: 18 }} />
                        Mark as Finished
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;