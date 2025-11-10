import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../SupabaseClient';

export default function Verification({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const scale = (size) => (width / 375) * size; // Base width 375 for scaling

  const email = route?.params?.email || '';
  const desiredPassword = route?.params?.password || '';
  const profile = {
    first_name: route?.params?.first_name || '',
    last_name: route?.params?.last_name || '',
    address: route?.params?.address || null,
    phone: route?.params?.phone || '',
  };

  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6 digits
  const inputs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [loading, setLoading] = useState(false);
  // Resend cooldown
  const COOLDOWN_DEFAULT = 60; // seconds
  const initialSentAt = route?.params?.sentAt ? Number(route.params.sentAt) : null;
  const [cooldown, setCooldown] = useState(() => {
    if (!initialSentAt) return 0;
    const elapsed = Math.floor((Date.now() - initialSentAt) / 1000);
    return Math.max(0, COOLDOWN_DEFAULT - elapsed);
  });
 
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const clearOtp = () => {
    setOtp(['', '', '', '', '', '']);
    try {
      inputs[0].current?.focus();
    } catch (e) {}
  };

  const handleChange = (text, idx) => {
    if (/^\d*$/.test(text)) {
      const next = [...otp];
      next[idx] = text;
      setOtp(next);
      if (text && idx < 5) inputs[idx + 1].current.focus();
      if (!text && idx > 0) inputs[idx - 1].current.focus();
    }
  };

  const tryVerify = async (email, code) => {
    // try multiple possible 'type' values to be resilient to different OTP flows
    const typesToTry = ['email', 'signup', 'signin', 'magiclink'];
    for (const t of typesToTry) {
      try {
        // call verifyOtp and handle both returned error objects and thrown errors
        const res = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: t,
        });
        // some supabase clients return { data, error } while others might throw;
        const returnedError = res?.error ?? null;
        if (!returnedError) {
          return { success: true };
        }
        const msg = returnedError?.message?.toString?.() || '';
        const lower = msg.toLowerCase();
        if (lower.includes('expire')) {
          return { success: false, fatal: true, error: returnedError };
        }
        // otherwise try next type
      } catch (err) {
        // verifyOtp may throw AuthApiError; determine if it's a fatal verification error
        const msg = err?.message?.toString?.() || '';
        const lower = msg.toLowerCase();
        const fatal = lower.includes('expire') || lower.includes('invalid') || lower.includes('token');
        return { success: false, fatal, error: err };
      }
    }
    return { success: false, fatal: false, error: new Error('verifyOtp failed for all types') };
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    const code = otp.join('');
    if (code.length !== 6 || !email) {
      return;
    }

    setLoading(true);

    try {
      // 1) Verify OTP and create session (try multiple types)
      const verifyResult = await tryVerify(email, code);
      if (!verifyResult.success) {
        const err = verifyResult.error;
        const msg = err?.message?.toString?.() || err?.toString?.() || 'OTP verification failed';
        // use console.warn for expected verification failures to avoid RN RedBox
        console.warn('verifyOtp failed:', msg);

        if (verifyResult.fatal || msg.toLowerCase().includes('expire') || msg.toLowerCase().includes('invalid')) {
          Alert.alert(
            'Invalid or expired code',
            'The OTP has expired or is invalid. Would you like to resend a new code?',
            [
              { text: 'Resend', onPress: async () => { await handleResend(); } },
              { text: 'Cancel', style: 'cancel' },
            ],
            { cancelable: true }
          );
          clearOtp();
          setLoading(false);
          return;
        }

        Alert.alert('Verification failed', msg);
        setLoading(false);
        return;
      }

      // 2) Set the chosen password now that the user is authenticated
      if (desiredPassword) {
        try {
          const { error: pwErr } = await supabase.auth.updateUser({ password: desiredPassword });
          if (pwErr) {
            // Ignore "new password should be different from the old password" error:
            const msg = pwErr?.message?.toString() || '';
            if (msg.includes('different') || msg.includes('should be different')) {
              console.warn('Password update skipped: new password matches existing one.');
            } else {
              console.error('updateUser(password) failed:', pwErr);
            }
          }
        } catch (err) {
          console.error('updateUser threw:', err);
        }
      }

      // 3) Create profile row in public.customers (username = email)
      const { error: insertErr } = await supabase.from('customers').insert({
        username: email,
        email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        address: profile.address,
        phone_number: profile.phone,
      });

      // Ignore unique violation (23505) if already inserted by a retry
      if (insertErr && insertErr.code !== '23505') {
        console.error('Insert customer failed:', insertErr);
      }

      // 4) Sign out and go to Login
      await supabase.auth.signOut();
      navigation.replace('Login');
    } catch (e) {
      console.error('OTP submit error:', e);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    if (cooldown > 0) {
      Alert.alert('Please wait', `Please wait ${cooldown} second${cooldown === 1 ? '' : 's'} before requesting another code.`);
      return;
    }
 
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, type: 'email' },
      });
      if (error) {
        console.error('Resend OTP failed:', error);
        // parse "you can only request this after 42 seconds" message if present
        const msg = error?.message || '';
        const match = msg.match(/after\s+(\d+)\s+seconds/i);
        const wait = match ? Number(match[1]) : COOLDOWN_DEFAULT;
        setCooldown(wait);
        Alert.alert('Resend failed', msg || 'Could not resend OTP');
      } else {
        setCooldown(COOLDOWN_DEFAULT);
        Alert.alert('OTP sent', `A new code was sent to ${email}`);
        clearOtp();
      }
    } catch (err) {
      console.error('Resend threw:', err);
      setCooldown(COOLDOWN_DEFAULT);
      Alert.alert('Resend failed', 'Could not resend OTP');
    }
   };
 
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      paddingHorizontal: scale(28),
      paddingTop: scale(36),
    },
    backBtn: {
      marginBottom: scale(18),
      marginTop: scale(4),
      alignSelf: 'flex-start',
    },
    title: {
      fontSize: scale(22),
      fontWeight: 'bold',
      marginBottom: scale(8),
      marginTop: scale(8),
      color: '#111',
    },
    subtitle: {
      fontSize: scale(15),
      color: '#222',
      marginBottom: scale(28),
    },
    email: {
      fontWeight: 'bold',
      color: '#232B55',
    },
    otpRow: {
      flexDirection: 'row',
      justifyContent: 'center', // Changed from space-between to center
      marginBottom: scale(32),
      marginTop: scale(8),
      paddingHorizontal: scale(16),
    },
    otpInput: {
      width: scale(48), // Slightly reduced from 54
      height: scale(48), // Match width for square look
      borderWidth: 1,
      borderColor: '#222',
      borderRadius: scale(12),
      textAlign: 'center',
      fontSize: scale(22),
      backgroundColor: '#fff',
      marginHorizontal: scale(4), // Increased from 2 for more spacing
    },
    submitBtn: {
      backgroundColor: '#232B55',
      borderRadius: scale(22),
      height: scale(44),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: scale(24),
    },
    submitText: {
      color: '#fff',
      fontSize: scale(17),
      fontWeight: 'bold',
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: scale(12),
    },
    bottomText: {
      color: '#222',
      fontSize: scale(14),
      marginRight: scale(6),
    },
    resendText: {
      color: '#D32F2F',
      fontSize: scale(14),
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <FontAwesome name="arrow-left" size={20} color="#222" />
      </TouchableOpacity>
      <Text style={styles.title}>OTP Verification</Text>
      <Text style={styles.subtitle}>
        Enter the One Time Password sent to <Text style={styles.email}>{email}</Text>
      </Text>
      <View style={styles.otpRow}>
        {otp.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={inputs[idx]}
            style={styles.otpInput}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, idx)}
            returnKeyType="next"
            autoFocus={idx === 0}
          />
        ))}
      </View>
      <TouchableOpacity
        style={[styles.submitBtn, loading ? { opacity: 0.7 } : null]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
      </TouchableOpacity>
      <View style={styles.bottomRow}>
        <Text style={styles.bottomText}>Didn't receive the OTP?</Text>
        <TouchableOpacity onPress={handleResend} disabled={cooldown > 0} style={cooldown > 0 ? { opacity: 0.6 } : null}>
          <Text style={styles.resendText}>{cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
