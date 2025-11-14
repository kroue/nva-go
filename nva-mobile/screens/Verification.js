import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, Alert, ActivityIndicator, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../SupabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

export default function Verification({ navigation, route }) {
  const email = route?.params?.email || '';
  const desiredPassword = route?.params?.password || '';
  const profile = {
    first_name: route?.params?.first_name || '',
    last_name: route?.params?.last_name || '',
    address: route?.params?.address || null,
    phone: route?.params?.phone || '',
  };

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Resend cooldown
  const COOLDOWN_DEFAULT = 60;
  const initialSentAt = route?.params?.sentAt ? Number(route.params.sentAt) : null;
  const [cooldown, setCooldown] = useState(() => {
    if (!initialSentAt) return 0;
    const elapsed = Math.floor((Date.now() - initialSentAt) / 1000);
    return Math.max(0, COOLDOWN_DEFAULT - elapsed);
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
 
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
    const typesToTry = ['email', 'signup', 'signin', 'magiclink'];
    for (const t of typesToTry) {
      try {
        const res = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: t,
        });
        const returnedError = res?.error ?? null;
        if (!returnedError) {
          return { success: true };
        }
        const msg = returnedError?.message?.toString?.() || '';
        const lower = msg.toLowerCase();
        if (lower.includes('expire')) {
          return { success: false, fatal: true, error: returnedError };
        }
      } catch (err) {
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
      const verifyResult = await tryVerify(email, code);
      if (!verifyResult.success) {
        const err = verifyResult.error;
        const msg = err?.message?.toString?.() || err?.toString?.() || 'OTP verification failed';
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

      if (desiredPassword) {
        try {
          const { error: pwErr } = await supabase.auth.updateUser({ password: desiredPassword });
          if (pwErr) {
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

      const { error: insertErr } = await supabase.from('customers').insert({
        username: email,
        email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        address: profile.address,
        phone_number: profile.phone,
      });

      if (insertErr && insertErr.code !== '23505') {
        console.error('Insert customer failed:', insertErr);
      }

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

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header with Icon */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <View style={styles.backButtonCircle}>
              <FontAwesome name="arrow-left" size={20} color="#232B55" />
            </View>
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#232B55', '#4A5698']}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome name="shield" size={40} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* OTP Input Section */}
        <View style={styles.otpSection}>
          <View style={styles.otpRow}>
            {otp.map((digit, idx) => (
              <View key={idx} style={styles.otpInputWrapper}>
                <TextInput
                  ref={inputs[idx]}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, idx)}
                  returnKeyType="next"
                  autoFocus={idx === 0}
                />
              </View>
            ))}
          </View>

          {/* Info Message */}
          <View style={styles.infoBox}>
            <FontAwesome name="info-circle" size={16} color="#4A5698" style={{ marginRight: 8 }} />
            <Text style={styles.infoText}>Code expires in 10 minutes</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? ['#999', '#777'] : ['#232B55', '#4A5698']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>Verify & Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          <Text style={styles.resendLabel}>Didn't receive the code?</Text>
          <TouchableOpacity 
            onPress={handleResend} 
            disabled={cooldown > 0}
            activeOpacity={0.7}
            style={styles.resendButton}
          >
            {cooldown > 0 ? (
              <View style={styles.cooldownContainer}>
                <FontAwesome name="clock-o" size={14} color="#999" style={{ marginRight: 6 }} />
                <Text style={styles.cooldownText}>Resend in {cooldown}s</Text>
              </View>
            ) : (
              <View style={styles.resendActive}>
                <FontAwesome name="refresh" size={14} color="#232B55" style={{ marginRight: 6 }} />
                <Text style={styles.resendText}>Resend Code</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#232B55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232B55',
    textAlign: 'center',
  },
  otpSection: {
    marginBottom: 32,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  otpInputWrapper: {
    marginHorizontal: 6,
  },
  otpInput: {
    width: 50,
    height: 56,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: '#fff',
    color: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpInputFilled: {
    borderColor: '#232B55',
    backgroundColor: '#F0F2FF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F2FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A5698',
  },
  infoText: {
    fontSize: 14,
    color: '#4A5698',
    fontWeight: '500',
  },
  submitBtn: {
    borderRadius: 16,
    height: 56,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#232B55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: {
    shadowOpacity: 0.1,
  },
  submitGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  resendSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendLabel: {
    fontSize: 15,
    color: '#666',
    marginBottom: 12,
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cooldownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cooldownText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  resendActive: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 15,
    color: '#232B55',
    fontWeight: 'bold',
  },
});