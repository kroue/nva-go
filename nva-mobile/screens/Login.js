import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../SupabaseClient'; // Adjust the import path as necessary

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    setError('');
    // 1. Find customer by username
    const { data: custData, error: custError } = await supabase
      .from('customers')
      .select('email,first_name,last_name')
      .eq('username', username.trim())
      .maybeSingle();

    if (custError || !custData) {
      setError('Invalid username');
      return;
    }

    // 2. Login with Supabase Auth using customer email
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: custData.email.trim(),
      password: password,
    });

    if (authError) {
      if (
        authError.message &&
        authError.message.toLowerCase().includes('email not confirmed')
      ) {
        setError('Confirm your email first before logging in.');
      } else {
        setError('Invalid password');
      }
      return;
    }

    // 3. Store user info in AsyncStorage for session
    await AsyncStorage.setItem('firstName', custData.first_name || '');
    await AsyncStorage.setItem('lastName', custData.last_name || '');
    await AsyncStorage.setItem('email', custData.email);

    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log In</Text>
      {error ? (
        <Text style={{ color: '#D32F2F', marginBottom: 12, textAlign: 'center' }}>{error}</Text>
      ) : null}

      {/* Username */}
      <View style={styles.inputContainer}>
        <FontAwesome name="user-o" size={20} color="#888" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          placeholderTextColor="#888"
        />
      </View>

      {/* Password */}
      <View style={styles.inputContainer}>
        <FontAwesome name="lock" size={20} color="#888" style={styles.inputIcon} />
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

      {/* Remember me & Forgot Password */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.customCheckbox}
          onPress={() => setRememberMe(!rememberMe)}
        >
          {rememberMe ? (
            <FontAwesome name="check-square-o" size={22} color="#232B55" />
          ) : (
            <FontAwesome name="square-o" size={22} color="#232B55" />
          )}
        </TouchableOpacity>
        <Text style={styles.rememberText}>Remember me</Text>
        <TouchableOpacity style={styles.forgotContainer} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>Forgot Password</Text>
        </TouchableOpacity>
      </View>

      {/* Log In Button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>

      {/* Sign Up */}
      <View style={styles.signupRow}>
        <Text style={styles.signupText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.signupLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    marginTop: 20,
    marginBottom: 30,
    color: '#232B55',
    textTransform: 'uppercase'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#222',
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#222',
  },
  showText: {
    color: '#222',
    fontWeight: '500',
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  customCheckbox: {
    marginRight: 4,
  },
  rememberText: {
    color: '#555',
    fontSize: 15,
  },
  forgotContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  forgotText: {
    color: '#D32F2F',
    fontSize: 15,
    fontWeight: '400',
  },
  loginButton: {
    backgroundColor: '#232B55',
    borderRadius: 20,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  orText: {
    color: '#222',
    fontSize: 15,
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  socialButton: {
    marginHorizontal: 12,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  signupText: {
    color: '#222',
    fontSize: 15,
    marginRight: 6,
  },
  signupLink: {
    color: '#D32F2F',
    fontSize: 15,
    fontWeight: '500',
  },
});