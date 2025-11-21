import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../SupabaseClient';
import './AdminPage.css';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import WavingHandOutlinedIcon from '@mui/icons-material/WavingHandOutlined';

const peso = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n || 0));

const startOfDayISO = (d = new Date()) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return x.toISOString();
};
const nDaysAgoStartISO = (n = 6) => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - n);
  return d.toISOString();
};
const endOfDayISO = (d = new Date()) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return x.toISOString();
};

// NEW: helpers for inline "Right Panel"
const monthLabel = (d) =>
  d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

const buildCalendar = (d = new Date()) => {
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = new Date(y, m, 1);
  const startWeekday = first.getDay(); // 0 Sun..6 Sat
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ key: `b-${i}`, day: null, isToday: false });
  const today = new Date();
  for (let dnum = 1; dnum <= daysInMonth; dnum++) {
    const isToday = dnum === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    cells.push({ key: `d-${dnum}`, day: dnum, isToday });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({ key: `t-${cells.length}`, day: null, isToday: false });
  }
  return cells;
};

const AdminPage = () => {
  const navigate = useNavigate();
  // ...existing state...
  const [trend, setTrend] = useState([]); // [{key,label,total}]
  const [total7Days, setTotal7Days] = useState(0);
  const [ordersToday, setOrdersToday] = useState(0);
  const [loading, setLoading] = useState(true);

  // NEW: inline RightPanel state
  const [cells, setCells] = useState(buildCalendar(new Date()));
  const [monthText, setMonthText] = useState(monthLabel(new Date()));
  const [todayBuckets, setTodayBuckets] = useState(Array(8).fill(0)); // 8 x 3h buckets
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const fromISO = nDaysAgoStartISO(6);
      const toISO = endOfDayISO(new Date());

      const { data: salesRows, error: salesErr } = await supabase
        .from('sales')
        .select('total_amount,sale_date')
        .gte('sale_date', fromISO)
        .lt('sale_date', toISO);

      const { count: ordersCnt } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDayISO())
        .lt('created_at', endOfDayISO());

      if (salesErr) {
        console.error(salesErr);
      }
      if (!mounted) return;

      const map = new Map();
      (salesRows || []).forEach((r) => {
        const d = new Date(r.sale_date);
        const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        map.set(k, (map.get(k) || 0) + Number(r.total_amount || 0));
      });

      const labels = [];
      let rollingTotal = 0;
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const amt = map.get(k) || 0;
        rollingTotal += amt;
        labels.push({
          key: k,
          label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          total: amt,
        });
      }

      setTrend(labels);
      setTotal7Days(rollingTotal);
      setOrdersToday(ordersCnt || 0);
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // NEW: init calendar
  useEffect(() => {
    const now = new Date();
    setCells(buildCalendar(now));
    setMonthText(monthLabel(now));
  }, []);

  // NEW: load today's sales and bucketize into 3-hour windows
  useEffect(() => {
    const loadToday = async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('total_amount,sale_date')
        .gte('sale_date', startOfDayISO())
        .lt('sale_date', endOfDayISO());

      if (error) {
        console.error('Failed to load today sales:', error);
        return;
      }

      const buckets = Array(8).fill(0);
      (data || []).forEach((r) => {
        const dt = new Date(r.sale_date);
        const hour = dt.getHours();
        const idx = Math.max(0, Math.min(7, Math.floor(hour / 3)));
        buckets[idx] += Number(r.total_amount || 0);
      });

      setTodayBuckets(buckets);
      setTodayTotal(buckets.reduce((s, v) => s + v, 0));
    };

    loadToday();
  }, []);

  // Build smooth area chart path and gridlines (existing)
  const chart = useMemo(() => {
    const width = 640;
    const height = 280;
    const pad = { top: 40, right: 40, bottom: 50, left: 60 };

    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const max = Math.max(1, ...trend.map((t) => t.total));
    const stepX = trend.length > 1 ? innerW / (trend.length - 1) : innerW;

    const pts = trend.map((t, i) => {
      const x = pad.left + i * stepX;
      const y = pad.top + innerH - (t.total / max) * innerH;
      return [x, y];
    });

    const toPath = (points) => {
      if (points.length < 2) return '';
      const d = [];
      d.push(`M ${points[0][0]},${points[0][1]}`);
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[0];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i !== points.length - 2 ? points[i + 2] : p2;

        const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
        const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
        const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
        const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

        d.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`);
      }
      return d.join(' ');
    };

    const linePath = toPath(pts);
    const areaPath =
      linePath +
      ` L ${pad.left + innerW},${pad.top + innerH} L ${pad.left},${pad.top + innerH} Z`;

    const gridLines = [];
    const ticks = 5;
    const yLabels = [];
    for (let i = 0; i <= ticks; i++) {
      const y = pad.top + (i * innerH) / ticks;
      const value = max - (i * max) / ticks;
      gridLines.push({ x1: pad.left, y1: y, x2: pad.left + innerW, y2: y });
      yLabels.push({ y, value });
    }

    return {
      width,
      height,
      pad,
      innerW,
      innerH,
      linePath,
      areaPath,
      gridLines,
      yLabels,
      pts,
      max,
    };
  }, [trend]);

  // NEW: mini bar chart for today
  const todayChart = useMemo(() => {
    const width = 220;
    const height = 100;
    const pad = 8;
    const innerH = height - pad * 2;
    const max = Math.max(1, ...todayBuckets);
    const barW = 16;
    const gap =
      (width - pad * 2 - barW * todayBuckets.length) /
      (todayBuckets.length - 1 || 1);
    const bars = todayBuckets.map((v, i) => {
      const h = Math.round((v / max) * innerH);
      const x = pad + i * (barW + gap);
      const y = height - pad - h;
      return { x, y, h, v };
    });
    return { width, height, pad, barW, bars, max };
  }, [todayBuckets]);

  const handleDateClick = (day) => {
    if (!day) return;
    
    // Get the current month/year from monthText
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Create date string in YYYY-MM-DD format
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Navigate to sales report with date query parameter
    navigate(`/admin/sales-report?date=${dateStr}`);
  };

  return (
    <div className="HomePage">
      <div className="HomePage-titlebar">
        <WavingHandOutlinedIcon className="HomePage-titlebar-icon" />
        <h2 className="HomePage-titlebar-text">
          Welcome back! Here's your sales overview.
        </h2>
      </div>

      <div className="HomePage-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Sales Trend Card */}
        <div className="Dashboard-section HomePage-sales-trend">
          <h2 className="Dashboard-section-title dark">
            <TrendingUpOutlinedIcon className="section-icon" />
            Sales Trend (7 Days)
          </h2>
          <div className="Card">
            <div style={{ width: '100%', position: 'relative' }}>
              <svg
                width="100%"
                height={chart.height}
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                role="img"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#252b55" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#252b55" stopOpacity="0.02" />
                  </linearGradient>
                  <filter id="shadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
                  </filter>
                </defs>

                {/* Grid lines */}
                {chart.gridLines.map((g, i) => (
                  <line
                    key={i}
                    x1={g.x1}
                    y1={g.y1}
                    x2={g.x2}
                    y2={g.y2}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Y-axis labels */}
                {chart.yLabels.map((label, i) => (
                  <text
                    key={i}
                    x={chart.pad.left - 10}
                    y={label.y + 4}
                    fontSize="11"
                    fill="#6b7280"
                    textAnchor="end"
                    fontWeight="500"
                  >
                    {peso(label.value).replace('.00', '')}
                  </text>
                ))}

                {/* Chart area and line */}
                {trend.length > 0 && (
                  <>
                    <path d={chart.areaPath} fill="url(#areaFill)" stroke="none" />
                    <path 
                      d={chart.linePath} 
                      fill="none" 
                      stroke="#252b55" 
                      strokeWidth="3" 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Data points */}
                    {chart.pts.map((pt, i) => (
                      <g key={i}>
                        <circle
                          cx={pt[0]}
                          cy={pt[1]}
                          r="5"
                          fill="#fff"
                          stroke="#252b55"
                          strokeWidth="2.5"
                          style={{ cursor: 'pointer' }}
                        >
                          <title>{trend[i].label}: {peso(trend[i].total)}</title>
                        </circle>
                      </g>
                    ))}
                  </>
                )}

                {/* X-axis labels */}
                {trend.map((t, i) => {
                  const x = chart.pad.left + i * (chart.innerW / (trend.length - 1 || 1));
                  return (
                    <text
                      key={i}
                      x={x}
                      y={chart.height - 20}
                      fontSize="11"
                      fill="#6b7280"
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      {t.label}
                    </text>
                  );
                })}

                {/* Axis labels */}
                <text 
                  x={chart.pad.left - 45} 
                  y={chart.pad.top - 10} 
                  fontSize="12" 
                  fill="#374151"
                  fontWeight="600"
                >
                  Sales (₱)
                </text>
                <text
                  x={chart.width / 2}
                  y={chart.height - 5}
                  fontSize="12"
                  textAnchor="middle"
                  fill="#374151"
                  fontWeight="600"
                >
                  Last 7 Days
                </text>
              </svg>
            </div>

            <div className="AdminHome-statsRow">
              <div className="stat-card">
                <AttachMoneyOutlinedIcon className="stat-icon" />
                <div className="stat-content">
                  <div className="stat-label">Total Sales (7 days)</div>
                  <div className="stat-value">{peso(total7Days)}</div>
                </div>
              </div>

              <div className="stat-card">
                <AssignmentOutlinedIcon className="stat-icon" />
                <div className="stat-content">
                  <div className="stat-label">New Orders Today</div>
                  <div className="stat-value">{loading ? '—' : ordersToday}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calendar + Today's Sales */}
        <div className="HomePage-right-column">
          {/* Calendar Card */}
          <div className="Dashboard-section">
            <h2 className="Dashboard-section-title dark">
              <CalendarMonthOutlinedIcon className="section-icon" />
              Reports Calendar
            </h2>
            <div className="Card calendar-card">
              <div className="calendar-header">{monthText}</div>
              
              <div className="calendar-weekdays">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={d + i} className="weekday">{d}</div>
                ))}
              </div>

              <div className="calendar-grid">
                {cells.map((c) => (
                  <div key={c.key} className="calendar-cell">
                    {c.day && (
                      <div 
                        className={`calendar-day ${c.isToday ? 'today' : ''}`}
                        onClick={() => handleDateClick(c.day)}
                      >
                        {c.day}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Sales Card */}
          <div className="Dashboard-section">
            <h2 className="Dashboard-section-title dark">
              <AttachMoneyOutlinedIcon className="section-icon" />
              Today's Sales
            </h2>
            <div className="Card today-sales-card">
              <div className="today-total">
                <span className="today-label">Total</span>
                <span className="today-amount">{peso(todayTotal)}</span>
              </div>
              
              <div className="today-chart">
                <svg width="100%" height="120" viewBox={`0 0 ${todayChart.width} ${todayChart.height + 20}`}>
                  {todayChart.bars.map((b, i) => (
                    <g key={i}>
                      <rect 
                        x={b.x} 
                        y={b.y} 
                        width={todayChart.barW} 
                        height={b.h} 
                        fill="#252b55" 
                        rx="3" 
                      />
                      {b.v > 0 && (
                        <text
                          x={b.x + todayChart.barW / 2}
                          y={b.y - 4}
                          fontSize="9"
                          fill="#666"
                          textAnchor="middle"
                        >
                          {peso(b.v).replace('₱', '').replace('.00', '')}
                        </text>
                      )}
                    </g>
                  ))}
                  <text
                    x={todayChart.width / 2}
                    y={todayChart.height + 16}
                    fontSize="11"
                    fill="#888"
                    textAnchor="middle"
                  >
                    Sales by 3-Hour Intervals
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;