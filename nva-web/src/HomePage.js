import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import './HomePage.css';

const HomePage = () => {
  const [processingOrders, setProcessingOrders] = useState([]);
  const [pickupOrders, setPickupOrders] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [salesToday, setSalesToday] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch processing orders (not finished)
      const { data: processing } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'Finished')
        .order('created_at', { ascending: false })
        .limit(5);
      setProcessingOrders(processing || []);

      // Fetch pickup orders
      const { data: pickup } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'For Pickup')
        .order('created_at', { ascending: false });
      setPickupOrders(pickup || []);

      // Fetch unread messages
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: messages } = await supabase
          .from('messages')
          .select('*, customers(first_name, last_name)')
          .eq('receiver', user.email)
          .eq('read', false)
          .order('created_at', { ascending: false });
        setUnreadMessages(messages || []);
      }

      // Fetch today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: sales } = await supabase
        .from('orders')
        .select('*')
        .eq('approved', 'yes')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });
      setSalesToday(sales || []);

      // Fetch pending payments
      const { data: pending } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'Validation')
        .order('created_at', { ascending: false });
      setPendingPayments(pending || []);
    };

    fetchData();

    // Subscribe to changes
    const subscription = supabase
      .channel('homepage-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchData)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="HomePage">
      <div className="HomePage-grid">
        <div className="HomePage-titlebar">
          <h2 className="HomePage-titlebar-text">Home</h2>
        </div>

        <div className="HomePage-pickup">
          <h2 className="Dashboard-section-title dark">To be picked up</h2>
          {pickupOrders.map(order => (
            <div key={order.id} className="Card" onClick={() => navigate(`/orders/${order.id}`)}>
              <p><strong>{order.first_name} {order.last_name}</strong></p>
              <span className="Card-subtext">{order.variant}</span>
              <span className="Card-id">No. {order.id.slice(0, 7)}</span>
            </div>
          ))}
          {pickupOrders.length === 0 && <div className="Card-empty">No orders for pickup</div>}
        </div>

        <div className="Dashboard-section HomePage-recent">
          <h2 className="Dashboard-section-title dark">Recent Transactions</h2>
          {processingOrders.map(order => (
            <div key={order.id} className="Card" onClick={() => navigate(`/orders/${order.id}`)}>
              <p><strong>{order.first_name} {order.last_name}</strong></p>
              <span className="Card-subtext">{order.variant}</span>
              <span className="Card-id">No. {order.id.slice(0, 7)}</span>
              <span className="Card-status">{order.status}</span>
            </div>
          ))}
        </div>

        <div className="HomePage-unread-sales-row">
          <div className="Dashboard-section HomePage-unread">
            <h2 className="Dashboard-section-title dark">
              Unread Messages
              {unreadMessages.length > 0 && 
                <span className="Badge">{unreadMessages.length}</span>
              }
            </h2>
            {unreadMessages.map(msg => (
              <div key={msg.id} className="Card" onClick={() => navigate('/messages')}>
                <p><strong>Message from {msg.customers?.first_name} {msg.customers?.last_name}</strong></p>
                <span className="Card-subtext">{msg.text.slice(0, 50)}...</span>
                <span className="Card-time">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>

          <div className="Dashboard-section HomePage-sales">
            <h2 className="Dashboard-section-title dark">Sales Today</h2>
            <div className="Card">
              <p><strong>Total Sales: ₱{salesToday.reduce((sum, order) => sum + parseFloat(order.total), 0).toFixed(2)}</strong></p>
              <span className="Card-subtext">Orders: {salesToday.length}</span>
            </div>
          </div>
        </div>

        <div className="Dashboard-section HomePage-validate">
          <h2 className="Dashboard-section-title dark">Validate Payment</h2>
          {pendingPayments.map(payment => (
            <div key={payment.id} className="Card" onClick={() => navigate('/orders/validate')}>
              <p><strong>{payment.first_name} {payment.last_name} sent proof of Payment</strong></p>
              <span className="Card-subtext">{payment.payment_proof?.split('/').pop()}</span>
              <span className="Card-id">Gcash</span>
              <span className="Card-id">No. {payment.id.slice(0, 7)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;