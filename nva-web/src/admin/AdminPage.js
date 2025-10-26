import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../SupabaseClient';
import './AdminPage.css';

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
  // ...existing code...
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
    const height = 220;
    const pad = { top: 16, right: 16, bottom: 28, left: 36 };

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
    for (let i = 0; i <= ticks; i++) {
      const y = pad.top + (i * innerH) / ticks;
      gridLines.push({ x1: pad.left, y1: y, x2: pad.left + innerW, y2: y });
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

  return (
    <div className="AdminHomePage-Header">


      {/* Two-column layout: left = Sales Trend, right = Reports Calendar + Today's Sales */}
    
      <div
        className="AdminHome-layout"
        style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
      >
        {/* Left/main content: Sales Trend */}
        <div style={{ flex: 1, minWidth: 0 }}>
            <div className="AdminHomePage-titlebar">
          <h2 className="HomePage-titlebar-text">Home</h2>
        </div>
          <div className="Dashboard-section HomePage-recent">
            <h2 className="Dashboard-section-title dark">Sales Trend</h2>
            <div className="Card">
              <div style={{ width: '100%', position: 'relative', marginBottom: 8 }}>
                <svg
                  width="100%"
                  height={chart.height}
                  viewBox={`0 0 ${chart.width} ${chart.height}`}
                  role="img"
                >
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#252b55" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#252b55" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {chart.gridLines.map((g, i) => (
                    <line
                      key={i}
                      x1={g.x1}
                      y1={g.y1}
                      x2={g.x2}
                      y2={g.y2}
                      stroke="#eaeaea"
                      strokeWidth="1"
                    />
                  ))}

                  {trend.length > 0 && (
                    <>
                      <path d={chart.areaPath} fill="url(#areaFill)" stroke="none" />
                      <path d={chart.linePath} fill="none" stroke="#22263f" strokeWidth="2.5" />
                    </>
                  )}

                  <text x={chart.pad.left} y={12} fontSize="10" fill="#8a8a8a">
                    Sales (₱)
                  </text>
                  <text
                    x={chart.width - chart.pad.right}
                    y={chart.height - 6}
                    fontSize="10"
                    textAnchor="end"
                    fill="#8a8a8a"
                  >
                    Time
                  </text>
                </svg>
              </div>

              <div className="AdminHome-metricsRow">
                <div className="AdminHome-metric">
                  <div className="label">Total Sales (7 days)</div>
                  <div className="value">{peso(total7Days)}</div>
                </div>

                <div className="AdminHome-metric">
                  <div className="label">New Orders Today</div>
                  <div className="value">{loading ? '—' : ordersToday}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Reports Calendar + Today's Sales */}
        <aside
          className="AdminRightPanel"
          style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div
            style={{
              background: '#d9d9d9',
              color: '#252b55',
              fontSize: 15,
              fontWeight: 800,
              padding: '10px 18px',
              borderRadius: 8,
              textAlign: 'left',
              textTransform: 'uppercase'
            }}
          >
            Reports Calendar
          </div>

          <div
            style={{
              background: '#252b55',
              borderRadius: 8,
              color: '#fff',
              padding: '10px 15px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20, marginTop: 10, textAlign: 'left' }}>{monthText}</div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4,
                fontWeight: 600,
                marginBottom: 10,
                borderTop: '.5px solid #585c7dff',
                borderBottom: '.5px solid #585c7dff',
                padding: 5,
              }}
            >
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={d + i}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {cells.map((c) => (
                <div
                  key={c.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 28,
                  }}
                >
                  {c.day ? (
                    <div
                      style={{
                        background: c.isToday ? '#fff' : 'transparent',
                        color: c.isToday ? '#252b55' : '#fff',
                        borderRadius: '50%',
                        width: 26,
                        height: 26,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: c.isToday ? 700 : 400,
                        fontSize: 15,
                      }}
                    >
                      {c.day}
                    </div>
                  ) : (
                    <div style={{ width: 26, height: 26 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #252b55',
              padding: 18,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 18, color: '#252b55', marginBottom: 8 }}>
              Today's Sales
            </div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
              Sales Overview • Total {peso(todayTotal)}
            </div>
            <div style={{ height: 100, width: '100%', position: 'relative' }}>
              <svg width="100%" height="100" viewBox={`0 0 ${todayChart.width} ${todayChart.height}`}>
                {todayChart.bars.map((b, i) => (
                  <g key={i}>
                    <rect x={b.x} y={b.y} width={todayChart.barW} height={b.h} fill="#252b55" rx="3" />
                  </g>
                ))}
                <text
                  x={todayChart.width - 8}
                  y={todayChart.height - 6}
                  fontSize="12"
                  fill="#888"
                  textAnchor="end"
                >
                  Hours (3h)
                </text>
              </svg>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminPage;