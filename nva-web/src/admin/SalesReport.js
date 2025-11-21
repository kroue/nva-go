import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../SupabaseClient';
import './SalesReport.css';

const peso = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n || 0));

const startOfDayISO = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
const endOfDayISO = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();

export default function SalesReport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState(() => {
    const urlDate = searchParams.get('date');
    return urlDate || new Date().toISOString().slice(0, 10);
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (theDate) => {
    setLoading(true);
    const d = new Date(theDate + 'T00:00:00');
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .gte('sale_date', startOfDayISO(d))
      .lt('sale_date', endOfDayISO(d))
      .order('sale_date', { ascending: true });

    if (!error) setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load(date);
    // Update URL when date changes
    setSearchParams({ date });
  }, [date, setSearchParams]);

  // Update date when URL parameter changes
  useEffect(() => {
    const urlDate = searchParams.get('date');
    if (urlDate && urlDate !== date) {
      setDate(urlDate);
    }
  }, [searchParams]);

  const totals = useMemo(() => {
    const totalQty = rows.reduce((s, r) => s + Number(r.quantity || 0), 0);
    const subtotal = rows.reduce((s, r) => s + Number(r.subtotal || 0), 0);
    const layout = rows.reduce((s, r) => s + Number(r.layout_fee || 0), 0);
    const grand = rows.reduce((s, r) => s + Number(r.total_amount || 0), 0);
    return { totalQty, subtotal, layout, grand };
  }, [rows]);

  // Hidden-iframe print (no new window). Clones only the report card with minimal print CSS.
  const handlePrint = () => {
    const node = document.getElementById('SalesReport-print');
    if (!node) return;

    const css = `
      @page { size: A4; margin: 14mm; }
      body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #101828; }
      .SalesReport-card { background: #fff; }
      .SalesReport-header { display: flex; justify-content: space-between; padding: 0 0 10px 0; border-bottom: 1px solid #eef0f4; }
      .SalesReport-company .name { font-weight: 800; color: #252b55; }
      .SalesReport-company .addr { font-size: 12px; color: #667085; }
      .SalesReport-meta .report { font-weight: 800; color: #252b55; text-align: right; }
      .SalesReport-meta .date { font-size: 12px; color: #667085; text-align: right; }
      .SalesReport-summary { display: flex; gap: 18px; padding: 8px 0; font-size: 14px; color: #344054; border-bottom: 1px solid #f1f1f1; }
      .SalesReport-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      .SalesReport-table thead th { text-align: left; color: #344054; font-weight: 700; padding: 8px; border-bottom: 1px solid #eef0f4; background: #fafbff; font-size: 12px; }
      .SalesReport-table tbody td, .SalesReport-table tfoot td { padding: 8px; border-bottom: 1px solid #f1f1f1; font-size: 12px; }
      .SalesReport-table .num { text-align: right; white-space: nowrap; }
      .SalesReport-table .total { font-weight: 700; color: #252b55; }
      .SalesReport-footer { margin-top: 8px; font-size: 12px; color: #98a2b3; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>Sales Report</title><style>${css}</style></head><body>${node.outerHTML}</body></html>`);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 300);
    };
  };

  return (
    <div className="SalesReport">
      <div className="SalesReport-title">Sales Report</div>
      <div className="SalesReport-toolbar">
        <div className="SalesReport-filter">
          <label htmlFor="sr-date">Date</label>
          <input
            id="sr-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <button className="SalesReport-printBtn" onClick={handlePrint} type="button">
          🖨️ Print Report
        </button>
      </div>

      <div id="SalesReport-print" className="SalesReport-card">
        <div className="SalesReport-header">
          <div className="SalesReport-company">
            <div className="name">NVA PRINTING SERVICES</div>
            <div className="addr">Pabayo - Chavez St. Plaza Divisoria CDO<br/>📞 0917 717 4889</div>
          </div>
          <div className="SalesReport-meta">
            <div className="report">Daily Sales Report</div>
            <div className="date">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        <div className="SalesReport-summary">
          <div className="summary-item">
            <div className="summary-label">Transactions</div>
            <div className="summary-value">{rows.length}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Total Quantity</div>
            <div className="summary-value">{totals.totalQty}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Grand Total</div>
            <div className="summary-value">{peso(totals.grand)}</div>
          </div>
        </div>

        <div className="table-container">
          <table className="SalesReport-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Variant</th>
                <th className="num">Qty</th>
                <th className="num">Unit</th>
                <th className="num">Subtotal</th>
                <th className="num">Layout</th>
                <th className="num">Total</th>
                <th>Source</th>
                <th>Employee</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="muted" colSpan={12}>Loading sales data...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td className="muted" colSpan={12}>No sales found for this date.</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td><span className="time-cell">{new Date(r.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                    <td><span className="order-id-cell">{r.order_id ? String(r.order_id).slice(0, 8) : '—'}</span></td>
                    <td>{r.customer_name}</td>
                    <td>{r.product_name}</td>
                    <td>{r.variant || '—'}</td>
                    <td className="num">{r.quantity}</td>
                    <td className="num">{peso(r.unit_price)}</td>
                    <td className="num">{peso(r.subtotal)}</td>
                    <td className="num">{peso(r.layout_fee)}</td>
                    <td className="num total">{peso(r.total_amount)}</td>
                    <td><span className="source-badge">{r.order_source || 'web'}</span></td>
                    <td>{r.employee_name || (r.employee_email ? r.employee_email.split('@')[0] : '—')}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="right">TOTALS</td>
                <td className="num total">{totals.totalQty}</td>
                <td className="num">—</td>
                <td className="num total">{peso(totals.subtotal)}</td>
                <td className="num total">{peso(totals.layout)}</td>
                <td className="num total">{peso(totals.grand)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="SalesReport-footer">
          Generated by NVAGo System • {new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      </div>
    </div>
  );
}