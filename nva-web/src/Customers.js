import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Customers.css';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { supabase } from './SupabaseClient';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch customers from Supabase
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase.from('customers').select('*');
      
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="Customers-page">
      <div className="Customers-header">
        <span>Customers</span>
      </div>

      <div className="Customers-section-title">Customer Profiles</div>
      <div className="Customers-container">
        <div className="Customers-grid">
          <div className="Customers-list">
            {customers.map(customer => (
              <div
                key={customer.id}
                className={`Customers-list-item${selectedCustomer?.id === customer.id ? ' active' : ''}`}
                onClick={() => setSelectedCustomer(customer)}
              >
                <AccountCircleIcon style={{ marginRight: 8 }} />
                {`${customer.first_name} ${customer.last_name}`}
              </div>
            ))}
          </div>
          <div className="Customers-history">
            <div className="Customers-history-title">Order History</div>
            {orders.map(order => (
              <div 
                key={order.id} 
                className="Customers-history-card"
                onClick={() => handleOrderClick(order.id)}
                style={{ cursor: 'pointer' }}
              >
                {order.attached_file ? (
                  <img
                    src={order.attached_file}
                    alt={order.variant}
                    className="Customers-history-img"
                  />
                ) : (
                  <div className="Customers-history-img-placeholder" />
                )}
                <span className="Customers-history-product">{order.variant}</span>
                <span className="Customers-history-id">No. {order.id.slice(0, 7)}</span>
              </div>
            ))}
            {orders.length === 0 && (
              <div style={{ color: '#666', textAlign: 'center', marginTop: 20 }}>
                No orders found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;