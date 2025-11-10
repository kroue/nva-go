import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './ProcessOrders.css';

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

const statuses = ['Validation', 'Layout Approval', 'Printing', 'For Pickup', 'Finished'];

const ProcessOrders = () => {
  const [orders, setOrders] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();
  const employee = useEmployee();

  const sortOrders = (list) =>
    list
      .slice()
      .sort((a, b) => {
        if (a.status === 'Finished' && b.status !== 'Finished') return 1;
        if (a.status !== 'Finished' && b.status === 'Finished') return -1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase.from('orders').select('*');
      if (!error && data) {
        setOrders(sortOrders(data));
      }
    };
    fetchOrders();
  }, []);

  const handleCardClick = (order) => {
    navigate(`/orders/${order.id}`);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) {
        console.error('Failed to update status:', error);
        return;
      }

      // Send message if status is 'For Pickup'
      if (newStatus === 'For Pickup') {
        const order = orders.find(o => o.id === orderId);
        if (order && order.email) {
          const messageText = `[ORDER_READY]|${orderId}
Your order is ready for pickup!

Order ID: ${orderId}
Product: ${order.product_name || order.variant}
Size: ${order.height && order.width ? `${order.height} × ${order.width}` : 'Custom size'}
Quantity: ${order.quantity} pcs
Pickup Date: ${order.pickup_date}
Pickup Time: ${order.pickup_time}

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

      setOrders((prev) =>
        sortOrders(prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="ProcessOrders-page">
      <div className="ProcessOrders-section-title">Process Orders</div>
      <div className="ProcessOrders-container">
        <div className="ProcessOrders-grid">
          {orders.map((order) => (
            <div
              className={`ProcessOrders-card ${order.status === 'Finished' ? 'finished' : ''}`}
              key={order.id}
              onClick={() => handleCardClick(order)}
              style={{ cursor: 'pointer' }}
            >
              <div className="ProcessOrders-card-header">
                <span className="ProcessOrders-card-name">
                  {order.first_name} {order.last_name}
                </span>
                <span className="ProcessOrders-card-id">
                  No. {order.id ? order.id.slice(0, 8) : ''}
                </span>
              </div>
              <div className="ProcessOrders-card-product">{order.variant}</div>
              <div className="ProcessOrders-card-details">
                <div>
                  Size: {order.height && order.width ? `${order.height} x ${order.width}` : '---'}
                </div>
                <div>Pickup: {order.pickup_date}</div>
                <div>Time: {order.pickup_time}</div>
              </div>
              <input
                className="ProcessOrders-card-description"
                type="text"
                value={order.instructions || ''}
                disabled
              />

              <div className="status-tracker">
                {statuses.map((status) => (
                  <div
                    key={status}
                    className={`status-pill ${order.status === status ? 'active' : ''}`}
                  >
                    {status}
                  </div>
                ))}
              </div>

              <div className="ProcessOrders-card-actions" style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateOrderStatus(order.id, 'For Pickup');
                  }}
                  disabled={
                    updatingId === order.id ||
                    order.status === 'For Pickup' ||
                    order.status === 'Finished'
                  }
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #252b55',
                    background:
                      updatingId === order.id ||
                      order.status === 'For Pickup' ||
                      order.status === 'Finished'
                        ? '#ddd'
                        : '#f2f3f5',
                    cursor:
                      updatingId === order.id ||
                      order.status === 'For Pickup' ||
                      order.status === 'Finished'
                        ? 'not-allowed'
                        : 'pointer',
                    fontWeight: 600
                  }}
                >
                  Ready for Pick Up
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateOrderStatus(order.id, 'Finished');
                  }}
                  disabled={updatingId === order.id || order.status === 'Finished'}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #252b55',
                    background:
                      updatingId === order.id || order.status === 'Finished' ? '#ddd' : '#252b55',
                    color: updatingId === order.id || order.status === 'Finished' ? '#444' : '#fff',
                    cursor:
                      updatingId === order.id || order.status === 'Finished'
                        ? 'not-allowed'
                        : 'pointer',
                    fontWeight: 600
                  }}
                >
                  Finish Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcessOrders;