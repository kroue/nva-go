import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../SupabaseClient';

export default function Login() {
  const navigation = useNavigation();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleCreateAccountClick = () => {
    navigation.navigate('SignUp');
  };

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    const { data: empData, error: empError } = await supabase
      .from('employees')
      .select('email')
      .eq('username', username)
      .maybeSingle();
    if (empError || !empData) {
      setError('Invalid username');
      setIsLoading(false);
      return;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: empData.email,
      password,
    });
    if (authError) {
      setError('Invalid password');
      setIsLoading(false);
      return;
    }
    navigation.navigate('Home');
  };

  const handleForgotPasswordClick = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleAdminLoginClick = () => {
    navigation.navigate('AdminLogin');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image source={require('../assets/nvago-icon.png')} style={styles.headerLogo} />
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          <View style={styles.leftContent}>
            <Image source={require('../assets/nvago-icon.png')} style={styles.logoLarge} />
            <Text style={styles.welcomeTitle}>Welcome to NVAGo</Text>
            <Text style={styles.description}>
              NVAGo is intuitive, reliable online and offline, and offers a wide range of options to meet all your printing business needs. Set it up in minutes, start selling in seconds, and keep both your staff and clients satisfied!
            </Text>
            <TouchableOpacity style={styles.adminButton} onPress={handleAdminLoginClick}>
              <Text style={styles.adminButtonIcon}>👤</Text>
              <Text style={styles.adminButtonText}>Admin Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Log In</Text>
              <Text style={styles.formSubtitle}>Enter your credentials to continue</Text>
            </View>
            
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter your username"
                  value={username}
                  onChangeText={setUsername}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor="#999"
                  secureTextEntry={true}
                />
              </View>
              
              {error && (
                <View style={styles.errorAlert}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text>{error}</Text>
                </View>
              )}
              
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
                  style={styles.forgotButton}
                >
                  <Text style={styles.forgotButtonText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>{isLoading ? 'Logging in...' : 'Log In'}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine}></View>
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine}></View>
            </View>
            
            <View style={styles.createAccount}>
              <Text style={styles.createAccountText}>
                Don't have an account?{' '}
                <TouchableOpacity 
                  onPress={handleCreateAccountClick}
                  style={styles.createAccountLink}
                >
                  <Text style={styles.createAccountLinkText}>Create Account</Text>
                </TouchableOpacity>
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 NVA Printing Services. All rights reserved.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#252B55',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerLogo: {
    height: 50,
  },
  body: {
    flex: 1,
    flexDirection: 'column',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  leftSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  leftContent: {
    maxWidth: 500,
    alignItems: 'center',
  },
  logoLarge: {
    width: '100%',
    maxWidth: 350,
    height: 100,
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#252B55',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5a6c7d',
    marginBottom: 30,
    textAlign: 'center',
  },
  adminButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: '#252B55',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  adminButtonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rightSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  formCard: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  formHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  form: {
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
    marginBottom: 8,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    color: '#1a1a1a',
  },
  errorAlert: {
    backgroundColor: '#fee',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
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
    borderColor: '#252B55',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  checkboxActive: {
    backgroundColor: '#252B55',
  },
  checkboxText: {
    fontSize: 14,
    color: '#4b5563',
  },
  forgotButton: {
  },
  forgotButtonText: {
    color: '#252B55',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    paddingVertical: 14,
    backgroundColor: '#252B55',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  createAccount: {
    alignItems: 'center',
  },
  createAccountText: {
    fontSize: 14,
    color: '#6c757d',
  },
  createAccountLink: {
  },
  createAccountLinkText: {
    color: '#252B55',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#252B55',
    paddingVertical: 24,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
});
