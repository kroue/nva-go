import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../SupabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleEdit = () => setEditing(true);

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
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text>No profile found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Profile</Text>
        {!editing && (
          <TouchableOpacity onPress={handleEdit}>
            <MaterialIcons name="edit" size={28} color="#232B55" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>{profile.username}</Text>
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{profile.email}</Text>
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.label}>First Name:</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={form.first_name}
            onChangeText={v => handleChange('first_name', v)}
          />
        ) : (
          <Text style={styles.value}>{profile.first_name}</Text>
        )}
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.label}>Last Name:</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={form.last_name}
            onChangeText={v => handleChange('last_name', v)}
          />
        ) : (
          <Text style={styles.value}>{profile.last_name}</Text>
        )}
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.label}>Phone Number:</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={form.phone_number}
            onChangeText={v => handleChange('phone_number', v)}
            keyboardType="phone-pad"
          />
        ) : (
          <Text style={styles.value}>{profile.phone_number}</Text>
        )}
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.label}>Address:</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={form.address}
            onChangeText={v => handleChange('address', v)}
          />
        ) : (
          <Text style={styles.value}>{profile.address}</Text>
        )}
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.label}>Barred:</Text>
        <Text style={styles.value}>{profile.is_barred ? 'Yes' : 'No'}</Text>
      </View>
      {editing && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#232B55' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  label: { width: 110, fontWeight: 'bold', color: '#232B55', fontSize: 15 },
  value: { fontSize: 15, color: '#232B55', flex: 1 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, fontSize: 15, backgroundColor: '#f5f5f5' },
  saveBtn: { backgroundColor: '#232B55', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 18 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});