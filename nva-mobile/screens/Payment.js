import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../SupabaseCient';
import axios from 'axios';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dfejxqixw/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'proofs';

export default function Payment({ route }) {
  const { order } = route.params;
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation();

  // Pick image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPaymentProof(result.assets[0]);
    }
  };

  // Upload image to Cloudinary
  const uploadProof = async () => {
    if (!paymentProof) return '';
    setUploading(true);

    // Get file extension
    const fileExt = paymentProof.uri.split('.').pop();
    const fileName = `proof_${Date.now()}.${fileExt}`;

    // Cloudinary expects FormData with uri, type, and name
    const formData = new FormData();
    formData.append('file', {
      uri: paymentProof.uri,
      type: `image/${fileExt}`,
      name: fileName,
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const cloudRes = await axios.post(CLOUDINARY_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploading(false);
      return cloudRes.data.secure_url;
    } catch (err) {
      setUploading(false);
      Alert.alert('Upload Error', err.response?.data?.error?.message || err.message);
      return '';
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    let proofUrl = '';
    if (paymentProof) {
      proofUrl = await uploadProof();
    }

    console.log('Order before insert:', order); // Debug log

    const orderData = {
      first_name: order.first_name,
      last_name: order.last_name,
      phone_number: order.phone_number,
      address: order.address,
      has_file: order.has_file,
      variant: order.variant,
      height: order.height,
      width: order.width,
      quantity: order.quantity,
      eyelets: order.eyelets,
      pickup_date: order.pickup_date,
      pickup_time: order.pickup_time,
      instructions: order.instructions,
      total: order.total,
      status: order.status,
      email: order.email,
      payment_proof: proofUrl,
      attached_file: order.attached_file || null, // Explicitly handle attached_file
      approval_file: null,
      approved: 'no',
      created_at: new Date().toISOString()
    };

    console.log('Order data to insert:', orderData); // Debug log

    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error); // Debug log
      Alert.alert('Order Error', error.message);
      return;
    }

    console.log('Inserted order:', data); // Debug log
    Alert.alert('Order Placed', 'Your order has been placed!');
    navigation.replace('Home');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.gcashLogo}>GCash</Text>
          <Text style={styles.policyText}>
            Payment first policy. We only receive Gcash payment only.
          </Text>
          <Text style={styles.acceptedText}>ACCEPTED HERE</Text>
          <View style={styles.qrBox}>
            <Image
              source={require('../assets/gcash-qr.png')}
              style={styles.qrImage}
              resizeMode="contain"
            />
            <Text style={styles.transferNote}>Transfer fees may apply.</Text>
            <Text style={styles.accountName}>NI*****N A.</Text>
            <Text style={styles.accountDetails}>Mobile No: 09177177429</Text>
            <Text style={styles.accountDetails}>User ID: ********4HAPLZ</Text>
          </View>
        </View>
        <View style={styles.attachBox}>
          <Text style={styles.attachLabel}>
            Attach proof payment here for validation purposes.
          </Text>
          <View style={styles.attachRow}>
            <TextInput
              style={styles.attachInput}
              placeholder="Attach file"
              value={paymentProof ? paymentProof.uri.split('/').pop() : ''}
              editable={false}
            />
            <TouchableOpacity style={styles.attachPlus} onPress={pickImage}>
              <Text style={styles.attachPlusText}>+</Text>
            </TouchableOpacity>
          </View>
          {paymentProof ? (
            <Image source={{ uri: paymentProof.uri }} style={{ width: 120, height: 120, marginTop: 8, borderRadius: 8 }} />
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.placeOrderBtn}
          onPress={handlePlaceOrder}
          disabled={uploading}
        >
          <Text style={styles.placeOrderText}>{uploading ? 'Uploading...' : 'Place Order'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    flexGrow: 1,
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1877F3',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    width: '100%',
    maxWidth: 370,
    alignItems: 'center',
  },
  gcashLogo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  policyText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  acceptedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 8,
    textAlign: 'center',
  },
  qrBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  qrImage: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  transferNote: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'center',
  },
  accountName: {
    color: '#1877F3',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
    textAlign: 'center',
  },
  accountDetails: {
    color: '#222',
    fontSize: 13,
    textAlign: 'center',
  },
  attachBox: {
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    width: '100%',
    maxWidth: 370,
  },
  attachLabel: {
    color: '#222',
    fontSize: 13,
    marginBottom: 6,
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
  },
  attachPlus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#232B55',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  attachPlusText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeOrderBtn: {
    backgroundColor: '#232B55',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
    maxWidth: 370,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});