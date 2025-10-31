import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import axios from 'axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import './OrderDetails.css';

// Constants
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dfejxqixw/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'proofs';
const LAYOUT_FEE = 150;

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
    setFile(e.target.files[0]);
  };

  // NEW: Walk-in approve -> set status to "Printing"
  const handleWalkInApprove = async () => {
    if (!order) return;
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!order) return <div>Order not found.</div>;

  return (
    <div className="App">
      <Header />
      <div className="MainContent">
        <Sidebar />
        <div className="PageContent">
          <div className="OrderDetails-root">
            <div className="OrderDetails-header">
              Order Details
              {isWalkIn && (
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 12,
                    padding: '4px 8px',
                    borderRadius: 12,
                    background: '#FFF7CC',
                    color: '#8A6D3B',
                    border: '1px solid #F3E59A',
                    verticalAlign: 'middle',
                    fontWeight: 600
                  }}
                >
                  Walk-in Order
                </span>
              )}
            </div>
            <div className="OrderDetails-main">
              <div className="OrderDetails-left">
                <div className="OrderDetails-customer-row">
                  <span className="OrderDetails-customer-name">
                    {order.first_name} {order.last_name}
                  </span>
                  <span className="OrderDetails-status-badge">{order.status || 'Pending'}</span>
                </div>
                <div className="OrderDetails-product-title">{order.product_name ? `${order.product_name} - ${order.variant}` : order.variant}</div>
                
                {/* Show attached file if exists */}
                {order.attached_file && (
                  <div className="OrderDetails-preview-img">
                    <div>📄 {order.attached_file.split('/').pop()}</div>
                    <button
                      onClick={() => window.open(order.attached_file, '_blank')}
                      style={{
                        marginLeft: 8,
                        background: '#252b55',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      Download
                    </button>
                    <span style={{ marginLeft: 8 }}>Customer's File</span>
                  </div>
                )}
                
                <div className="OrderDetails-card">
                  <div className="OrderDetails-card-title">{order.variant}</div>
                  <div className="OrderDetails-card-desc">High Quality Printing Service</div>
                  <div className="OrderDetails-card-pickup">
                    Pickup:<br />
                    Date: {order.pickup_date}<br />
                    Time: {order.pickup_time}
                  </div>
                  <div className="OrderDetails-card-info">
                    Order Created: {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}<br />
                    {(order.employee_first_name || order.employee_email) && (
                      <>Processed by: {order.employee_first_name && order.employee_last_name 
                        ? `${order.employee_first_name} ${order.employee_last_name}`
                        : order.employee_email || 'Unknown'}<br /></>
                    )}
                    Order ID: {order.id ? order.id.slice(0, 8) : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="OrderDetails-right">
                <div className="OrderDetails-summary-title">Order Summary</div>
                <input
                  className="OrderDetails-summary-file"
                  value={order.attached_file ? order.attached_file.split('/').pop() : 'No file attached'}
                  disabled
                />
                <div className="OrderDetails-summary-info">
                  <span>Size</span>
                  <span>{order.height && order.width ? `${order.height} × ${order.width}` : 'Custom'}</span>
                </div>
                <div className="OrderDetails-summary-info">
                  <span>No. of pcs</span>
                  <span>{order.quantity} pcs</span>
                </div>
                {order.eyelets && (
                  <div className="OrderDetails-summary-info">
                    <span>Eyelets</span>
                    <span>{order.eyelets}</span>
                  </div>
                )}
                <div className="OrderDetails-summary-info">
                  <span>Quality</span>
                  <span>{order.variant}</span>
                </div>
                <div className="OrderDetails-summary-info" style={{ marginBottom: 6 }}>
                  <span>Instructions</span>
                </div>
                <textarea
                  className="OrderDetails-summary-instructions"
                  value={order.instructions || 'No special instructions'}
                  disabled
                />
                <div className="OrderDetails-summary-totals">
                  <div>
                    <span>Subtotal</span>
                    <span>₱ {subtotal}</span>
                  </div>
                  {layoutFee > 0 && (
                    <div>
                      <span>Layout Fee</span>
                      <span>₱ {layoutFee}</span>
                    </div>
                  )}
                </div>
                <div className="OrderDetails-summary-total">
                  <span>TOTAL</span>
                  <span>₱ {order.total}</span>
                </div>
                
                {/* Payment proof section */}
                {order.payment_proof && (
                  <div style={{ marginTop: 18 }}>
                    <div><b>Payment Proof:</b></div>
                    <a href={order.payment_proof} target="_blank" rel="noopener noreferrer">
                      View Payment Proof
                    </a>
                  </div>
                )}
                
                {/* Approval section */}
                <div style={{ marginTop: 18 }}>
                  {(!order.email || order.order_source === 'walk-in') ? (
                    <div>
                      <div style={{ fontStyle: 'italic', color: '#667085', marginBottom: 8 }}>
                        Approval is not required for walk-in orders.
                      </div>
                      <button
                        onClick={handleWalkInApprove}
                        disabled={uploading || order.status === 'Printing'}
                        style={{
                          background: uploading || order.status === 'Printing' ? '#ccc' : '#252b55',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 18px',
                          fontWeight: 600,
                          fontSize: 16,
                          cursor: uploading || order.status === 'Printing' ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {order.status === 'Printing' ? 'Already Printing' : 'Approved'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <b>Approved:</b> {order.approved || 'no'}
                      </div>
                      <div>
                        <b>Approval File:</b>{' '}
                        {order.approval_file ? (
                          <a href={order.approval_file} target="_blank" rel="noopener noreferrer">View Layout</a>
                        ) : 'None'}
                      </div>
                      <input 
                        type="file" 
                        onChange={handleFileChange} 
                        style={{ marginTop: 8 }}
                        accept="image/*,.pdf"
                      />
                      <button
                        onClick={handleSendApproval}
                        disabled={uploading || order.approved === 'yes'}
                        style={{
                          marginTop: 8,
                          background: uploading || order.approved === 'yes' ? '#ccc' : '#252b55',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 18px',
                          fontWeight: 600,
                          fontSize: 16,
                          cursor: uploading || order.approved === 'yes' ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {uploading ? 'Uploading...' : 
                         order.approval_file ? 'Send New Version' : 'Send Layout for Approval'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderDetails;