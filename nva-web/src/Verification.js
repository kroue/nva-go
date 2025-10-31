import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './SupabaseClient';

const Verification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, password, first_name, last_name } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');

  const handleChange = (text, idx) => {
    if (/^\d*$/.test(text)) {
      const next = [...otp];
      next[idx] = text;
      setOtp(next);
      if (text && idx < 5) {
        const nextInput = document.getElementById(`otp-${idx + 1}`);
        if (nextInput) nextInput.focus();
      }
      if (!text && idx > 0) {
        const prevInput = document.getElementById(`otp-${idx - 1}`);
        if (prevInput) prevInput.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6 || !email) return;

    try {
      // 1) Verify OTP and confirm email
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup',
      });
      if (verifyErr) {
        setError(verifyErr.message || 'Invalid OTP.');
        return;
      }

      // 2) Set password for the user
      const { error: updateErr } = await supabase.auth.updateUser({
        password,
      });
      if (updateErr) {
        console.error('Update password failed:', updateErr);
        // Continue anyway, as user is verified
      }

      // 3) Create profile row in public.customers (username = email)
      const { error: insertErr } = await supabase.from('customers').insert({
        username: email,
        email,
        first_name,
        last_name,
      });

      // Ignore unique violation (23505) if already inserted by a retry
      if (insertErr) {
        console.error('Insert customer failed:', insertErr);
        if (insertErr.code !== '23505') {
          setError(`Database error saving new user: ${insertErr.message || insertErr.details || JSON.stringify(insertErr)}`);
          return;
        }
      }

      // 4) Sign out and go to Login
      await supabase.auth.signOut();
      navigate('/login');
    } catch (e) {
      setError('Network error. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!email) return;
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>OTP Verification</h2>
      <p>Enter the One Time Password sent to {email}</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-${idx}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target.value, idx)}
              style={{
                width: '50px',
                height: '50px',
                textAlign: 'center',
                fontSize: '20px',
                border: '1px solid #ccc',
                borderRadius: '5px',
              }}
            />
          ))}
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#232B55', color: 'white', border: 'none', borderRadius: '5px' }}>
          Submit
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        Didn't receive the OTP? <button onClick={handleResend} style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>Resend</button>
      </p>
    </div>
  );
};

export default Verification;
