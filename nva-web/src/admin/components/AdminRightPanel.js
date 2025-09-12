import React from 'react';

const todaySalesData = [200, 150, 180, 220, 210, 250, 230];

const AdminRightPanel = () => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 320 }}>
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
        {['S','M','T','W','T','F','S'].map((d, i) => <div key={d + i}>{d}</div>)}
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
);

export default AdminRightPanel;