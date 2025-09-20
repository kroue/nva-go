import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import axios from 'axios';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import './OrderDetails.css';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dfejxqixw/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'proofs';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', id).single();
      setOrder(data);
    };

    const getEmployeeEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setEmployeeEmail(session.user.email);
        console.log('Employee email set:', session.user.email); // Debug log
      }
    };

    fetchOrder();
    getEmployeeEmail();
  }, [id]);

  const getFilenameFromUrl = (url) => {
    if (!url) return 'No file selected';
    return url.split('/').pop();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && !selectedFile.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    setFile(selectedFile);
  };

  const handleSendApproval = async () => {
    if (!file) return alert('Please select a file.');
    if (!employeeEmail) {
      alert('Employee email not found - please login again');
      return;
    }
    setUploading(true);

    console.log('Sending as employee:', employeeEmail); // Debug log

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const res = await axios.post(CLOUDINARY_URL, formData);
      const fileUrl = res.data.secure_url;

      // Update order in Supabase
      const { error: updateError } = await supabase
        .from('orders')
        .update({ approval_file: fileUrl })
        .eq('id', id);

      if (updateError) throw updateError;
      
      // Create approval message
      const messageText = `[APPROVAL_REQUEST]|${order.id}
Product: ${order.variant}
Size: ${order.height} × ${order.width}
Quantity: ${order.quantity} pcs
Total: ₱${order.total}

${order.approval_file ? '⚠️ This is a revised layout. Please review the new version.' : 'Please review and approve the layout:'}
${fileUrl}`;

      // Create message with employee as sender
      const messageData = {
        sender: employeeEmail,
        receiver: order.email,
        text: messageText,
        chat_id: [employeeEmail, order.email].sort().join('-'), // Sort to ensure consistent chat_id
        created_at: new Date().toISOString()
      };

      console.log('Sending message:', messageData); // Debug log

      const { error: messageError } = await supabase
        .from('messages')
        .insert(messageData);

      if (messageError) {
        console.error('Message error:', messageError);
        throw messageError;
      }

      alert(order.approval_file ? 'New approval version sent!' : 'Approval sent!');
      setOrder({ ...order, approval_file: fileUrl });
    } catch (err) {
      console.error('Full error:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePickupReady = async () => {
    try {
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'For Pickup'
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Create pickup notification message
      const pickupMessage = {
        chat_id: [employeeEmail, order.email].sort().join('-'),
        sender: employeeEmail,
        receiver: order.email,
        text: `[PICKUP_READY]|${order.id}
🎉 Your order is ready for pickup!

Order Details:
Order #${order.id.slice(0, 7)}
Product: ${order.variant}
Quantity: ${order.quantity} pcs

Please pick up your order at:
Date: ${order.pickup_date}
Time: ${order.pickup_time}

Thank you for choosing NVA Go!`,
        created_at: new Date().toISOString()
      };

      const { error: messageError } = await supabase
        .from('messages')
        .insert(pickupMessage);

      if (messageError) throw messageError;

      // Update local state
      setOrder({ ...order, status: 'For Pickup' });
      alert('Pickup notification sent!');

    } catch (err) {
      console.error('Error:', err);
      alert('Failed to send pickup notification: ' + err.message);
    }
  };

  const handleFinishOrder = async () => {
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'Finished'
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Create finish notification message
      const finishMessage = {
        chat_id: [employeeEmail, order.email].sort().join('-'),
        sender: employeeEmail,
        receiver: order.email,
        text: `[ORDER_FINISHED]|${order.id}
✅ Order completed and picked up!

Order #${order.id.slice(0, 7)}
Thank you for choosing NVA Go!`,
        created_at: new Date().toISOString()
      };

      const { error: messageError } = await supabase
        .from('messages')
        .insert(finishMessage);

      if (messageError) throw messageError;

      setOrder({ ...order, status: 'Finished' });
      alert('Order marked as finished!');

    } catch (err) {
      console.error('Error:', err);
      alert('Failed to finish order: ' + err.message);
    }
  };

  if (!order) return <div>Loading...</div>;

  return (
    <div className="App">
      <Header />
      <div className="MainContent">
        <Sidebar />
        <div className="PageContent">
          <div className="OrderDetails-root">
            <div className="OrderDetails-header">Order Details</div>
            <div className="OrderDetails-main">
              <div className="OrderDetails-left">
                <div className="OrderDetails-customer-row">
                  <span className="OrderDetails-customer-name">
                    {order.first_name} {order.last_name}
                  </span>
                  <span className="OrderDetails-status-badge">{order.status}</span>
                </div>
                <div className="OrderDetails-product-title">{order.variant}</div>
                <div className="OrderDetails-preview-img">
                  {order.attached_file ? (
                    <img 
                      src={order.attached_file} 
                      alt="Order Preview" 
                      style={{ 
                        maxHeight: 240, 
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: 8
                      }} 
                    />
                  ) : (
                    <div style={{ color: '#666' }}>No preview available</div>
                  )}
                  <span style={{ marginLeft: 8 }}>Order Preview</span>
                </div>
                <div className="OrderDetails-card">
                  <div className="OrderDetails-card-title">{order.variant}</div>
                  <div className="OrderDetails-card-desc">Description of Tarpaulin</div>
                  <div className="OrderDetails-card-pickup">
                    Pickup:<br />
                    Date: {order.pickup_date}<br />
                    Time: {order.pickup_time}
                  </div>
                  <div className="OrderDetails-card-id">No. {order.id ? order.id.slice(0, 7) : ''}</div>
                </div>
              </div>
              <div className="OrderDetails-right">
                <div className="OrderDetails-summary-title">Order Summary</div>
                <div className="OrderDetails-preview-section">
                  <div className="OrderDetails-file-preview">
                    <span className="OrderDetails-file-label">Preview File:</span>
                    <span className="OrderDetails-filename">
                      {file ? file.name : getFilenameFromUrl(order.approval_file)}
                    </span>
                  </div>
                </div>
                
                {/* Show attached file if exists */}
                {order.attached_file && (
                  <div className="OrderDetails-attachment">
                    <div className="OrderDetails-attachment-label">Attached File:</div>
                    <div className="OrderDetails-attachment-name">
                      {order.attached_file.split('/').pop()}
                    </div>
                    <a 
                      href={order.attached_file} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="OrderDetails-attachment-link"
                    >
                      View File
                    </a>
                  </div>
                )}

                {/* Show file preview if it's an image */}
                {order.attached_file?.match(/\.(jpg|jpeg|png|gif)$/i) && (
                  <div className="OrderDetails-preview">
                    <img 
                      src={order.attached_file}
                      alt="Attached file preview"
                      className="OrderDetails-preview-img"
                    />
                    <span className="OrderDetails-preview-label">
                      Attached File Preview
                    </span>
                  </div>
                )}
                
                <div className="OrderDetails-summary-info">
                  <span>Size</span>
                  <span>{order.height && order.width ? `${order.height} × ${order.width}` : '---'}</span>
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
                  value={order.instructions || ''}
                  disabled
                />
                <div className="OrderDetails-summary-totals">
                  <div>
                    <span>Subtotal</span>
                    <span>₱ {order.total - 150}</span>
                  </div>
                  <div>
                    <span>Layout</span>
                    <span>₱ 150</span>
                  </div>
                </div>
                <div className="OrderDetails-summary-total">
                  <span>TOTAL</span>
                  <span>₱ {order.total}</span>
                </div>
                <div style={{ marginTop: 18 }}>
                  <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept="image/*"
                    className="OrderDetails-file-input"
                  />
                  <button
                    onClick={handleSendApproval}
                    disabled={uploading}
                    className="OrderDetails-send-button"
                  >
                    {uploading ? 'Uploading...' : 'Send Approval'}
                  </button>
                  {order.status === 'Printing' && (
                    <button
                      onClick={handlePickupReady}
                      className="OrderDetails-pickup-button"
                    >
                      Pickup Ready
                    </button>
                  )}
                  {order.status === 'For Pickup' && (
                    <button
                      onClick={handleFinishOrder}
                      className="OrderDetails-finish-button"
                    >
                      Finish Order
                    </button>
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