import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
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
      setLoading(true);

      // Get logged-in user's name
      try {
        // Check localStorage for name
        const firstName = localStorage.getItem('firstName');
        const userFirstName = localStorage.getItem('userFirstName');
        const employeeFirstName = localStorage.getItem('employeeFirstName');
        const userEmail = localStorage.getItem('userEmail');
        
        console.log('Available localStorage data:');
        console.log('firstName:', firstName);
        console.log('userFirstName:', userFirstName);
        console.log('employeeFirstName:', employeeFirstName);
        console.log('userEmail:', userEmail);
        
        // Try localStorage first
        let foundName = firstName || userFirstName || employeeFirstName;
        
        if (foundName) {
          console.log('Found name in localStorage:', foundName);
          if (mounted) setUserName(foundName);
        } else {
          console.log('No name in localStorage, trying database...');
          
          // Get current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          console.log('Current session:', session);
          console.log('Session error:', sessionError);
          
          const emailToSearch = session?.user?.email || userEmail;
          console.log('Email to search:', emailToSearch);
          
          if (emailToSearch) {
            // Try to get employee info from employees table (not customers)
            const { data: employee, error: employeeError } = await supabase
              .from('employees')
              .select('first_name, last_name, email')
              .eq('email', emailToSearch)
              .maybeSingle();
            
            console.log('Employee query result:', employee);
            console.log('Employee error details:', employeeError);
            
            if (employee?.first_name && mounted) {
              console.log('Setting userName from employees table:', employee.first_name);
              setUserName(employee.first_name);
            } else {
              // Fallback: try customers table in case it's a customer accessing admin
              const { data: customer, error: customerError } = await supabase
                .from('customers')
                .select('first_name, last_name, email')
                .eq('email', emailToSearch)
                .maybeSingle();
              
              console.log('Customer fallback query result:', customer);
              console.log('Customer fallback error details:', customerError);
              
              if (customer?.first_name && mounted) {
                console.log('Setting userName from customers table:', customer.first_name);
                setUserName(customer.first_name);
              } else if (emailToSearch && mounted) {
                // Final fallback: use part of email as name
                const emailName = emailToSearch.split('@')[0];
                const capitalizedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
                console.log('Using email-based name:', capitalizedName);
                setUserName(capitalizedName);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
        // Try to use email as fallback even in error case
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail && mounted) {
          const emailName = userEmail.split('@')[0];
          const capitalizedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          setUserName(capitalizedName);
        }
      }

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