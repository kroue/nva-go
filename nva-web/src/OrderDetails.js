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

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', id).single();
      setOrder(data);
    };
    fetchOrder();
  }, [id]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSendApproval = async () => {
    if (!file) return alert('Please select a file.');
    setUploading(true);

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await axios.post(CLOUDINARY_URL, formData);
      const fileUrl = res.data.secure_url;

      // Update order in Supabase
      await supabase
        .from('orders')
        .update({ approval_file: fileUrl, approved: 'yes' })
        .eq('id', id);

      alert('Approval sent!');
      setOrder({ ...order, approval_file: fileUrl, approved: 'yes' });
    } catch (err) {
      alert('Upload failed');
    }
    setUploading(false);
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
                  <img src={order.image_url || ''} alt="Order Preview" style={{ maxHeight: 38, maxWidth: 440 }} />
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
                <input
                  className="OrderDetails-summary-file"
                  value={order.has_file ? 'file.pdf' : 'No file attached'}
                  disabled
                />
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
                  <div>
                    <b>Approved:</b> {order.approved}
                  </div>
                  <div>
                    <b>Approval File:</b>{' '}
                    {order.approval_file ? (
                      <a href={order.approval_file} target="_blank" rel="noopener noreferrer">View</a>
                    ) : 'None'}
                  </div>
                  <input type="file" onChange={handleFileChange} style={{ marginTop: 8 }} />
                  <button
                    onClick={handleSendApproval}
                    disabled={uploading || order.approved === 'yes'}
                    style={{
                      marginTop: 8,
                      background: '#252b55',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 18px',
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: uploading || order.approved === 'yes' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {uploading ? 'Uploading...' : 'Send Approval'}
                  </button>
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