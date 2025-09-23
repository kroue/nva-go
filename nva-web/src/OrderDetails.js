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
  const [employeeFirstName, setEmployeeFirstName] = useState(null);
  const [employeeLastName, setEmployeeLastName] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('Error fetching order:', error);
        } else {
          setOrder(data);
        }
      } catch (error) {
        console.error('Exception fetching order:', error);
      }
    };

    const getEmployeeDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmployeeEmail(session.user.email);
          console.log('Employee email set:', session.user.email);
          
          const { data: employee, error } = await supabase
            .from('employees')
            .select('first_name, last_name')
            .eq('email', session.user.email)
            .single();
          
          if (!error && employee) {
            setEmployeeFirstName(employee.first_name);
            setEmployeeLastName(employee.last_name);
            console.log('Employee details:', employee.first_name, employee.last_name);
          } else {
            console.error('Could not fetch employee details:', error);
            setEmployeeFirstName('Employee');
            setEmployeeLastName('Name');
          }
        }
      } catch (error) {
        console.error('Error getting employee details:', error);
      }
    };

    fetchOrder();
    getEmployeeDetails();
  }, [id]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSendApproval = async () => {
    if (!file) return alert('Please select a file.');
    if (!order) return alert('Order not loaded.');
    
    setUploading(true);

    console.log('Sending as employee:', employeeEmail, employeeFirstName, employeeLastName);

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const res = await axios.post(CLOUDINARY_URL, formData);
      const fileUrl = res.data.secure_url;

      // Update order in Supabase with employee assignment including names
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          approval_file: fileUrl,
          employee_email: employeeEmail,
          employee_first_name: employeeFirstName,
          employee_last_name: employeeLastName
        })
        .eq('id', id);

      if (updateError) throw updateError;
      
      // Create approval message
      const messageText = `[APPROVAL_REQUEST]|${order.id}
Product: ${order.variant}
Size: ${order.height && order.width ? `${order.height} × ${order.width}` : 'Custom size'}
Quantity: ${order.quantity} pcs
Total: ₱${order.total}

${order.approval_file ? '⚠️ This is a revised layout. Please review the new version.' : 'Please review and approve the layout:'}
${fileUrl}`;

      // Create message with employee as sender
      const messageData = {
        sender: employeeEmail,
        receiver: order.email,
        text: messageText,
        chat_id: [employeeEmail, order.email].sort().join('-'),
        created_at: new Date().toISOString(),
        read: false
      };

      console.log('Sending message:', messageData);

      const { error: messageError } = await supabase
        .from('messages')
        .insert(messageData);

      if (messageError) {
        console.error('Message error:', messageError);
        throw messageError;
      }

      alert(order.approval_file ? 'New approval version sent!' : 'Approval sent!');
      
      // Update local state to reflect the changes
      setOrder({ 
        ...order, 
        approval_file: fileUrl,
        employee_email: employeeEmail,
        employee_first_name: employeeFirstName,
        employee_last_name: employeeLastName
      });
      
      // Clear the file input
      setFile(null);
      
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  if (!order) return <div>Loading...</div>;

  // Calculate subtotal and layout fee
  const subtotal = order.has_file ? order.total : (order.total - 150);
  const layoutFee = order.has_file ? 0 : 150;

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
                  <span className="OrderDetails-status-badge">{order.status || 'Pending'}</span>
                </div>
                <div className="OrderDetails-product-title">{order.variant}</div>
                
                {/* Show attached file if exists */}
                {order.attached_file && (
                  <div className="OrderDetails-preview-img">
                    {order.attached_file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <img src={order.attached_file} alt="Order Preview" style={{ maxHeight: 200, maxWidth: 440 }} />
                    ) : (
                      <div>📄 {order.attached_file.split('/').pop()}</div>
                    )}
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