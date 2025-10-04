import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../SupabaseClient';

export default function ResetPassword({ navigation, route }) {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Listen for the recovery session from the URL (deep link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionChecked(true);
      }
    });

    // Check if already authenticated (for direct loads)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    setMessage('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Password reset successful! You can now log in.');
      navigation.replace('Login');
    }
  };

  if (!sessionChecked) {
    return (
      <View style={styles.container}>
        <Text>Loading password reset session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set New Password</Text>
      <TextInput
        style={styles.input}
        placeholder="New password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>
      {message ? <Text style={styles.success}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // ...existing styles...
});