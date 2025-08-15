import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function Verification({ navigation, route }) {
  // Optionally get email from route.params
  const email = route?.params?.email || 'user@example.com';
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6 digits
  const inputs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]; // 6 refs

  const handleChange = (text, idx) => {
    if (/^\d*$/.test(text)) {
      const newOtp = [...otp];
      newOtp[idx] = text;
      setOtp(newOtp);
      if (text && idx < 5) {
        inputs[idx + 1].current.focus();
      }
      if (!text && idx > 0) {
        inputs[idx - 1].current.focus();
      }
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (otp.join('').length !== 6) {
      // Optionally show an error message here
      return;
    }
    try {
      const res = await fetch('http://192.168.1.43:8000/api/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.join('') }),
      });
      if (res.ok) {
        navigation.replace('Login');
      } else {
        // handle error
      }
    } catch (e) {
      // handle error
    }
  };

  const handleResend = () => {
    // Handle resend OTP logic here
  };

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
            onChangeText={text => handleChange(text, idx)}
            returnKeyType="next"
            autoFocus={idx === 0}
          />
        ))}
      </View>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
      <View style={styles.bottomRow}>
        <Text style={styles.bottomText}>Didn't receive the OTP?</Text>
        <TouchableOpacity onPress={handleResend}>
          <Text style={styles.resendText}>Resend</Text>
        </TouchableOpacity>
      </View>
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
  backBtn: {
    marginBottom: 18,
    marginTop: 4,
    alignSelf: 'flex-start',
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
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    marginTop: 8,
  },
  otpInput: {
    width: 54,
    height: 54,
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    backgroundColor: '#fff',
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
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  bottomText: {
    color: '#222',
    fontSize: 14,
    marginRight: 6,
  },
  resendText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
  },
});
