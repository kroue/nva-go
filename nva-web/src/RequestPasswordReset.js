import React, { useState } from 'react';
import { supabase } from './SupabaseClient';

const RequestPasswordReset = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Password reset link sent! Check your email.');
    }
  };

  return (
    <form onSubmit={handleRequest} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Request Password Reset</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{ width: '100%', padding: 10, marginBottom: 10 }}
      />
      <button type="submit" style={{ width: '100%', padding: 10 }}>Send Reset Link</button>
      {message && <div style={{ marginTop: 10 }}>{message}</div>}
    </form>
  );
};

export default RequestPasswordReset;