import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './SendReceipt.css';

const SendReceipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(id || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState(null);
  const [employeeFirstName, setEmployeeFirstName] = useState(null);
  const [employeeLastName, setEmployeeLastName] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [showOrderSelect, setShowOrderSelect] = useState(!id);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log('Fetching all orders...');
        
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
        } else {
          console.log('Orders fetched:', data?.length);
          setOrders(data || []);
        }
      } catch (error) {
        console.error('Exception fetching orders:', error);
      }
    };

    const getEmployeeDetails = async () => {
      try {
        console.log('Getting employee details...');
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmployeeEmail(session.user.email);
          console.log('Employee email:', session.user.email);
          
          const { data: employee, error } = await supabase
            .from('employees')
            .select('first_name, last_name')
            .eq('email', session.user.email)
            .single();
          
          if (!error && employee) {
            setEmployeeFirstName(employee.first_name);
            setEmployeeLastName(employee.last_name);
            console.log('Employee details:', employee);
          }
        }
      } catch (error) {
        console.error('Error getting employee details:', error);
      }
    };

    const fetchCustomers = async () => {
      try {
        console.log('Fetching customers...');
        
        const { data, error } = await supabase
          .from('customers')
          .select('email, first_name, last_name, phone_number')
          .order('first_name', { ascending: true });

        if (error) {
          console.error('Error fetching customers:', error);
        } else {
          console.log('Customers fetched:', data?.length);
          setCustomers(data || []);
        }
      } catch (error) {
        console.error('Exception fetching customers:', error);
      }
    };

    fetchOrders();
    getEmployeeDetails();
    fetchCustomers();
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!selectedOrderId) {
        setOrder(null);
        return;
      }

      try {
        console.log('Fetching order with ID:', selectedOrderId);
        
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', selectedOrderId)
          .single();

        if (error) {
          console.error('Error fetching order:', error);
          alert('Order not found: ' + error.message);
          setOrder(null);
          return;
        }

        console.log('Order fetched:', data);
        setOrder(data);
        setSelectedCustomer(data.email);
        setShowOrderSelect(false);
        
      } catch (error) {
        console.error('Exception fetching order:', error);
        alert('Failed to fetch order');
        setOrder(null);
      }
    };

    if (selectedOrderId) {
      fetchOrder();
    }
  }, [selectedOrderId]);

  const handleOrderSelect = (orderId) => {
    setSelectedOrderId(orderId);
    navigate(`/send-receipt/${orderId}`, { replace: true });
  };

  // FIXED: Simpler print function that should work
  const handlePrint = () => {
    console.log('Print button clicked');
    
    if (!order) {
      alert('No order to print');
      return;
    }

    try {
      const subtotal = order.has_file ? order.total : (order.total - 150);
      const layoutFee = order.has_file ? 0 : 150;

      // Create print content as a simple string
      const printHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${order.id.slice(0, 8)}</title>
  <style>
    @page { size: A4; margin: 0.5in; }
    body { font-family: Arial; font-size: 12px; color: black; margin: 0; padding: 20px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
    .company h1 { font-size: 20px; margin: 0 0 8px 0; }
    .company p { font-size: 10px; margin: 2px 0; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { font-size: 18px; margin: 0 0 8px 0; }
    .invoice-info p { font-size: 10px; margin: 2px 0; }
    .content { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; margin-bottom: 20px; }
    .section { margin-bottom: 15px; }
    .section h3 { font-size: 12px; margin: 0 0 5px 0; border-bottom: 1px solid black; padding-bottom: 2px; }
    .info-row { display: flex; justify-content: space-between; font-size: 10px; padding: 2px 0; border-bottom: 1px dotted #999; }
    .info-row:last-child { border-bottom: none; }
    .customer p { font-size: 10px; margin: 2px 0; }
    .payment { background: #f5f5f5; padding: 10px; border: 1px solid #999; }
    .total-row { display: flex; justify-content: space-between; font-size: 10px; padding: 2px 0; }
    .final-total { border-top: 2px solid black; padding-top: 5px; margin-top: 5px; font-size: 12px; font-weight: bold; }
    .footer { border-top: 1px solid black; padding-top: 10px; text-align: center; margin-top: 20px; }
    .footer p { font-size: 9px; margin: 2px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h1>NVA PRINTING SERVICES</h1>
      <p>Pabayo - Chavez St. Plaza Divisoria Cagayan de Oro City</p>
      <p>09177174889</p>
      <p>nicholsonanora@gmail.com</p>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p><strong>Invoice #:</strong> ${order.id.slice(0, 8)}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
  
  <div class="content">
    <div class="left">
      <div class="section">
        <h3>Bill To:</h3>
        <div class="customer">
          <p><strong>${order.first_name} ${order.last_name}</strong></p>
          <p>${order.phone_number}</p>
          <p>${order.address}</p>
          <p>${order.email}</p>
        </div>
      </div>
      
      <div class="section">
        <h3>Order Information:</h3>
        <div class="info-row"><span>Order ID:</span><span>${order.id.slice(0, 8)}</span></div>
        <div class="info-row"><span>Product:</span><span>${order.variant}</span></div>
        ${order.height && order.width ? `<div class="info-row"><span>Size:</span><span>${order.height} × ${order.width}</span></div>` : ''}
        <div class="info-row"><span>Quantity:</span><span>${order.quantity} pcs</span></div>
        ${order.eyelets ? `<div class="info-row"><span>Eyelets:</span><span>${order.eyelets}</span></div>` : ''}
        <div class="info-row"><span>Pickup Date:</span><span>${order.pickup_date}</span></div>
        <div class="info-row"><span>Pickup Time:</span><span>${order.pickup_time}</span></div>
        <div class="info-row"><span>Created:</span><span>${new Date(order.created_at).toLocaleDateString()}</span></div>
      </div>
      
      ${order.instructions ? `
      <div class="section">
        <h3>Special Instructions:</h3>
        <p style="font-size: 9px; padding: 5px; background: #f5f5f5; border: 1px solid #999;">${order.instructions}</p>
      </div>` : ''}
    </div>
    
    <div class="right">
      <div class="section">
        <h3>Payment Summary:</h3>
        <div class="payment">
          <div class="total-row"><span>Subtotal:</span><span>₱${subtotal}</span></div>
          ${layoutFee > 0 ? `<div class="total-row"><span>Layout Fee:</span><span>₱${layoutFee}</span></div>` : ''}
          <div class="total-row final-total"><span>TOTAL AMOUNT:</span><span>₱${order.total}</span></div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="footer">
    <p><strong>Thank you for choosing NVA Printing Services!</strong></p>
    <p>For questions or concerns, please contact us at 09177174889</p>
    ${employeeFirstName && employeeLastName ? `<p style="font-style: italic; margin-top: 5px;">Processed by: ${employeeFirstName} ${employeeLastName}</p>` : ''}
  </div>
</body>
</html>`;

      // Open new window and print
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait a bit then print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      } else {
        alert('Please allow popups for printing to work');
      }
      
    } catch (error) {
      console.error('Print error:', error);
      alert('Print failed: ' + error.message);
    }
  };

  const handleSendReceipt = async () => {
    if (!order || !employeeEmail || !selectedCustomer) {
      alert('Missing order, employee, or customer information');
      return;
    }

    const customer = customers.find(c => c.email === selectedCustomer);
    const isOriginalCustomer = selectedCustomer === order.email;

    setSending(true);
    try {
      const receiptMessage = {
        chat_id: [employeeEmail, selectedCustomer].sort().join('-'),
        sender: employeeEmail,
        receiver: selectedCustomer,
        text: `[DIGITAL_RECEIPT]|${order.id}
📧 Digital Receipt - Order #${order.id.slice(0, 7)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 NVA PRINTING SERVICES
📍 Pabayo - Chavez St. Plaza Divisoria Cagayan de Oro City
📞 Contact: 09177174889
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${!isOriginalCustomer ? `⚠️ Receipt forwarded to: ${customer?.first_name} ${customer?.last_name}

` : ''}👤 ORIGINAL CUSTOMER DETAILS:
Name: ${order.first_name} ${order.last_name}
Phone: ${order.phone_number}
Address: ${order.address}

📦 ORDER DETAILS:
Order ID: ${order.id.slice(0, 8)}
Product: ${order.variant}
${order.height && order.width ? `Size: ${order.height} × ${order.width}` : ''}
Quantity: ${order.quantity} pcs
${order.eyelets ? `Eyelets: ${order.eyelets}` : ''}
${order.instructions ? `Instructions: ${order.instructions}` : ''}

📅 PICKUP INFORMATION:
Date: ${order.pickup_date}
Time: ${order.pickup_time}

💰 PAYMENT BREAKDOWN:
Subtotal: ₱${order.has_file ? order.total : (order.total - 150)}
${!order.has_file ? 'Layout Fee: ₱150' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL AMOUNT: ₱${order.total}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Order Created: ${new Date(order.created_at).toLocaleString()}
👨‍💼 Processed by: ${employeeFirstName} ${employeeLastName}

Thank you for choosing NVA Printing Services! 🙏`,
        created_at: new Date().toISOString(),
        read: false
      };

      const { error: messageError } = await supabase
        .from('messages')
        .insert(receiptMessage);

      if (messageError) {
        throw messageError;
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          receipt_sent: true,
          receipt_sent_at: new Date().toISOString(),
          receipt_sent_to: selectedCustomer
        })
        .eq('id', selectedOrderId);

      if (updateError) {
        console.error('Error updating receipt status:', updateError);
      }

      const customerName = customer ? `${customer.first_name} ${customer.last_name}` : selectedCustomer;
      alert(`Digital receipt sent successfully to ${customerName}!`);
      setOrder({ ...order, receipt_sent: true, receipt_sent_to: selectedCustomer });
      setShowCustomerSelect(false);
      
    } catch (error) {
      console.error('Error sending receipt:', error);
      alert('Failed to send receipt: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="SendReceipt-page">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Loading...</h2>
          <p>Please wait while we fetch the information.</p>
        </div>
      </div>
    );
  }

  if (showOrderSelect || !order) {
    return (
      <div className="SendReceipt-page">
        <div className="SendReceipt-order-selection">
          <div className="SendReceipt-selection-header">
            <h2>📧 Send Digital Receipt</h2>
            <p>Select an order to send the receipt to customer</p>
          </div>
          
          <div className="SendReceipt-order-search">
            <input
              type="text"
              placeholder="Search orders by customer name, order ID, or product..."
              className="SendReceipt-search-input"
              onChange={(e) => {
                const searchTerm = e.target.value.toLowerCase();
              }}
            />
          </div>

          <div className="SendReceipt-orders-grid">
            {orders.map((orderItem) => (
              <div
                key={orderItem.id}
                className="SendReceipt-order-card"
                onClick={() => handleOrderSelect(orderItem.id)}
              >
                <div className="SendReceipt-order-header">
                  <div className="SendReceipt-order-id">
                    Order #{orderItem.id.slice(0, 8)}
                  </div>
                </div>
                
                <div className="SendReceipt-order-customer">
                  <strong>{orderItem.first_name} {orderItem.last_name}</strong>
                  <div className="SendReceipt-order-email">{orderItem.email}</div>
                </div>
                
                <div className="SendReceipt-order-details">
                  <div>📦 {orderItem.variant}</div>
                  <div>💰 ₱{orderItem.total}</div>
                  <div>📅 {new Date(orderItem.created_at).toLocaleDateString()}</div>
                </div>

                {orderItem.receipt_sent && (
                  <div className="SendReceipt-receipt-badge">
                    ✅ Receipt Sent
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const subtotal = order.has_file ? order.total : (order.total - 150);
  const layoutFee = order.has_file ? 0 : 150;

  return (
    <div className="SendReceipt-page">
      {/* Back button */}
      <div className="SendReceipt-back-button">
        <button onClick={() => setShowOrderSelect(true)}>
          ← Back to Order Selection
        </button>
      </div>

      {/* Invoice Content */}
      <div className="SendReceipt-invoice">
        <div className="SendReceipt-invoice-header">
          <div className="SendReceipt-company-info">
            <h1>NVA PRINTING SERVICES</h1>
            <div className="SendReceipt-company-details">
              <p>📍 Pabayo - Chavez St. Plaza Divisoria Cagayan de Oro City</p>
              <p>📞 09177174889</p>
              <p>📧 nicholsonanora@gmail.com</p>
            </div>
          </div>
          <div className="SendReceipt-invoice-info">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> {order.id.slice(0, 8)}</p>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="SendReceipt-content">
          <div className="SendReceipt-left-column">
            <div className="SendReceipt-customer-section">
              <h3>Bill To:</h3>
              <div className="SendReceipt-customer-info">
                <p><strong>{order.first_name} {order.last_name}</strong></p>
                <p>📞 {order.phone_number}</p>
                <p>📍 {order.address}</p>
                <p>📧 {order.email}</p>
              </div>
            </div>

            <div className="SendReceipt-order-section">
              <h3>Order Information:</h3>
              <div className="SendReceipt-order-info">
                <div className="info-row">
                  <span>Order ID:</span>
                  <span>{order.id.slice(0, 8)}</span>
                </div>
                <div className="info-row">
                  <span>Product:</span>
                  <span>{order.variant}</span>
                </div>
                {order.height && order.width && (
                  <div className="info-row">
                    <span>Size:</span>
                    <span>{order.height} × {order.width}</span>
                  </div>
                )}
                <div className="info-row">
                  <span>Quantity:</span>
                  <span>{order.quantity} pcs</span>
                </div>
                {order.eyelets && (
                  <div className="info-row">
                    <span>Eyelets:</span>
                    <span>{order.eyelets}</span>
                  </div>
                )}
                <div className="info-row">
                  <span>Pickup Date:</span>
                  <span>{order.pickup_date}</span>
                </div>
                <div className="info-row">
                  <span>Pickup Time:</span>
                  <span>{order.pickup_time}</span>
                </div>
                <div className="info-row">
                  <span>Created:</span>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {order.instructions && (
              <div className="SendReceipt-instructions-section">
                <h3>Special Instructions:</h3>
                <div className="SendReceipt-instructions">
                  {order.instructions}
                </div>
              </div>
            )}
          </div>

          <div className="SendReceipt-right-column">
            {order.attached_file && (
              <div className="SendReceipt-file-section">
                <h3>Attached File:</h3>
                <div className="SendReceipt-file-preview">
                  {order.attached_file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={order.attached_file}
                      alt="Order Preview"
                      className="SendReceipt-preview-img"
                    />
                  ) : (
                    <div className="SendReceipt-file-placeholder">
                      📄 {order.attached_file.split('/').pop()}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="SendReceipt-payment-section">
              <h3>Payment Summary:</h3>
              <div className="SendReceipt-totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>₱{subtotal}</span>
                </div>
                {layoutFee > 0 && (
                  <div className="total-row">
                    <span>Layout Fee:</span>
                    <span>₱{layoutFee}</span>
                  </div>
                )}
                <div className="total-row final-total">
                  <strong>
                    <span>TOTAL AMOUNT:</span>
                    <span>₱{order.total}</span>
                  </strong>
                </div>
              </div>
            </div>

            {order.receipt_sent && (
              <div className="SendReceipt-status-section">
                <div className="SendReceipt-receipt-sent">
                  <strong>✅ Receipt Sent</strong>
                  <p>To: {customers.find(c => c.email === order.receipt_sent_to)?.first_name} {customers.find(c => c.email === order.receipt_sent_to)?.last_name}</p>
                  <p>Date: {new Date(order.receipt_sent_at).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="SendReceipt-footer">
          <div className="SendReceipt-footer-content">
            <p><strong>Thank you for choosing NVA Printing Services!</strong></p>
            <p>For questions or concerns, please contact us at 09177174889</p>
            {employeeFirstName && employeeLastName && (
              <p className="processed-by">Processed by: {employeeFirstName} {employeeLastName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons - FIXED: Make sure these render */}
      <div className="SendReceipt-actions">
        <button 
          className="SendReceipt-print-btn"
          onClick={handlePrint}
          type="button"
        >
          🖨️ Print Invoice
        </button>
        <button 
          className="SendReceipt-send-btn"
          onClick={() => setShowCustomerSelect(true)}
          disabled={sending}
          type="button"
        >
          {order.receipt_sent ? '📱 Send to Another Customer' : '📱 Send to Mobile'}
        </button>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerSelect && (
        <div className="SendReceipt-modal-overlay">
          <div className="SendReceipt-modal">
            <div className="SendReceipt-modal-header">
              <h3>Select Customer to Send Receipt</h3>
              <button 
                className="SendReceipt-modal-close"
                onClick={() => setShowCustomerSelect(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="SendReceipt-modal-body">
              <div className="SendReceipt-customer-search">
                <label>Choose customer:</label>
                <select 
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="SendReceipt-customer-select"
                >
                  <option value="">Select a customer...</option>
                  {customers.map(customer => (
                    <option key={customer.email} value={customer.email}>
                      {customer.first_name} {customer.last_name} - {customer.email}
                      {customer.email === order.email ? ' (Original Customer)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div className="SendReceipt-selected-customer">
                  <h4>Sending receipt to:</h4>
                  {(() => {
                    const customer = customers.find(c => c.email === selectedCustomer);
                    return customer ? (
                      <div className="customer-info">
                        <p><strong>{customer.first_name} {customer.last_name}</strong></p>
                        <p>📧 {customer.email}</p>
                        <p>📞 {customer.phone_number}</p>
                        {selectedCustomer !== order.email && (
                          <p className="forward-warning">
                            ⚠️ This receipt will be forwarded to a different customer than the original order.
                          </p>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
            
            <div className="SendReceipt-modal-actions">
              <button 
                className="SendReceipt-modal-cancel"
                onClick={() => setShowCustomerSelect(false)}
                disabled={sending}
              >
                Cancel
              </button>
              <button 
                className="SendReceipt-modal-send"
                onClick={handleSendReceipt}
                disabled={sending || !selectedCustomer}
              >
                {sending ? '📤 Sending...' : '📱 Send Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendReceipt;