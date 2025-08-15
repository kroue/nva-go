import React from 'react';
import './HomePage.css';
import BarChartIcon from '@mui/icons-material/BarChart';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentIcon from '@mui/icons-material/Assignment';

const salesTrendData = [1200, 900, 1100, 1300, 1250, 1400, 1350];
const todaySalesData = [200, 150, 180, 220, 210, 250, 230];

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
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 18,
          height: 'calc(100vh - 36px)', // 18px top + 18px bottom padding
        }}
      >
        {/* Left Main Section */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        {/* Right Section */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Reports Calendar Title */}
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
              textAlign: 'left',
            }}
          >
            Reports Calendar
          </div>
          {/* Calendar */}
          <div style={{ background: '#252b55', borderRadius: 12, color: '#fff', padding: 18, minHeight: 180, marginBottom: 12, width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>MAY 2025</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, fontWeight: 600, marginBottom: 8 }}>
              {['S','M','T','W','T','F','S'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: 31 }, (_, i) => (
                <div
                  key={i+1}
                  style={{
                    background: i+1 === 18 ? '#fff' : 'transparent',
                    color: i+1 === 18 ? '#252b55' : '#fff',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: i+1 === 18 ? 700 : 400,
                    margin: '2px auto'
                  }}
                >
                  {i+1}
                </div>
              ))}
            </div>
          </div>
          {/* Today's Sales */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #252b55', padding: 18, width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#252b55', marginBottom: 8 }}>Today's Sales</div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>Sales Overview</div>
            <div style={{ height: 80, width: '100%', position: 'relative' }}>
              <svg width="100%" height="80" viewBox="0 0 180 80">
                {todaySalesData.map((v, i) => (
                  <rect
                    key={i}
                    x={i * 25 + 10}
                    y={80 - v / 2}
                    width="18"
                    height={v / 2}
                    fill="#252b55"
                  />
                ))}
                <text x="140" y="75" fontSize="12" fill="#888">Days</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;