import React, { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import './SystemLogs.css'; // Use specific styles

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch system logs
  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100); // Limit to last 100 logs

      if (error) {
        console.error('Error fetching logs:', error);
        setError('Failed to fetch system logs.');
      } else {
        setLogs(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getLogLevelClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return 'log-error';
      case 'warning':
        return 'log-warning';
      case 'info':
        return 'log-info';
      case 'debug':
        return 'log-debug';
      default:
        return 'log-default';
    }
  };

  return (
    <div className="AdminEmployees-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="AdminEmployees-title">System Logs</h2>
        <button
          className="AdminEmployees-add-btn"
          onClick={fetchLogs}
          disabled={loading}
        >
          Refresh Logs
        </button>
      </div>

      {error && <div className="AdminEmployees-error">{error}</div>}

      <div className="AdminEmployees-tableWrap">
        <table className="AdminEmployees-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Level</th>
              <th>Message</th>
              <th>User</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                  Loading logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                  No system logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatTimestamp(log.timestamp)}</td>
                  <td>
                    <span className={`log-level ${getLogLevelClass(log.level)}`}>
                      {log.level || 'UNKNOWN'}
                    </span>
                  </td>
                  <td>{log.message}</td>
                  <td>{log.user_email || log.user_id || 'System'}</td>
                  <td>{log.action || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SystemLogs;
