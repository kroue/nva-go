import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../SupabaseClient';

const peso = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n || 0));

const startOfDayISO = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
const endOfDayISO = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();

const monthLabel = (d) =>
  d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

const buildCalendar = (d = new Date()) => {
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = new Date(y, m, 1);
  const startWeekday = first.getDay(); // 0=Sun..6=Sat
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  // Leading blanks
  for (let i = 0; i < startWeekday; i++) cells.push({ key: `b-${i}`, day: null, isToday: false });
  // Month days
  const today = new Date();
  for (let dnum = 1; dnum <= daysInMonth; dnum++) {
    const isToday =
      dnum === today.getDate() &&
      m === today.getMonth() &&
      y === today.getFullYear();
    cells.push({ key: `d-${dnum}`, day: dnum, isToday });
  }
  // Trailing blanks to fill 6 rows (42 cells)
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({ key: `t-${cells.length}`, day: null, isToday: false });
  }
  return cells;
};

const AdminRightPanel = () => {
  const [cells, setCells] = useState(buildCalendar(new Date()));
  const [monthText, setMonthText] = useState(monthLabel(new Date()));
  const [todayBuckets, setTodayBuckets] = useState(Array(8).fill(0)); // 8 x 3h buckets
  const [todayTotal, setTodayTotal] = useState(0);

  useEffect(() => {
    // Calendar for current month
    const now = new Date();
    setCells(buildCalendar(now));
    setMonthText(monthLabel(now));
  }, []);

  useEffect(() => {
    // Load real today's sales and bucketize into 3-hour windows
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

  const chart = useMemo(() => {
    const width = 220;
    const height = 100;
    const pad = 8;
    const innerH = height - pad * 2;
    const max = Math.max(1, ...todayBuckets);
    const barW = 16;
    const gap = (width - pad * 2 - barW * todayBuckets.length) / (todayBuckets.length - 1 || 1);
    const bars = todayBuckets.map((v, i) => {
      const h = Math.round((v / max) * innerH);
      const x = pad + i * (barW + gap);
      const y = height - pad - h;
      return { x, y, h, v };
    });
    return { width, height, pad, barW, bars, max };
  }, [todayBuckets]);

  return (
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
      <div
        style={{
          background: '#252b55',
          borderRadius: 12,
          color: '#fff',
          padding: 18,
          minHeight: 180,
          marginBottom: 12,
          width: '100%',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>{monthText}</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, fontWeight: 600, marginBottom: 8 }}>
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

      {/* Today's Sales */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #252b55',
          padding: 18,
          width: '100%',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18, color: '#252b55', marginBottom: 8 }}>
          Today's Sales
        </div>
        <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
          Sales Overview • Total {peso(todayTotal)}
        </div>
        <div style={{ height: 100, width: '100%', position: 'relative' }}>
          <svg width="100%" height="100" viewBox={`0 0 ${chart.width} ${chart.height}`}>
            {chart.bars.map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={b.y} width={chart.barW} height={b.h} fill="#252b55" rx="3" />
              </g>
            ))}
            <text x={chart.width - 8} y={chart.height - 6} fontSize="12" fill="#888" textAnchor="end">
              Hours (3h)
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default AdminRightPanel;