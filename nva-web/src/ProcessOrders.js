import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './ProcessOrders.css';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AspectRatioOutlinedIcon from '@mui/icons-material/AspectRatioOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';

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
    const order = orders.find(o => o.id === orderId);
    
    // Validate status transition
    if (!canTransitionTo(order.status, newStatus)) {
      alert(`Cannot update to ${newStatus}. ${getRequiredStatusMessage(newStatus)}`);
      return;
    }
    
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
      <div className="ProcessOrders-header">
        <div className="ProcessOrders-header-content">
          <InventoryOutlinedIcon className="ProcessOrders-header-icon" />
          <div className="ProcessOrders-header-text">
            <h1>Process Orders</h1>
            <p>Manage and track all customer orders</p>
          </div>
        </div>
        <div className="ProcessOrders-stats">
          <div className="stat-badge">
            <span className="stat-number">{orders.filter(o => o.status !== 'Finished').length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-badge">
            <span className="stat-number">{orders.filter(o => o.status === 'Finished').length}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      <div className="ProcessOrders-container">
        {orders.length === 0 ? (
          <div className="ProcessOrders-empty">
            <InventoryOutlinedIcon style={{ fontSize: 64, opacity: 0.3 }} />
            <p>No orders to display</p>
          </div>
        ) : (
          <div className="ProcessOrders-grid">
            {orders.map((order) => (
              <div
                className={`ProcessOrders-card ${order.status === 'Finished' ? 'finished' : ''}`}
                key={order.id}
                onClick={() => handleCardClick(order)}
              >
                <div className="ProcessOrders-card-header">
                  <div className="card-header-left">
                    <PersonOutlineOutlinedIcon className="card-icon" />
                    <div>
                      <span className="ProcessOrders-card-name">
                        {order.first_name} {order.last_name}
                      </span>
                      <span className="ProcessOrders-card-id">
                        #{order.id ? order.id.slice(0, 8) : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ProcessOrders-card-product">
                  <strong>{order.variant}</strong>
                </div>

                <div className="ProcessOrders-card-details">
                  <div className="detail-item">
                    <AspectRatioOutlinedIcon className="detail-icon" />
                    <span>Size: {order.height && order.width ? `${order.height} × ${order.width}` : 'Custom'}</span>
                  </div>
                  <div className="detail-item">
                    <CalendarTodayOutlinedIcon className="detail-icon" />
                    <span>{order.pickup_date}</span>
                  </div>
                  <div className="detail-item">
                    <AccessTimeOutlinedIcon className="detail-icon" />
                    <span>{order.pickup_time}</span>
                  </div>
                </div>

                {order.instructions && (
                  <div className="ProcessOrders-card-instructions">
                    <p>{order.instructions}</p>
                  </div>
                )}

                <div className="status-tracker">
                  {statuses.map((status) => (
                    <div
                      key={status}
                      className={`status-pill ${order.status === status ? 'active' : ''}`}
                      title={status}
                    >
                      {status === 'Finished' && order.status === status ? (
                        <CheckCircleOutlineOutlinedIcon style={{ fontSize: 14 }} />
                      ) : status === 'For Pickup' && order.status === status ? (
                        <LocalShippingOutlinedIcon style={{ fontSize: 14 }} />
                      ) : (
                        status.split(' ')[0]
                      )}
                    </div>
                  ))}
                </div>

                <div className="ProcessOrders-card-actions">
                  <button
                    className="action-btn secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'For Pickup');
                    }}
                    disabled={
                      updatingId === order.id ||
                      order.status === 'For Pickup' ||
                      order.status === 'Finished' ||
                      !canTransitionTo(order.status, 'For Pickup')
                    }
                    title={!canTransitionTo(order.status, 'For Pickup') ? getRequiredStatusMessage('For Pickup') : ''}
                  >
                    <LocalShippingOutlinedIcon style={{ fontSize: 16 }} />
                    Ready for Pickup
                  </button>

                  <button
                    className="action-btn primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateOrderStatus(order.id, 'Finished');
                    }}
                    disabled={updatingId === order.id || order.status === 'Finished' || !canTransitionTo(order.status, 'Finished')}
                    title={!canTransitionTo(order.status, 'Finished') ? getRequiredStatusMessage('Finished') : ''}
                  >
                    <CheckCircleOutlineOutlinedIcon style={{ fontSize: 16 }} />
                    Finish Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessOrders;