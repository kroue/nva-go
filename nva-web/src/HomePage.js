import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import { useAuth } from './hooks/useAuth';
import './HomePage.css';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import WavingHandOutlinedIcon from '@mui/icons-material/WavingHandOutlined';

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
  const { user, profile } = useAuth();

  const [recentOrder, setRecentOrder] = useState(null);
  const [pickupOrder, setPickupOrder] = useState(null);
  const [validateOrder, setValidateOrder] = useState(null);

  const [latestSale, setLatestSale] = useState(null);
  const [salesTodayCount, setSalesTodayCount] = useState(0);
  const [salesTodayTotal, setSalesTodayTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      if (!profile) {
        return;
      }

      setLoading(true);

      // Get name from profile - check if profile has first_name property
      if (profile?.first_name) {
        if (mounted) setUserName(profile.first_name);
      } else {
        // Profile is empty object, check localStorage as fallback
        const storedFirstName = localStorage.getItem('firstName') || 
                               localStorage.getItem('userFirstName') || 
                               localStorage.getItem('employeeFirstName');
        
        if (storedFirstName && mounted) {
          setUserName(storedFirstName);
        } else if (user?.email && mounted) {
          // Last resort: use email username
          const emailName = user.email.split('@')[0];
          const capitalizedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          setUserName(capitalizedName);
        }
      }

      // Recent order
      const { data: recent, error: recentError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (recentError) console.error('Error fetching recent order:', recentError);

      // To be picked up: status = 'For Pickup'
      const { data: pickup, error: pickupError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'For Pickup')
        .order('created_at', { ascending: false })
        .limit(1);
      if (pickupError) console.error('Error fetching pickup order:', pickupError);

      // Latest sale
      const { data: latest, error: latestError } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false })
        .limit(1);
      if (latestError) console.error('Error fetching latest sale:', latestError);

      // Sales today summary
      const { data: todaySales, error: todaySalesError } = await supabase
        .from('sales')
        .select('id,total_amount,sale_date')
        .gte('sale_date', startOfTodayISO())
        .lt('sale_date', startOfTomorrowISO());
      if (todaySalesError) console.error('Error fetching today sales:', todaySalesError);

      // Needs payment validation (has proof, not declined, not yet Layout Approval)
      const { data: toValidate, error: toValidateError } = await supabase
        .from('orders')
        .select('*')
        .not('payment_proof', 'is', null)
        .neq('status', 'Declined')
        .neq('status', 'Layout Approval')
        .order('created_at', { ascending: false })
        .limit(1);
      if (toValidateError) console.error('Error fetching orders to validate:', toValidateError);

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
  }, [user, profile]);

  const onOpenOrder = (id) => navigate(`/orders/${id}`);
  const onOpenPickupList = () =>
    navigate(`/orders?status=${encodeURIComponent('For Pickup')}`);
  const onOpenValidate = () => navigate('/orders/validate');
  const onOpenMessages = () => navigate('/messages');
  const onOpenSalesToday = () => navigate('/orders?date=today');

  return (
    <div className="HomePage">
      <div className="HomePage-titlebar">
        <WavingHandOutlinedIcon className="HomePage-titlebar-icon" />
        <h2 className="HomePage-titlebar-text">
          Welcome back, {userName}! Here's what's happening today.
        </h2>
      </div>

      <div className="HomePage-grid">
        <div className="HomePage-pickup">
          <h2 className="Dashboard-section-title dark">
            <LocalShippingOutlinedIcon className="section-icon" />
            To be picked up
          </h2>
          <div
            className={`Card ${loading ? 'loading' : ''}`}
            style={{ cursor: pickupOrder ? 'pointer' : 'default' }}
            onClick={() => (pickupOrder ? onOpenPickupList() : null)}
            role="button"
          >
            {pickupOrder ? (
              <>
                <p><strong>{fullName(pickupOrder)}</strong></p>
                <span className="Card-subtext">{productText(pickupOrder)}</span>
                <span className="Card-id">Order #{fmtId(pickupOrder.id)}</span>
                <span className="Card-status">Ready for Pickup</span>
              </>
            ) : (
              <span className="Card-empty">
                {loading ? 'Loading...' : '✓ All clear! No items waiting for pickup.'}
              </span>
            )}
          </div>
        </div>

        <div className="HomePage-recent">
          <h2 className="Dashboard-section-title dark">
            <HistoryOutlinedIcon className="section-icon" />
            Recent Transactions
          </h2>
          <div
            className={`Card ${loading ? 'loading' : ''}`}
            style={{ cursor: recentOrder ? 'pointer' : 'default' }}
            onClick={() => (recentOrder ? onOpenOrder(recentOrder.id) : null)}
            role="button"
          >
            {recentOrder ? (
              <>
                <p><strong>{fullName(recentOrder)}</strong></p>
                <span className="Card-subtext">{productText(recentOrder)}</span>
                <span className="Card-id">Order #{fmtId(recentOrder.id)}</span>
                {recentOrder.status && (
                  <span className="Card-status">{recentOrder.status}</span>
                )}
              </>
            ) : (
              <span className="Card-empty">
                {loading ? 'Loading...' : 'No recent transactions yet.'}
              </span>
            )}
          </div>
        </div>

        <div className="HomePage-unread">
          <h2 className="Dashboard-section-title dark">
            <ChatBubbleOutlineOutlinedIcon className="section-icon" />
            Unread Messages
          </h2>
          <div
            className="Card"
            style={{ cursor: 'pointer' }}
            onClick={onOpenMessages}
            role="button"
          >
            <p><strong>Messages Center</strong></p>
            <span className="Card-subtext">Click to view all messages</span>
          </div>
        </div>

        <div className="HomePage-sales">
          <h2 className="Dashboard-section-title dark">
            <AttachMoneyOutlinedIcon className="section-icon" />
            Sales Today
          </h2>
          <div
            className={`Card ${loading ? 'loading' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={onOpenSalesToday}
            role="button"
          >
            {!loading && (
              <>
                <p><strong>{peso(salesTodayTotal)}</strong></p>
                <span className="Card-subtext">
                  {salesTodayCount} {salesTodayCount === 1 ? 'sale' : 'sales'} completed today
                </span>
                {latestSale && (
                  <div
                    style={{ 
                      marginTop: 12, 
                      paddingTop: 12,
                      borderTop: '1px solid rgba(0,0,0,0.1)',
                      cursor: latestSale.order_id ? 'pointer' : 'default'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (latestSale.order_id) onOpenOrder(latestSale.order_id);
                    }}
                  >
                    <span className="Card-subtext" style={{ fontSize: '13px' }}>
                      Latest: <strong>{latestSale.customer_name}</strong>
                    </span>
                    <span className="Card-subtext" style={{ fontSize: '13px', display: 'block', marginTop: '4px' }}>
                      {latestSale.product_name} • {peso(latestSale.total_amount)}
                    </span>
                  </div>
                )}
              </>
            )}
            {loading && <span className="Card-empty">Loading sales data...</span>}
          </div>
        </div>

        <div className="HomePage-validate">
          <h2 className="Dashboard-section-title dark">
            <VerifiedOutlinedIcon className="section-icon" />
            Validate Payment
          </h2>
          <div
            className={`Card ${loading ? 'loading' : ''}`}
            style={{ cursor: validateOrder ? 'pointer' : 'default' }}
            onClick={() => (validateOrder ? onOpenValidate() : null)}
            role="button"
          >
            {validateOrder ? (
              <>
                <p><strong>{fullName(validateOrder)} needs validation</strong></p>
                <span className="Card-subtext">Payment proof uploaded</span>
                <span className="Card-subtext" style={{ fontSize: '13px', marginTop: '4px' }}>
                  📎 {fileName(validateOrder.payment_proof)}
                </span>
                <span className="Card-id">Order #{fmtId(validateOrder.id)}</span>
              </>
            ) : (
              <span className="Card-empty">
                {loading ? 'Loading...' : '✓ All payments validated!'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;