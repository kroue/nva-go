import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from './SupabaseAdminClient';
import './AdminCustomers.css';
import { FaUserPlus, FaUsers, FaSearch } from 'react-icons/fa';

const emptyForm = {
  email: '',
  password: '',
  username: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  address: '',
  is_barred: false,
};

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      searchTerm === '' ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.username?.toLowerCase().includes(searchLower) ||
      customer.first_name?.toLowerCase().includes(searchLower) ||
      customer.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const fetchCustomers = async () => {
    const { data, error } = await supabaseAdmin.from('customers').select('*');
    if (!error) setCustomers(data);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true,
      user_metadata: {
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        address: form.address,
      },
    });
    if (authError) {
      setError(authError.message);
      return;
    }
    const userId = authData.user.id;
    const { error: dbError } = await supabaseAdmin.from('customers').insert({
      id: userId,
      username: form.username,
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      phone_number: form.phone_number,
      address: form.address,
      is_barred: form.is_barred,
    });
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setForm(emptyForm);
    setModalOpen(false);
    fetchCustomers();
  };

  const handleEdit = (cust) => {
    setEditingId(cust.id);
    
    console.log('=== EDIT CUSTOMER DEBUG ===');
    console.log('Customer ID:', cust.id);
    console.log('is_barred from DB:', cust.is_barred, 'type:', typeof cust.is_barred);
    
    setForm({
      email: cust.email,
      username: cust.username,
      first_name: cust.first_name,
      last_name: cust.last_name,
      phone_number: cust.phone_number,
      address: cust.address,
      is_barred: cust.is_barred,
      password: '',
    });
    
    console.log('Form is_barred set to:', cust.is_barred);
    setModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('=== UPDATE CUSTOMER DEBUG ===');
    console.log('Customer ID:', editingId);
    console.log('Form is_barred:', form.is_barred, 'type:', typeof form.is_barred);
    
    const { data, error: dbError } = await supabaseAdmin.from('customers').update({
      username: form.username,
      first_name: form.first_name,
      last_name: form.last_name,
      phone_number: form.phone_number,
      address: form.address,
      is_barred: form.is_barred,
    }).eq('id', editingId).select();
    
    if (dbError) {
      console.error('Update error:', dbError);
      setError(dbError.message);
      return;
    }
    
    console.log('Update successful!');
    console.log('Returned data:', data);
    console.log('is_barred in returned data:', data?.[0]?.is_barred);
    
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(false);
    await fetchCustomers();
  };

  const handleDelete = async (id) => {
    const customer = customers.find(c => c.id === id);
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      await supabaseAdmin.from('customers').delete().eq('id', customerToDelete.id);
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setCustomerToDelete(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  return (
    <div className="AdminCustomers">
      <div className="AdminCustomers-title">Customers</div>

      <div className="AdminCustomers-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="customers-count">
            {filteredCustomers.length} {filteredCustomers.length === 1 ? 'Customer' : 'Customers'}
          </div>
          <button
            className="add-customer-btn"
            onClick={() => { setModalOpen(true); setEditingId(null); setForm(emptyForm); }}
          >
            <FaUserPlus />
            Add Customer
          </button>
        </div>
      </div>

      <div className="AdminCustomers-card">
        <div className="table-wrapper">
          <table className="AdminCustomers-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Username</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    <FaUsers className="empty-icon" />
                    <p>No customers found</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id}>
                    <td>{cust.email}</td>
                    <td>{cust.username}</td>
                    <td>
                      <div className="customer-name-cell">
                        <div className="customer-avatar">
                          {(cust.first_name?.[0] || 'C').toUpperCase()}
                        </div>
                        <span className="customer-name">
                          {cust.first_name} {cust.last_name}
                        </span>
                      </div>
                    </td>
                    <td>{cust.phone_number}</td>
                    <td>{cust.address}</td>
                    <td>
                      <span className={`barred-badge ${cust.is_barred ? 'yes' : 'no'}`}>
                        {cust.is_barred ? 'Barred' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" onClick={() => handleEdit(cust)}>Edit</button>
                        <button className="action-btn delete" onClick={() => handleDelete(cust.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-header">{editingId ? 'Edit Customer' : 'Add Customer'}</h3>
            <form className="modal-form" onSubmit={editingId ? handleUpdate : handleAdd}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={!!editingId}
                />
              </div>
              {!editingId && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    className="form-input"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    className="form-input"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  className="form-input"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>
              {editingId && (
                <div className="form-group">
                  <label className="form-label">Customer Status</label>
                  <div className="toggle-switch-container">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={!form.is_barred}
                        onChange={(e) => {
                          const newValue = !e.target.checked;
                          console.log('=== TOGGLE CLICKED ===');
                          console.log('Checkbox checked:', e.target.checked);
                          console.log('Setting is_barred to:', newValue);
                          setForm({ ...form, is_barred: newValue });
                        }}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className={`toggle-label ${!form.is_barred ? 'active' : 'inactive'}`}>
                      {!form.is_barred ? 'Active - Can Order' : 'Barred - Cannot Order'}
                    </span>
                  </div>
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px', 
                    background: '#f0f0f0', 
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}>
                    DEBUG: is_barred = {String(form.is_barred)} (type: {typeof form.is_barred})
                  </div>
                </div>
              )}
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button type="submit" className="modal-btn primary">
                  {editingId ? 'Update' : 'Add'} Customer
                </button>
                <button type="button" className="modal-btn secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && customerToDelete && (
        <div className="modal-backdrop" onClick={cancelDelete}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">⚠️</div>
            <h3 className="modal-header">Delete Customer?</h3>
            <p className="delete-modal-message">
              You're about to delete
              <strong>{customerToDelete.first_name} {customerToDelete.last_name}</strong>
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-btn secondary" onClick={cancelDelete}>
                Cancel
              </button>
              <button type="button" className="modal-btn danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;