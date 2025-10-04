import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './HomePage.css';

const fmtId = (id) => (typeof id === 'string' ? id.slice(0, 6) : id);
const peso = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n || 0));
const fullName = (o) => [o?.first_name, o?.last_name].filter(Boolean).join(' ') || 'Customer';
const productText = (o) =>
  o?.product_name ||
  o?.item_name ||
  o?.service_name ||
  o?.product_type ||
  o?.item ||
  'Order';
const fileName = (url) => (url ? url.split('/').pop() : '');

const startOfTodayISO = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return start.toISOString();
};
const startOfTomorrowISO = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return start.toISOString();
};

const HomePage = () => {
  const navigate = useNavigate();

  const [recentOrder, setRecentOrder] = useState(null);
  const [pickupOrder, setPickupOrder] = useState(null);
  const [validateOrder, setValidateOrder] = useState(null);

  const [latestSale, setLatestSale] = useState(null);
  const [salesTodayCount, setSalesTodayCount] = useState(0);
  const [salesTodayTotal, setSalesTodayTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      // Recent order
      const { data: recent } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      // To be picked up: status = 'For Pickup'
      const { data: pickup } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'For Pickup')
        .order('created_at', { ascending: false })
        .limit(1);

      // Latest sale
      const { data: latest } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false })
        .limit(1);

      // Sales today summary
      const { data: todaySales } = await supabase
        .from('sales')
        .select('id,total_amount,sale_date')
        .gte('sale_date', startOfTodayISO())
        .lt('sale_date', startOfTomorrowISO());

      // Needs payment validation (has proof, not declined, not yet Layout Approval)
      const { data: toValidate } = await supabase
        .from('orders')
        .select('*')
        .not('payment_proof', 'is', null)
        .neq('status', 'Declined')
        .neq('status', 'Layout Approval')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!mounted) return;

      setRecentOrder(recent?.[0] || null);
      setPickupOrder(pickup?.[0] || null);
      setValidateOrder(toValidate?.[0] || null);

      setLatestSale(latest?.[0] || null);
      setSalesTodayCount(todaySales?.length || 0);
      setSalesTodayTotal((todaySales || []).reduce((s, r) => s + Number(r.total_amount || 0), 0));

      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const onOpenOrder = (id) => navigate(`/orders/${id}`);
  const onOpenPickupList = () =>
    navigate(`/orders?status=${encodeURIComponent('For Pickup')}`);
  const onOpenValidate = () => navigate('/orders/validate');
  const onOpenMessages = () => navigate('/messages');
  const onOpenSalesToday = () => navigate('/orders?date=today');

  return (
    <div className="HomePage">
      <div className="HomePage-grid">
        <div className="HomePage-titlebar">
          <h2 className="HomePage-titlebar-text">Home</h2>
        </div>

        <div className="HomePage-pickup">
          <h2 className="Dashboard-section-title dark">To be picked up</h2>
          <div
            className="Card"
            style={{ cursor: pickupOrder ? 'pointer' : 'default' }}
            onClick={() => (pickupOrder ? onOpenPickupList() : null)}
            role="button"
          >
            {pickupOrder ? (
              <>
                <p><strong>{fullName(pickupOrder)}</strong></p>
                <span className="Card-subtext">{productText(pickupOrder)}</span>
                <span className="Card-id">No. {fmtId(pickupOrder.id)}</span>
              </>
            ) : (
              <span className="Card-subtext">
                {loading ? 'Loading...' : 'No items ready for pickup.'}
              </span>
            )}
          </div>
          <div className="Card"></div>
        </div>

        <div className="HomePage-welcome">
          <h1 className="HomePage-title">
            Welcome back, Aljohn! Here's what's happening today.
          </h1>
        </div>

        <div className="Dashboard-section HomePage-recent">
          <h2 className="Dashboard-section-title dark">Recent Transactions</h2>
          <div
            className="Card"
            style={{ cursor: recentOrder ? 'pointer' : 'default' }}
            onClick={() => (recentOrder ? onOpenOrder(recentOrder.id) : null)}
            role="button"
          >
            {recentOrder ? (
              <>
                <p><strong>{fullName(recentOrder)}</strong></p>
                <span className="Card-subtext">{productText(recentOrder)}</span>
                <span className="Card-id">No. {fmtId(recentOrder.id)}</span>
              </>
            ) : (
              <span className="Card-subtext">
                {loading ? 'Loading...' : 'No recent transactions.'}
              </span>
            )}
          </div>
        </div>

        <div className="HomePage-unread-sales-row">
          <div className="Dashboard-section HomePage-unread">
            <h2 className="Dashboard-section-title dark">Unread Messages</h2>
            <div
              className="Card"
              style={{ cursor: 'pointer' }}
              onClick={onOpenMessages}
              role="button"
            >
              <span className="Card-subtext">Open Messages</span>
            </div>
          </div>

          <div className="Dashboard-section HomePage-sales">
            <h2 className="Dashboard-section-title dark">Sales Today</h2>
            <div
              className="Card"
              style={{ cursor: 'pointer' }}
              onClick={onOpenSalesToday}
              role="button"
            >
              <span className="Card-subtext">
                {loading
                  ? 'Loading...'
                  : `${salesTodayCount} sale(s) • ${peso(salesTodayTotal)} today`}
              </span>
              {latestSale ? (
                <div
                  style={{ marginTop: 8, textDecoration: latestSale.order_id ? 'underline' : 'none', opacity: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (latestSale.order_id) onOpenOrder(latestSale.order_id);
                  }}
                >
                  Latest: {latestSale.customer_name} • {latestSale.product_name} • {peso(latestSale.total_amount)}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="Dashboard-section HomePage-validate">
          <h2 className="Dashboard-section-title dark">Validate Payment</h2>
          <div
            className="Card"
            style={{ cursor: validateOrder ? 'pointer' : 'default' }}
            onClick={() => (validateOrder ? onOpenValidate() : null)}
            role="button"
          >
            {validateOrder ? (
              <>
                <p><strong>{fullName(validateOrder)} needs validation</strong></p>
                <span className="Card-subtext">{fileName(validateOrder.payment_proof)}</span>
                <span className="Card-id">No. {fmtId(validateOrder.id)}</span>
              </>
            ) : (
              <span className="Card-subtext">No payments awaiting validation.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;