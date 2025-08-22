import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import './AdminEmployees.css'; // Reuse employee styles
import { FaUserPlus } from 'react-icons/fa';

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

  // Fetch all customers
  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*');
    if (!error) setCustomers(data);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  // Add new customer
  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username,
          first_name: form.first_name,
          last_name: form.last_name,
          phone_number: form.phone_number,
          address: form.address,
        },
      },
    });
    if (authError) {
      setError(authError.message);
      return;
    }
    if (!authData.user) {
      setError('User must confirm their email before being added as a customer.');
      return;
    }
    const userId = authData.user.id;
    // Now insert into customers table
    const { error: dbError } = await supabase.from('customers').insert({
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

  // Edit customer (load into form)
  const handleEdit = (cust) => {
    setEditingId(cust.id);
    setForm({
      email: cust.email,
      username: cust.username,
      first_name: cust.first_name,
      last_name: cust.last_name,
      phone_number: cust.phone_number,
      address: cust.address,
      is_barred: cust.is_barred,
      password: '', // leave blank
    });
    setModalOpen(true);
  };

  // Update customer
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    const { error: dbError } = await supabase.from('customers').update({
      username: form.username,
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      phone_number: form.phone_number,
      address: form.address,
      is_barred: form.is_barred,
    }).eq('id', editingId);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(false);
    fetchCustomers();
  };

  // Delete customer
  const handleDelete = async (id) => {
    await supabase.from('customers').delete().eq('id', id);
    fetchCustomers();
  };

  // Modal close
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  return (
    <div className="AdminEmployees-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="AdminEmployees-title">Customers</h2>
        <button
          className="AdminEmployees-add-btn"
          onClick={() => { setModalOpen(true); setEditingId(null); setForm(emptyForm); }}
        >
          <FaUserPlus style={{ marginRight: 8 }} />
          Add Customer
        </button>
      </div>
      <table className="AdminEmployees-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Username</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Barred?</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(cust => (
            <tr key={cust.id}>
              <td>{cust.email}</td>
              <td>{cust.username}</td>
              <td>{cust.first_name} {cust.last_name}</td>
              <td>{cust.phone_number}</td>
              <td>{cust.address}</td>
              <td>{cust.is_barred ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => handleEdit(cust)}>Edit</button>
                <button onClick={() => handleDelete(cust.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {modalOpen && (
        <div className="AdminEmployees-modal-backdrop" onClick={handleCloseModal}>
          <div className="AdminEmployees-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 18 }}>{editingId ? 'Edit Customer' : 'Add Customer'}</h3>
            <form
              className="AdminEmployees-form"
              onSubmit={editingId ? handleUpdate : handleAdd}
              style={{ marginBottom: 0 }}
            >
              <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required disabled={!!editingId} />
              {!editingId && <input name="password" placeholder="Password" type="password" value={form.password} onChange={handleChange} required />}
              <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
              <input name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} required />
              <input name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} required />
              <input name="phone_number" placeholder="Phone Number" value={form.phone_number} onChange={handleChange} />
              <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  name="is_barred"
                  checked={form.is_barred}
                  onChange={handleChange}
                />
                Barred
              </label>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="submit">{editingId ? 'Update' : 'Add'} Customer</button>
                <button type="button" onClick={handleCloseModal}>Cancel</button>
              </div>
              {error && <div className="AdminEmployees-error">{error}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;