import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../SupabaseClient';

export default function SignUp({ navigation }) {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    setError('');

    // Basic validation
    if (!firstname || !lastname || !email || !password || !confirmPassword) {
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

    try {
      // Send a 6-digit OTP to email and create user on verification
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          data: {
            first_name: firstname.trim(),
            last_name: lastname.trim(),
            address: address.trim() || null,
          },
        },
      });

      if (otpErr) {
        setError(otpErr.message || 'Failed to send OTP.');
        return;
      }

      // Go to OTP screen with the data we need after verification
      navigation.navigate('Verification', {
        email: email.trim(),
        password, // will be set after verify
        first_name: firstname.trim(),
        last_name: lastname.trim(),
        address: address.trim() || null,
      });
    } catch (e) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      {error ? <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text> : null}

      <View style={styles.row}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <TextInput
            style={styles.input}
            placeholder="Firstname"
            value={firstname}
            onChangeText={setFirstname}
            placeholderTextColor="#888"
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <TextInput
            style={styles.input}
            placeholder="Lastname"
            value={lastname}
            onChangeText={setLastname}
            placeholderTextColor="#888"
          />
        </View>
      </View>

      <View style={[styles.inputContainer, { marginBottom: 16 }]}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* NEW: Address field (optional) */}
      <View style={[styles.inputContainer, { marginBottom: 16 }]}>
        <TextInput
          style={styles.input}
          placeholder="Address (optional)"
          value={address}
          onChangeText={setAddress}
          placeholderTextColor="#888"
        />
      </View>

      <View style={[styles.inputContainer, { marginBottom: 16 }]}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#888"
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.inputContainer, { marginBottom: 20 }]}>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholderTextColor="#888"
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Text style={styles.showText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.row, { marginBottom: 32, alignItems: 'center' }]}>
        <TouchableOpacity style={styles.customCheckbox} onPress={() => setAgree(!agree)}>
          {agree ? (
            <FontAwesome name="check-square-o" size={22} color="#232B55" />
          ) : (
            <FontAwesome name="square-o" size={22} color="#232B55" />
          )}
        </TouchableOpacity>
        <Text style={styles.agreeText}>
          I Agree with <Text style={styles.linkText}>privacy</Text> and <Text style={styles.linkText}>policy</Text>
        </Text>
      </View>

      {/* Wire up the button to new OTP flow */}
      <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
        <Text style={styles.signupButtonText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Social Login (unchanged) */}
      <View style={{ marginTop: 40, alignItems: 'center' }}>
        <Text style={styles.orText}>Or Sign up with</Text>
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="facebook-official" size={36} color="#1877F3" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <MaterialIcons name="mail" size={36} color="#EA4335" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.signinRow}>
        <Text style={styles.signinText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.signinLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 60 },
  title: { fontSize: 34, fontWeight: 'bold', marginBottom: 36 },
  row: { flexDirection: 'row', marginBottom: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#222',
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 0,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#fff',
  },
  input: { flex: 1, fontSize: 16, color: '#222' },
  showText: { color: '#222', fontWeight: '500', marginLeft: 8 },
  customCheckbox: { marginRight: 4 },
  agreeText: { color: '#555', fontSize: 15 },
  linkText: { color: '#D32F2F', fontSize: 15, fontWeight: '400' },
  signupButton: {
    backgroundColor: '#232B55',
    borderRadius: 20,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  signupButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  orText: { color: '#222', fontSize: 15, marginBottom: 12 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  socialButton: { marginHorizontal: 12 },
  signinRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  signinText: { color: '#222', fontSize: 15, marginRight: 6 },
  signinLink: { color: '#D32F2F', fontSize: 15, fontWeight: '500' },
});