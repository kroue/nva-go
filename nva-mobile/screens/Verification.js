import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '../SupabaseCient';

export default function Verification({ navigation, route }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { otp: sentOtp, userData } = route.params;

  const handleVerifyOTP = async () => {
    if (otp !== sentOtp) {
      Alert.alert('Error', 'Invalid verification code');
      return;
    }

    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Insert customer record
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            id: authData.user.id,
            username: userData.username,
            email: userData.email,
            first_name: userData.firstname,
            last_name: userData.lastname,
            phone_number: userData.phoneNumber || null,
            address: userData.address || null,
          });

        if (customerError) throw customerError;

        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OTP Verification</Text>
      <Text style={styles.subtitle}>
        Enter the One Time Password sent to <Text style={styles.email}>{userData.email}</Text>
      </Text>
      <TextInput
        value={otp}
        onChangeText={setOtp}
        placeholder="Enter 6-digit code"
        keyboardType="numeric"
        maxLength={6}
        style={styles.otpInput}
      />
      <TouchableOpacity onPress={handleVerifyOTP} disabled={loading} style={styles.submitBtn}>
        <Text style={styles.submitText}>{loading ? 'Verifying...' : 'Verify'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingTop: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
    color: '#111',
  },
  subtitle: {
    fontSize: 15,
    color: '#222',
    marginBottom: 28,
  },
  email: {
    fontWeight: 'bold',
    color: '#232B55',
  },
  otpInput: {
    width: '100%',
    height: 54,
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    backgroundColor: '#fff',
    marginBottom: 32,
  },
  submitBtn: {
    backgroundColor: '#232B55',
    borderRadius: 22,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
