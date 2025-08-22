import React from 'react';
import './HomePage.css';
import BarChartIcon from '@mui/icons-material/BarChart';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentIcon from '@mui/icons-material/Assignment';

const salesTrendData = [1200, 900, 1100, 1300, 1250, 1400, 1350];

const AdminPage = () => {
  return (
    <div
      className="HomePage"
      style={{
        height: '100vh',
        background: '#f9f9f9',
        overflow: 'hidden',
        minWidth: 900,
        boxSizing: 'border-box',
        padding: '18px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Home Title + Sales Trend */}
        <div>
          <div
            style={{
              background: '#e5e5e5',
              borderRadius: 12,
              padding: '12px 24px',
              fontWeight: 700,
              fontSize: 28,
              color: '#252b55',
              width: '100%',
              marginBottom: 12,
            }}
          >
            Home
          </div>
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #ccc',
              padding: 18,
              marginBottom: 12,
              width: '100%',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Sales Trend</div>
            <div style={{ height: 110, width: '100%', position: 'relative', marginBottom: 8 }}>
              <svg width="100%" height="100" viewBox="0 0 300 100">
                <polyline
                  fill="none"
                  stroke="#252b55"
                  strokeWidth="3"
                  points={
                    salesTrendData
                      .map((v, i) => `${i * 50},${100 - (v - 900) / 6}`)
                      .join(' ')
                  }
                />
                <text x="0" y="95" fontSize="12" fill="#888">Sales ($)</text>
                <text x="260" y="95" fontSize="12" fill="#888">Time</text>
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 18 }}>
              <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #eee', padding: 12, minWidth: 100 }}>
                <div style={{ fontSize: 14, color: '#888' }}>Total Sales</div>
                <div style={{ fontWeight: 700, fontSize: 20 }}>$1,200</div>
                <div style={{ fontSize: 13, color: '#38d959' }}>+5%</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #eee', padding: 12, minWidth: 100 }}>
                <div style={{ fontSize: 14, color: '#888' }}>New Orders</div>
                <div style={{ fontWeight: 700, fontSize: 20 }}>15</div>
                <div style={{ fontSize: 13, color: '#38d959' }}>+3</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #eee', padding: 12, minWidth: 100 }}>
                <div style={{ fontSize: 14, color: '#888' }}>Returned Items</div>
                <div style={{ fontWeight: 700, fontSize: 20 }}>0</div>
              </div>
            </div>
          </div>
        </div>
        {/* Quick Access Tools */}
        <div style={{ marginTop: 'auto', marginBottom: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 22, textAlign: 'center', marginBottom: 12 }}>
            Quick Access Tools
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 36 }}>
            <div style={{ textAlign: 'center' }}>
              <AssignmentIcon style={{ fontSize: 40, color: '#252b55' }} />
              <div style={{ fontSize: 15, marginTop: 8 }}>Order Management</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <BarChartIcon style={{ fontSize: 40, color: '#252b55' }} />
              <div style={{ fontSize: 15, marginTop: 8 }}>Sales Reports</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <PrintIcon style={{ fontSize: 40, color: '#252b55' }} />
              <div style={{ fontSize: 15, marginTop: 8 }}>Print Jobs</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <SettingsIcon style={{ fontSize: 40, color: '#252b55' }} />
              <div style={{ fontSize: 15, marginTop: 8 }}>Settings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;