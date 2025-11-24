import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ForgetPassword() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {/* Profile Icon */}
        <View style={styles.profileIconContainer}>
          <Icon name="lock-outline" size={50} color="#FFFFFF" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Password Reset</Text>
        <Text style={styles.subtitle}>Contact Admin to Reset Password</Text>

        {/* Contact Information */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Icon name="email" size={20} color="#4A5568" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>nvaprintingservices@gmail.com</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Icon name="phone" size={20} color="#4A5568" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>0953 5383 369</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>What to include:</Text>
          <Text style={styles.instructionItem}>• Your registered email address</Text>
          <Text style={styles.instructionItem}>• Your full name</Text>
          <Text style={styles.instructionItem}>• Reason for password reset</Text>
        </View>

        {/* Back to Login Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B4C73',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 32,
    textAlign: 'center',
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  instructionsContainer: {
    width: '100%',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 22,
    marginBottom: 4,
  },
  backButton: {
    width: '100%',
    backgroundColor: '#3B4C73',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
