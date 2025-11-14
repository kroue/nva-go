import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { supabase } from '../SupabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));

  // Fetch profile from Supabase using email stored in AsyncStorage
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const email = await AsyncStorage.getItem('email');
      if (!email) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .single();
      if (data) {
        setProfile(data);
        setForm(data);
        
        // Animate in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setForm(profile);
    setEditing(false);
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('customers')
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        address: form.address,
      })
      .eq('id', profile.id);
    if (!error) {
      setProfile({ ...profile, ...form });
      setEditing(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#232B55" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIconContainer}>
          <FontAwesome name="user-times" size={48} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyTitle}>No Profile Found</Text>
        <Text style={styles.emptyText}>Please log in to view your profile</Text>
      </View>
    );
  }



  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={['#232B55', '#4A5698']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >


            {/* Name */}
            <Text style={styles.profileName}>
              {profile.first_name} {profile.last_name}
            </Text>
            <Text style={styles.profileUsername}>@{profile.username}</Text>

            {/* Edit Button */}
            {!editing && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEdit}
                activeOpacity={0.8}
              >
                <FontAwesome name="edit" size={16} color="#232B55" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {/* Profile Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <FontAwesome name="user" size={18} color="#232B55" />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>

          {/* Username Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldIconContainer}>
              <FontAwesome name="at" size={16} color="#6B7280" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Username</Text>
              <Text style={styles.fieldValue}>{profile.username}</Text>
            </View>
          </View>

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldIconContainer}>
              <FontAwesome name="envelope" size={16} color="#6B7280" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.fieldValue}>{profile.email}</Text>
            </View>
          </View>

          {/* First Name Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldIconContainer}>
              <FontAwesome name="user" size={16} color="#6B7280" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>First Name</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={form.first_name}
                  onChangeText={v => handleChange('first_name', v)}
                  placeholder="Enter first name"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.first_name}</Text>
              )}
            </View>
          </View>

          {/* Last Name Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldIconContainer}>
              <FontAwesome name="user" size={16} color="#6B7280" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={form.last_name}
                  onChangeText={v => handleChange('last_name', v)}
                  placeholder="Enter last name"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.last_name}</Text>
              )}
            </View>
          </View>

          {/* Phone Number Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldIconContainer}>
              <FontAwesome name="phone" size={16} color="#6B7280" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={form.phone_number}
                  onChangeText={v => handleChange('phone_number', v)}
                  keyboardType="phone-pad"
                  placeholder="Enter phone number"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.phone_number}</Text>
              )}
            </View>
          </View>

          {/* Address Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldIconContainer}>
              <FontAwesome name="map-marker" size={16} color="#6B7280" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Address</Text>
              {editing ? (
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={form.address}
                  onChangeText={v => handleChange('address', v)}
                  placeholder="Enter address"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={2}
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.address}</Text>
              )}
            </View>
          </View>

          {/* Account Status */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldIconContainer}>
              <FontAwesome 
                name={profile.is_barred ? "ban" : "check-circle"} 
                size={16} 
                color={profile.is_barred ? "#EF4444" : "#10B981"} 
              />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Account Status</Text>
              <View style={[
                styles.statusBadge, 
                profile.is_barred ? styles.statusBarred : styles.statusActive
              ]}>
                <Text style={[
                  styles.statusText,
                  profile.is_barred ? styles.statusTextBarred : styles.statusTextActive
                ]}>
                  {profile.is_barred ? 'Restricted' : 'Active'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {editing && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome name="check" size={16} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Info Footer */}
        {!editing && (
          <View style={styles.infoFooter}>
            <FontAwesome name="info-circle" size={14} color="#6B7280" />
            <Text style={styles.infoText}>
              Tap "Edit Profile" to update your information
            </Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FD',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Empty State
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Header Section
  headerSection: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#232B55',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  headerGradient: {
    padding: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  barredBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#232B55',
    marginLeft: 8,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginLeft: 12,
  },

  // Field Container
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fieldIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '600',
    lineHeight: 22,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1A1A2E',
    backgroundColor: '#F9FAFB',
    fontWeight: '500',
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusBarred: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#10B981',
  },
  statusTextBarred: {
    color: '#EF4444',
  },

  // Button Container
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#232B55',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#232B55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },

  // Info Footer
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
});