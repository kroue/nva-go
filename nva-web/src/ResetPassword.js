// Example: src/ResetPassword.js
import React, { useEffect, useState } from 'react';
import { supabase } from './SupabaseClient';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Listen for the recovery session from the URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionChecked(true);
      }
    });

    // Check if already authenticated (for direct loads)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Password reset successful! You can now log in.');
    }
  };

  if (!sessionChecked) {
    return <div>Loading password reset session...</div>;
  }

  return (
    <form onSubmit={handleReset} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Set New Password</h2>
      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        required
        style={{ width: '100%', padding: 10, marginBottom: 10 }}
      />
      <button type="submit" style={{ width: '100%', padding: 10 }}>Reset Password</button>
      {message && <div style={{ marginTop: 10 }}>{message}</div>}
    </form>
  );
};

export default ResetPassword;