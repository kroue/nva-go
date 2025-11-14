import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Customers.css';
import { supabase } from './SupabaseClient';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import DirectionsWalkOutlinedIcon from '@mui/icons-material/DirectionsWalkOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'history'

  // Fetch customers from Supabase
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching customers:', error);
        setLoading(false);
        return;
      }
      
      if (data) {
        setCustomers(data);
        if (data.length > 0) setSelectedCustomer(data[0]);
      }
      setLoading(false);
    };

    fetchCustomers();
  }, []);

  // Fetch orders for selected customer
  useEffect(() => {
    const fetchOrders = async () => {
      if (!selectedCustomer) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('email', selectedCustomer.email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      if (data) setOrders(data);
    };

    fetchOrders();
  }, [selectedCustomer]);

  // Handler for order click
  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  if (loading) {
    return (
      <div className="Customers-page">
        <div className="Customers-loading">
          <PeopleOutlineOutlinedIcon style={{ fontSize: 64, opacity: 0.3 }} />
          <h2>Loading Customers...</h2>
          <p>Please wait while we fetch customer information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="Customers-page">
      <div className="Customers-header">
        <div className="Customers-header-content">
          <PeopleOutlineOutlinedIcon className="Customers-header-icon" />
          <div className="Customers-header-text">
            <h1>Customer Management</h1>
            <p>View and manage customer profiles and order history</p>
          </div>
        </div>
        <div className="Customers-stats">
          <div className="stat-badge">
            <span className="stat-number">{customers.length}</span>
            <span className="stat-label">Total Customers</span>
          </div>
          <div className="stat-badge">
            <span className="stat-number">{customers.filter(c => c.is_barred).length}</span>
            <span className="stat-label">Barred</span>
          </div>
        </div>
      </div>

      <div className="Customers-container">
        <div className="Customers-layout">
          {/* Customer List */}
          <div className="Customers-list-section">
            <div className="Customers-list-header">
              <h3>All Customers</h3>
              <span className="customer-count">{customers.length}</span>
            </div>
            <div className="Customers-list">
              {customers.map(customer => (
                <div
                  key={customer.id}
                  className={`Customers-list-item ${selectedCustomer?.id === customer.id ? 'active' : ''} ${customer.is_barred ? 'barred' : ''}`}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="customer-avatar">
                    <PersonOutlineOutlinedIcon />
                  </div>
                  <div className="customer-list-info">
                    <span className="customer-list-name">
                      {`${customer.first_name} ${customer.last_name}`}
                    </span>
                    <span className="customer-list-email">{customer.email}</span>
                  </div>
                  {customer.is_barred && (
                    <div className="barred-badge">
                      <BlockOutlinedIcon style={{ fontSize: 14 }} />
                    </div>
                  )}
                  {customer.is_walk_in && (
                    <div className="walkin-badge">
                      <DirectionsWalkOutlinedIcon style={{ fontSize: 14 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Customer Details/History */}
          <div className="Customers-details-section">
            {selectedCustomer ? (
              <>
                <div className="Customers-details-header">
                  <div className="customer-name-section">
                    <div className="customer-avatar-large">
                      <PersonOutlineOutlinedIcon style={{ fontSize: 40 }} />
                    </div>
                    <div>
                      <h2>{`${selectedCustomer.first_name} ${selectedCustomer.last_name}`}</h2>
                      <p className="customer-username">@{selectedCustomer.username}</p>
                    </div>
                  </div>
                  <div className="customer-badges">
                    {selectedCustomer.is_barred && (
                      <div className="status-badge barred">
                        <BlockOutlinedIcon style={{ fontSize: 16 }} />
                        <span>Barred</span>
                      </div>
                    )}
                    {selectedCustomer.is_walk_in && (
                      <div className="status-badge walkin">
                        <DirectionsWalkOutlinedIcon style={{ fontSize: 16 }} />
                        <span>Walk-in</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="Customers-tabs">
                  <button
                    className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                    onClick={() => setActiveTab('details')}
                  >
                    <InfoOutlinedIcon style={{ fontSize: 18 }} />
                    <span>Customer Details</span>
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                  >
                    <ReceiptLongOutlinedIcon style={{ fontSize: 18 }} />
                    <span>Order History</span>
                    <span className="tab-count">{orders.length}</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="Customers-tab-content">
                  {activeTab === 'details' ? (
                    <div className="customer-details-grid">
                      <div className="detail-card">
                        <div className="detail-card-header">
                          <EmailOutlinedIcon className="detail-icon" />
                          <span>Email Address</span>
                        </div>
                        <div className="detail-card-value">{selectedCustomer.email}</div>
                      </div>

                      <div className="detail-card">
                        <div className="detail-card-header">
                          <PhoneOutlinedIcon className="detail-icon" />
                          <span>Phone Number</span>
                        </div>
                        <div className="detail-card-value">
                          {selectedCustomer.phone_number || 'Not provided'}
                        </div>
                      </div>

                      <div className="detail-card">
                        <div className="detail-card-header">
                          <LocationOnOutlinedIcon className="detail-icon" />
                          <span>Address</span>
                        </div>
                        <div className="detail-card-value">
                          {selectedCustomer.address || 'Not provided'}
                        </div>
                      </div>

                      <div className="detail-card">
                        <div className="detail-card-header">
                          <CalendarTodayOutlinedIcon className="detail-icon" />
                          <span>Customer Since</span>
                        </div>
                        <div className="detail-card-value">
                          {new Date(selectedCustomer.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>

                      <div className="detail-card full-width">
                        <div className="detail-card-header">
                          <InfoOutlinedIcon className="detail-icon" />
                          <span>Account Information</span>
                        </div>
                        <div className="account-info-grid">
                          <div className="info-item">
                            <span className="info-label">Customer ID:</span>
                            <span className="info-value">{selectedCustomer.id.slice(0, 8)}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Username:</span>
                            <span className="info-value">{selectedCustomer.username}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Account Type:</span>
                            <span className="info-value">
                              {selectedCustomer.is_walk_in ? 'Walk-in Customer' : 'Registered User'}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Status:</span>
                            <span className={`info-value ${selectedCustomer.is_barred ? 'barred' : 'active'}`}>
                              {selectedCustomer.is_barred ? 'Barred' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="order-history-list">
                      {orders.length === 0 ? (
                        <div className="no-orders">
                          <InventoryOutlinedIcon style={{ fontSize: 48, opacity: 0.3 }} />
                          <p>No orders found for this customer</p>
                        </div>
                      ) : (
                        orders.map(order => (
                          <div 
                            key={order.id} 
                            className="order-history-card"
                            onClick={() => handleOrderClick(order.id)}
                          >
                            <div className="order-image-wrapper">
                              {order.attached_file ? (
                                <img
                                  src={order.attached_file}
                                  alt={order.variant}
                                  className="order-image"
                                />
                              ) : (
                                <div className="order-image-placeholder">
                                  <InventoryOutlinedIcon style={{ fontSize: 32, opacity: 0.3 }} />
                                </div>
                              )}
                            </div>
                            <div className="order-info">
                              <div className="order-product-name">{order.variant}</div>
                              <div className="order-meta">
                                <span className="order-id">#{order.id.slice(0, 8)}</span>
                                <span className="order-divider">•</span>
                                <span className="order-date">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="order-details-row">
                                {order.height && order.width && (
                                  <span className="order-detail">
                                    Size: {order.height} × {order.width}
                                  </span>
                                )}
                                <span className="order-detail">Qty: {order.quantity}</span>
                                <span className="order-price">₱{order.total}</span>
                              </div>
                            </div>
                            <div className={`order-status ${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                              {order.status}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="no-selection">
                <PersonOutlineOutlinedIcon style={{ fontSize: 64, opacity: 0.3 }} />
                <p>Select a customer to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;