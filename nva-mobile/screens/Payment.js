import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../SupabaseClient';
import axios from 'axios';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dfejxqixw/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'proofs';

export default function Payment() {
  const navigation = useNavigation();
  const route = useRoute();
  const order = route.params?.order;
  const [proofUri, setProofUri] = useState('');
  const [uploading, setUploading] = useState(false);

  // Pick image
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProofUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Upload image to Cloudinary
  const uploadProof = async () => {
    if (!proofUri) return '';
    
    setUploading(true);

    try {
      const fileExt = proofUri.split('.').pop();
      const fileName = `proof_${Date.now()}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri: proofUri,
        type: `image/${fileExt}`,
        name: fileName,
      });
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const cloudRes = await axios.post(CLOUDINARY_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setUploading(false);
      return cloudRes.data.secure_url;
    } catch (err) {
      setUploading(false);
      console.error('Upload error:', err);
      Alert.alert('Upload Error', err.response?.data?.error?.message || err.message);
      return '';
    }
  };

  // Place order function
  const handlePlaceOrder = async () => {
    try {
      let proofUrl = '';
      if (proofUri) {
        proofUrl = await uploadProof();
        if (!proofUrl) {
          return;
        }
      }

      // Fallbacks: param passed from OrderForm or attached_file on order
      const fallbackProof = route?.params?.cloudinaryUrl || order?.attached_file || '';
      const finalProofUrl = proofUrl || fallbackProof;

      // Prepare order data with mobile source indicator
      const orderData = {
        first_name: order.first_name,
        last_name: order.last_name,
        phone_number: order.phone_number,
        address: order.address,
        email: order.email,
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
        status: 'Validation',
  attached_file: order.attached_file,
  payment_proof: finalProofUrl, // URL of uploaded or passed payment proof
        order_source: 'mobile',
        created_at: order.created_at || new Date().toISOString(), // Use order timestamp or current time
        employee_email: order.employee_email || null, // ADD: Missing comma here
        employee_first_name: null, // Mobile orders don't have employees initially
        employee_last_name: null
      };

      console.log('Order data to insert:', orderData); // Debug log

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        Alert.alert('Order Error', error.message);
        return;
      }

      console.log('Order inserted successfully:', data);
      Alert.alert('Order Placed', 'Your order has been placed successfully!');
      navigation.replace('Home');
      
    } catch (error) {
      console.error('Place order error:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
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
              source={require('../assets/gcash-qrgit pull origin main --rebase
.png')}
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
              value={proofUri ? proofUri.split('/').pop() : ''}
              editable={false}
            />
            <TouchableOpacity style={styles.attachPlus} onPress={pickImage}>
              <Text style={styles.attachPlusText}>+</Text>
            </TouchableOpacity>
          </View>
          {proofUri ? (
            <Image 
              source={{ uri: proofUri }} 
              style={styles.previewImage}
            />
          ) : null}
        </View>
        
        <TouchableOpacity
          style={[
            styles.placeOrderBtn, 
            uploading && styles.disabledBtn
          ]}
          onPress={handlePlaceOrder}
          disabled={uploading}
        >
          <Text style={styles.placeOrderText}>
            {uploading ? 'Uploading...' : 'Place Order'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 12,
    flex: 1, 
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
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
    height: '70%',
    maxWidth: 370,

  },
  gcashLogo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  policyText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  acceptedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 10,
    textAlign: 'center',
  },
  qrBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    height: '68%',
    justifyContent: 'center'
  },
  qrImage: {
    width: 160,
    height: 160,
    marginBottom: 10,
  },
  transferNote: {
    color: '#888',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  accountName: {
    color: '#1877F3',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  accountDetails: {
    color: '#222',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 5
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
    marginBottom: 10,
    fontWeight: 600
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
  previewImage: {
    width: 120,
    height: 120,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
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
  disabledBtn: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});