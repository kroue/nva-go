import React, { useState, useEffect } from 'react';
import './Customers.css';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from './SupabaseClient';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    address: ''
  });

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

  const handleAddCustomer = async () => {
    try {
      // Validate required fields
      if (!newCustomer.username || !newCustomer.email || !newCustomer.first_name || !newCustomer.last_name) {
        alert('Please fill in all required fields');
        return;
      }

      // Check if username or email already exists
      const { data: existing, error: checkError } = await supabase
        .from('customers')
        .select('username, email')
        .or(`username.eq.${newCustomer.username},email.eq.${newCustomer.email}`);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        alert('Username or email already exists');
        return;
      }

      // Insert new customer (id will be auto-generated)
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          username: newCustomer.username,
          email: newCustomer.email,
          first_name: newCustomer.first_name,
          last_name: newCustomer.last_name,
          phone_number: newCustomer.phone_number || null,
          address: newCustomer.address || null,
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // Update customers list
      setCustomers([...customers, customerData]);
      setShowAddForm(false);
      setNewCustomer({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        address: ''
      });

      alert('Customer added successfully!');

    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="Customers-page">
      <div className="Customers-header">
        <span>Customers</span>
        <button 
          className="Customers-add-button"
          onClick={() => setShowAddForm(true)}
        >
          <AddIcon /> Add Customer
        </button>
      </div>

      {/* Add Customer Modal */}
      {showAddForm && (
        <div className="Customers-modal">
          <div className="Customers-modal-content">
            <h3>Add New Customer</h3>
            <div className="Customers-form">
              <input
                type="text"
                placeholder="Username *"
                value={newCustomer.username}
                onChange={(e) => setNewCustomer({...newCustomer, username: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="First Name *"
                value={newCustomer.first_name}
                onChange={(e) => setNewCustomer({...newCustomer, first_name: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Last Name *"
                value={newCustomer.last_name}
                onChange={(e) => setNewCustomer({...newCustomer, last_name: e.target.value})}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={newCustomer.phone_number}
                onChange={(e) => setNewCustomer({...newCustomer, phone_number: e.target.value})}
              />
              <textarea
                placeholder="Address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                rows="3"
              />
            </div>
            <div className="Customers-modal-actions">
              <button onClick={() => setShowAddForm(false)}>Cancel</button>
              <button onClick={handleAddCustomer}>Add Customer</button>
            </div>
          </div>
        </div>
      )}

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
              <div key={order.id} className="Customers-history-card">
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