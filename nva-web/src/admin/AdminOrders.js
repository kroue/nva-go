import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../SupabaseClient';
import './AdminOrders.css';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const peso = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n || 0));

const statusClass = (s) => {
  switch ((s || '').toLowerCase()) {
    case 'validation':
      return 'badge badge--pending';
    case 'layout approval':
      return 'badge badge--info';
    case 'printing':
      return 'badge badge--processing';
    case 'for pickup':
      return 'badge badge--shipped';
    case 'finished':
      return 'badge badge--delivered';
    case 'declined':
    case 'cancelled':
      return 'badge badge--cancelled';
    default:
      return 'badge badge--neutral';
  }
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('id,first_name,last_name,status,total,created_at')
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="AdminOrders">
      <div className="AdminOrders-title">Orders</div>

      {/* Toolbar */}
      <div className="AdminOrders-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-box">
            <FilterListIcon className="filter-icon" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="validation">Validation</option>
              <option value="layout approval">Layout Approval</option>
              <option value="printing">Printing</option>
              <option value="for pickup">For Pickup</option>
              <option value="finished">Finished</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="toolbar-right">
          <div className="orders-count">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
          </div>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="AdminOrders-card">
        <div className="table-wrapper">
          <table className="AdminOrders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    <div className="loading-spinner"></div>
                    <p>Loading orders...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    <AssignmentIcon className="empty-icon" />
                    <p>No orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="table-row"
                    onClick={() => navigate(`/orders/${o.id}`)}
                  >
                    <td>
                      <span className="order-id">#{String(o.id).slice(0, 8)}</span>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar">
                          {(o.first_name?.[0] || 'C').toUpperCase()}
                        </div>
                        <span className="customer-name">
                          {[o.first_name, o.last_name].filter(Boolean).join(' ') || 'Customer'}
                        </span>
                      </div>
                    </td>
                    <td className="date-cell">
                      {new Date(o.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <span className={statusClass(o.status)}>{o.status || '—'}</span>
                    </td>
                    <td className="amount-cell">{peso(o.total)}</td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={(e) => e.stopPropagation()}
                        title="More actions"
                      >
                        <MoreVertIcon />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;