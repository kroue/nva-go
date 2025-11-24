import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../SupabaseClient';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleCreateAccountClick = () => {
    navigation.navigate('SignUp');
  };

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (authError) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        console.log('Login successful:', data.session.user.email);
        
        // Fetch user profile from customers table
        const { data: profileData, error: profileError } = await supabase
          .from('customers')
          .select('first_name, last_name, email, address')
          .eq('email', data.session.user.email)
          .single();

        if (!profileError && profileData) {
          // Save user data to AsyncStorage
          await AsyncStorage.setItem('firstName', profileData.first_name || '');
          await AsyncStorage.setItem('lastName', profileData.last_name || '');
          await AsyncStorage.setItem('email', profileData.email || '');
          await AsyncStorage.setItem('address', profileData.address || '');
        }
        
        navigation.replace('Home');
      } else {
        setError('Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    navigation.navigate('ForgetPassword');
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
                <FontAwesome name="user" size={32} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
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
            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputContainer, email ? styles.inputActive : null]}>
                <FontAwesome name="envelope" size={18} color="#232B55" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                  placeholder="Enter your password"
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

            {/* Form Options */}
            <View style={styles.formOptions}>
              <TouchableOpacity
                style={styles.checkboxLabel}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <FontAwesome name="check" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkboxText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleForgotPasswordClick}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotButtonText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ['#999', '#777'] : ['#232B55', '#4A5698']}
                style={styles.loginGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Logging in...' : 'Log In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign Up */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity 
                onPress={handleCreateAccountClick}
                activeOpacity={0.7}
              >
                <Text style={styles.signupLink}>Create Account</Text>
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
  formOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxLabel: {
    flexDirection: 'row',
    alignItems: 'center',
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
  checkboxText: {
    fontSize: 14,
    color: '#555',
  },
  forgotButtonText: {
    color: '#232B55',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
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
  loginButtonDisabled: {
    shadowOpacity: 0.1,
  },
  loginGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#666',
    fontSize: 15,
  },
  signupLink: {
    color: '#232B55',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
