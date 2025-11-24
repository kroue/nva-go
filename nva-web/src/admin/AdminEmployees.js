import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from './SupabaseAdminClient';
import './AdminEmployees.css';
import { FaUserPlus, FaUsers, FaSearch } from 'react-icons/fa';

const emptyForm = {
  email: '',
  password: '',
  username: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  address: '',
  position: '',
  is_active: true,
};

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const filteredEmployees = employees.filter((employee) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      searchTerm === '' ||
      employee.email?.toLowerCase().includes(searchLower) ||
      employee.username?.toLowerCase().includes(searchLower) ||
      employee.first_name?.toLowerCase().includes(searchLower) ||
      employee.last_name?.toLowerCase().includes(searchLower) ||
      employee.position?.toLowerCase().includes(searchLower)
    );
  });

  // Fetch all employees
  const fetchEmployees = async () => {
    const { data, error } = await supabaseAdmin
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

    try {
      console.log('Creating user with data:', {
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
        console.error('Auth error:', authError);
        setError(`Signup failed: ${authError.message}`);
        return;
      }

      const userId = authData.user?.id;
      console.log('Created user ID:', userId);

      if (!userId) {
        setError('User creation failed.');
        return;
      }

      // Insert into employees table
      const { error: dbError } = await supabaseAdmin.from('employees').insert({
        id: userId,
        username: form.username,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        address: form.address,
        position: form.position,
        is_active: true,
      });

      if (dbError) {
        console.error('Database error:', dbError);
        setError(`Database insert failed: ${dbError.message}`);
        return;
      }

      setForm(emptyForm);
      setModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Failed to create user.');
    }
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
      is_active: emp.is_active ?? true,
      password: '', // leave blank
    });
    setModalOpen(true);
  };

  // Update employee
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    const { error: dbError } = await supabaseAdmin.from('employees').update({
      username: form.username,
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      phone_number: form.phone_number,
      address: form.address,
      position: form.position,
      is_active: form.is_active,
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
    const employee = employees.find(e => e.id === id);
    setEmployeeToDelete(employee);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (employeeToDelete) {
      await supabaseAdmin.from('employees').delete().eq('id', employeeToDelete.id);
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
      fetchEmployees();
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setEmployeeToDelete(null);
  };

  // Modal close
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  console.log('Supabase object:', supabaseAdmin); // Log the Supabase object

  return (
    <div className="AdminEmployees">
      <div className="AdminEmployees-title">Employees</div>

      <div className="AdminEmployees-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="employees-count">
            {filteredEmployees.length} {filteredEmployees.length === 1 ? 'Employee' : 'Employees'}
          </div>
          <button
            className="add-employee-btn"
            onClick={() => { setModalOpen(true); setEditingId(null); setForm(emptyForm); }}
          >
            <FaUserPlus />
            Add Employee
          </button>
        </div>
      </div>

      <div className="AdminEmployees-card">
        <div className="table-wrapper">
          <table className="AdminEmployees-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Username</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Position</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
                    <FaUsers className="empty-icon" />
                    <p>No employees found</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.email}</td>
                    <td>{emp.username}</td>
                    <td>
                      <div className="employee-name-cell">
                        <div className="employee-avatar">
                          {(emp.first_name?.[0] || 'E').toUpperCase()}
                        </div>
                        <span className="employee-name">
                          {emp.first_name} {emp.last_name}
                        </span>
                      </div>
                    </td>
                    <td>{emp.phone_number}</td>
                    <td>{}</td>
                    <td>
                      <span className={`position-badge ${!emp.is_active ? 'inactive' : ''}`}>
                        {emp.position}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" onClick={() => handleEdit(emp)}>Edit</button>
                        <button className="action-btn delete" onClick={() => handleDelete(emp.id)}>Delete</button>
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
            <h3 className="modal-header">{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
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
                <label className="form-label">Position</label>
                <input
                  className="form-input"
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                />
              </div>
              {editingId && (
                <div className="form-group">
                  <label className="form-label">Employee Status</label>
                  <div className="toggle-switch-container">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className={`toggle-label ${form.is_active ? 'active' : 'inactive'}`}>
                      {form.is_active ? 'Active - Can Login' : 'Inactive - Cannot Login'}
                    </span>
                  </div>
                </div>
              )}
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button type="submit" className="modal-btn primary">
                  {editingId ? 'Update' : 'Add'} Employee
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
      {deleteModalOpen && employeeToDelete && (
        <div className="modal-backdrop" onClick={cancelDelete}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">⚠️</div>
            <h3 className="modal-header">Delete Employee?</h3>
            <p className="delete-modal-message">
              You're about to delete
              <strong>{employeeToDelete.first_name} {employeeToDelete.last_name}</strong>
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

export default AdminEmployees;