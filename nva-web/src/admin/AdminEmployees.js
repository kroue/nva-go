import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import './AdminEmployees.css';
// You can use any icon library, here is an example with react-icons
import { FaUserPlus } from 'react-icons/fa';

const emptyForm = {
  email: '',
  password: '',
  username: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  address: '',
  position: '',
};

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch all employees
  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*');
    if (!error) setEmployees(data);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add new employee
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
    const userId = authData.user.id;
    // 2. Insert into employees table
    const { error: dbError } = await supabase.from('employees').insert({
      id: userId,
      username: form.username,
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      phone_number: form.phone_number,
      address: form.address,
      position: form.position,
      department: form.department,
      is_active: true,
    });
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setForm(emptyForm);
    setModalOpen(false);
    fetchEmployees();
  };

  // Edit employee (load into form)
  const handleEdit = (emp) => {
    setEditingId(emp.id);
    setForm({
      email: emp.email,
      username: emp.username,
      first_name: emp.first_name,
      last_name: emp.last_name,
      phone_number: emp.phone_number,
      address: emp.address,
      position: emp.position,
      department: emp.department,
      password: '', // leave blank
    });
    setModalOpen(true);
  };

  // Update employee
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    const { error: dbError } = await supabase.from('employees').update({
      username: form.username,
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      phone_number: form.phone_number,
      address: form.address,
      position: form.position,
      department: form.department,
    }).eq('id', editingId);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(false);
    fetchEmployees();
  };

  // Delete employee
  const handleDelete = async (id) => {
    await supabase.from('employees').delete().eq('id', id);
    fetchEmployees();
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
        <h2 className="AdminEmployees-title">Employees</h2>
        <button
          className="AdminEmployees-add-btn"
          onClick={() => { setModalOpen(true); setEditingId(null); setForm(emptyForm); }}
        >
          <FaUserPlus style={{ marginRight: 8 }} />
          Add Employee
        </button>
      </div>
      <table className="AdminEmployees-table">
        <thead>
          <tr>
            <th>Email</th><th>Username</th><th>Name</th><th>Phone</th><th>Address</th><th>Position</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id}>
              <td>{emp.email}</td>
              <td>{emp.username}</td>
              <td>{emp.first_name} {emp.last_name}</td>
              <td>{emp.phone_number}</td>
              <td>{emp.address}</td>
              <td>{emp.position}</td>
              <td>
                <button onClick={() => handleEdit(emp)}>Edit</button>
                <button onClick={() => handleDelete(emp.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {modalOpen && (
        <div className="AdminEmployees-modal-backdrop" onClick={handleCloseModal}>
          <div className="AdminEmployees-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 18 }}>{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
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
              <input name="position" placeholder="Position" value={form.position} onChange={handleChange} />
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="submit">{editingId ? 'Update' : 'Add'} Employee</button>
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

export default AdminEmployees;