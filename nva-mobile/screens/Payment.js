import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../SupabaseClient';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

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
    // Require payment proof
    if (!proofUri) {
      Alert.alert('Proof Required', 'Please upload payment proof before placing the order.');
      return;
    }

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
        product_name: (typeof order.product_name === 'object' ? order.product_name?.name : order.product_name) || '',
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
        payment_proof: finalProofUrl,
        order_source: 'mobile',
        created_at: order.created_at || new Date().toISOString(),
        employee_email: order.employee_email || null,
        employee_first_name: null,
        employee_last_name: null
      };

      console.log('Order data to insert:', orderData);

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <Text style={styles.headerSubtitle}>Scan QR code to pay with GCash</Text>
        </View>

        {/* GCash Card */}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={['#007AFF', '#0051D5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.gcashLogo}>GCash</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>REQUIRED</Text>
              </View>
            </View>
            
            <View style={styles.qrBox}>
              <Image
                source={require('../assets/gcash-qr.png')}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.accountInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Name</Text>
                <Text style={styles.infoValue}>NI*****N A.</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mobile Number</Text>
                <Text style={styles.infoValue}>09177177429</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>User ID</Text>
                <Text style={styles.infoValue}>********4HAPLZ</Text>
              </View>
            </View>

            <View style={styles.noticeBox}>
              <Text style={styles.noticeIcon}>ⓘ</Text>
              <Text style={styles.noticeText}>
                Payment first policy • Transfer fees may apply
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Payment Proof</Text>
          <Text style={styles.sectionSubtitle}>
            Upload a screenshot of your payment confirmation
          </Text>

          {proofUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: proofUri }} 
                style={styles.previewImage}
              />
              <TouchableOpacity 
                style={styles.changeButton}
                onPress={pickImage}
              >
                <Text style={styles.changeButtonText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.uploadBox} 
              onPress={pickImage}
            >
              <View style={styles.uploadIcon}>
                <Text style={styles.uploadIconText}>📷</Text>
              </View>
              <Text style={styles.uploadText}>Tap to upload proof</Text>
              <Text style={styles.uploadSubtext}>JPG, PNG or JPEG</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Summary */}
        {order && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Product</Text>
                <Text style={styles.summaryValue}>{order.product_name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Quantity</Text>
                <Text style={styles.summaryValue}>{order.quantity}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelBold}>Total Amount</Text>
                <Text style={styles.summaryTotal}>₱{order.total}</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Place Order Button */}
        <TouchableOpacity
          style={[
            styles.placeOrderBtn, 
            uploading && styles.disabledBtn
          ]}
          onPress={handlePlaceOrder}
          disabled={uploading}
          activeOpacity={0.8}
        >
          <Text style={styles.placeOrderText}>
            {uploading ? '⏳ Uploading...' : '✓ Confirm & Place Order'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Your order will be validated within 24 hours
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    backgroundColor: '#F8F9FD',
    flexGrow: 1,
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  gcashLogo: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  qrBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  accountInfo: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
  },
  noticeIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#fff',
  },
  noticeText: {
    flex: 1,
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '500',
  },
  uploadSection: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  uploadBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadIconText: {
    fontSize: 28,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  imagePreviewContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
  },
  changeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  changeButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  summarySection: {
    width: '100%',
    marginBottom: 24,
  },
  summaryBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1A1A2E',
    fontWeight: '600',
  },
  summaryLabelBold: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '700',
  },
  summaryTotal: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '800',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
    marginBottom: 16,
  },
  placeOrderBtn: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledBtn: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerText: {
    marginTop: 16,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});