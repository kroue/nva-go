import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../SupabaseClient';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUp({ navigation }) {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const handleSignUp = async () => {
    setError('');

    // Basic validation
    if (!firstname || !lastname || !email || !phone || !address || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agree) {
      setError('You must agree to the privacy and policy.');
      return;
    }

    setIsLoading(true);

    try {
      // Use signInWithOtp so Supabase sends an email OTP/magic link and creates the user if needed
      const res = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true, type: 'email' },
      });
      console.log('signInWithOtp response', res);
      if (res?.error) {
        console.error('signInWithOtp failed', res.error);
        // If Supabase returns a "wait N seconds" message we can show it
        const msg = res.error.message || 'Failed to send verification email';
        setError(msg);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      // navigate to verification screen and pass sentAt for cooldown tracking
      navigation.navigate('Verification', {
        email: email.trim(),
        password,
        first_name: firstname.trim(),
        last_name: lastname.trim(),
        phone: phone.trim(),
        address: address.trim(),
        sentAt: Date.now(),
      });
    } catch (err) {
      console.error('send OTP failed', err);
      setError(err?.message || 'Failed to send OTP');
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#232B55', '#4A5698']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <FontAwesome name="user-plus" size={32} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          {/* Error Alert */}
          {error ? (
            <View style={styles.errorAlert}>
              <FontAwesome name="exclamation-circle" size={18} color="#D32F2F" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Name Row */}
            <View style={styles.nameRow}>
              <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>First Name</Text>
                <View style={[styles.inputContainer, firstname ? styles.inputActive : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="John"
                    value={firstname}
                    onChangeText={setFirstname}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={[styles.inputWrapper, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Last Name</Text>
                <View style={[styles.inputContainer, lastname ? styles.inputActive : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Doe"
                    value={lastname}
                    onChangeText={setLastname}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputContainer, email ? styles.inputActive : null]}>
                <FontAwesome name="envelope" size={18} color="#232B55" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="john.doe@example.com"
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputContainer, phone ? styles.inputActive : null]}>
                <FontAwesome name="phone" size={18} color="#232B55" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+1 234 567 8900"
                  value={phone}
                  onChangeText={setPhone}
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Address */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Address</Text>
              <View style={[styles.inputContainer, address ? styles.inputActive : null]}>
                <FontAwesome name="map-marker" size={18} color="#232B55" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="123 Main St, City, State"
                  value={address}
                  onChangeText={setAddress}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, password ? styles.inputActive : null]}>
                <FontAwesome name="lock" size={18} color="#232B55" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <FontAwesome 
                    name={showPassword ? 'eye' : 'eye-slash'} 
                    size={18} 
                    color="#232B55" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.inputContainer, confirmPassword ? styles.inputActive : null]}>
                <FontAwesome name="lock" size={18} color="#232B55" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <FontAwesome 
                    name={showConfirmPassword ? 'eye' : 'eye-slash'} 
                    size={18} 
                    color="#232B55" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Agreement Checkbox */}
            <TouchableOpacity
              style={styles.agreeContainer}
              onPress={() => setAgree(!agree)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agree && styles.checkboxActive]}>
                {agree && <FontAwesome name="check" size={14} color="#fff" />}
              </View>
              <Text style={styles.agreeText}>
                I agree with <Text style={styles.linkText}>privacy</Text> and <Text style={styles.linkText}>policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity 
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]} 
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ['#999', '#777'] : ['#232B55', '#4A5698']}
                style={styles.signupGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <Text style={styles.signupButtonText}>Creating Account...</Text>
                ) : (
                  <Text style={styles.signupButtonText}>Sign Up</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign In */}
            <View style={styles.signinRow}>
              <Text style={styles.signinText}>Already have an account? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text style={styles.signinLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#232B55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  errorText: {
    color: '#C62828',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  form: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputActive: {
    borderColor: '#232B55',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  eyeButton: {
    padding: 4,
  },
  agreeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#232B55',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  checkboxActive: {
    backgroundColor: '#232B55',
  },
  agreeText: {
    color: '#555',
    fontSize: 14,
    flex: 1,
  },
  linkText: {
    color: '#232B55',
    fontWeight: '600',
  },
  signupButton: {
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
  signupButtonDisabled: {
    shadowOpacity: 0.1,
  },
  signupGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signinText: {
    color: '#666',
    fontSize: 15,
  },
  signinLink: {
    color: '#232B55',
    fontSize: 15,
    fontWeight: 'bold',
  },
});