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

const AdminPage = () => {
  const [trend, setTrend] = useState([]); // [{key,label,total}]
  const [total7Days, setTotal7Days] = useState(0);
  const [ordersToday, setOrdersToday] = useState(0);
  const [loading, setLoading] = useState(true);

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

  // Build smooth area chart path and gridlines
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

  return (
    <div className="HomePage">
      <div className="HomePage-titlebar">
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
  );
};

export default AdminPage;