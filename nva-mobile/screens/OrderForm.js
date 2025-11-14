import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import CustomerDetails from '../components/CustomerDetails';
import OrderDetailsComponent from '../components/OrderDetailsComponent';
import VariantSelector from '../components/VariantSelector';
import OrderSummary from '../components/OrderSummary';
import useOrderCalculation from '../hooks/useOrderCalculation';
import useFormValidation from '../hooks/useFormValidation';
import useProductData from '../hooks/useProductData';

export default function OrderForm() {
  const route = useRoute();
  const product = route?.params?.product ?? null;
  const navigation = useNavigation();
  const productImage = product?.image_url;

  // Animation
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [hasFile, setHasFile] = useState(true);
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [eyelets, setEyelets] = useState('4');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [instructions, setInstructions] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);

  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Normalization + product flags
  const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const productNameRaw = product || productData?.name || '';
  const normalizedProduct = normalize(productNameRaw);
  const isDTFPrint = normalizedProduct.includes('dtf') && normalizedProduct.includes('print');
  const isSolventTarp = normalizedProduct.includes('solvent') && normalizedProduct.includes('tarp');
  const isSintra = normalizedProduct.includes('sintra');
  const requiresDimensions = isSintra || isSolventTarp;

  // Custom hooks
  const { variants, selectedVariant, setSelectedVariant, productData, fetchCustomer } = useProductData(product);
  const { total, dimWarning } = useOrderCalculation(selectedVariant, quantity, width, height, hasFile, requiresDimensions, isSolventTarp, eyelets);
  const { isFormValid, dtfWarning } = useFormValidation(
    firstName, lastName, contact, address, variants, selectedVariant, quantity, isDTFPrint, requiresDimensions, height, width, isSolventTarp, eyelets, pickupDate, pickupTime, hasFile, attachedFile
  );

  // Animation on mount
  useEffect(() => {
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
  }, []);

  // Fetch customer info from AsyncStorage and Supabase
  useEffect(() => {
    const loadCustomer = async () => {
      const customerData = await fetchCustomer();
      if (customerData) {
        setFirstName(customerData.first_name || '');
        setLastName(customerData.last_name || '');
        setContact(customerData.phone_number || '');
        setAddress(customerData.address || '');
      }
    };
    loadCustomer();
  }, [fetchCustomer]);

  // Date/time picker handlers
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (selectedDate.getDay() === 0) {
        alert('Sundays are not available for pickup.');
        return;
      }
      const dateStr = selectedDate.toISOString().split('T')[0];
      setPickupDate(dateStr);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const dayOfWeek = pickupDate ? new Date(pickupDate).getDay() : 1;
      const isSunday = dayOfWeek === 0;
      const minHour = isSunday ? 8 : 9;
      const maxHour = isSunday ? 16 : 19;
      const selectedHour = selectedTime.getHours();
      if (selectedHour < minHour || selectedHour > maxHour) {
        alert(`Pickup time must be between ${minHour}am and ${maxHour > 12 ? maxHour - 12 : maxHour}pm.`);
        return;
      }
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setPickupTime(`${hours}:${minutes}`);
    }
  };

  const handleCheckout = async () => {
    if (!isFormValid()) {
      alert('Please fill out all required fields.');
      return;
    }
    const email = await AsyncStorage.getItem('email');
    const orderData = {
      first_name: firstName,
      last_name: lastName,
      phone_number: contact,
      address,
      has_file: hasFile,
      product_name: (typeof product === 'object' ? product?.name : product) || productData?.name || '',
      variant: selectedVariant?.description || selectedVariant?.size || '',
      height: requiresDimensions ? (height ? parseFloat(height) : null) : null,
      width: requiresDimensions ? (width ? parseFloat(width) : null) : null,
      quantity: parseInt(quantity) || 1,
      eyelets: isSolventTarp ? (parseInt(eyelets) || 0) : null,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      instructions,
      total,
      status: 'Validation',
      email,
      attached_file: attachedFile?.url || null,
      approval_file: null,
      approved: 'no',
      created_at: new Date().toISOString(),
      employee_email: null
    };

    console.log('Order data:', orderData);
    navigation.navigate('Payment', { order: orderData, cloudinaryUrl: attachedFile?.url || null });
  };

  const pickDocument = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        alert('Permission to access gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsMultipleSelection: false
      });

      if (!result.canceled) {
        const formData = new FormData();
        formData.append('file', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'upload.jpg'
        });
        formData.append('upload_preset', 'proofs');

        try {
          const response = await fetch('https://api.cloudinary.com/v1_1/dfejxqixw/upload', {
            method: 'POST',
            body: formData,
            headers: {
              Accept: 'application/json',
              'Content-Type': 'multipart/form-data',
            },
          });

          const data = await response.json();

          if (data.secure_url) {
            setAttachedFile({
              url: data.secure_url,
              name: result.assets[0].uri.split('/').pop()
            });
          } else {
            alert('Upload failed: ' + (data.error?.message || 'Unknown error'));
          }
        } catch (error) {
          alert('Failed to upload image: ' + error.message);
        }
      }
    } catch (err) {
      alert('Failed to pick image: ' + err.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Product Header Card */}
          <View style={styles.productHeader}>
            <LinearGradient
              colors={['#232B55', '#4A5698']}
              style={styles.productHeaderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.productIconContainer}>
                {productImage ? (
                  <Image source={{ uri: productImage }} style={styles.productImageIcon} />
                ) : (
                  <FontAwesome name="file-text" size={28} color="#fff" />
                )}
              </View>
              <View style={styles.productHeaderText}>
                <Text style={styles.productTitle}>{product?.name || 'Product'}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Main Form Card */}
          <View style={styles.card}>
            <CustomerDetails
              firstName={firstName} setFirstName={setFirstName}
              lastName={lastName} setLastName={setLastName}
              contact={contact} setContact={setContact}
              address={address} setAddress={setAddress}
            />

            <View style={styles.sectionDivider} />

            <OrderDetailsComponent
              hasFile={hasFile} setHasFile={setHasFile}
              attachedFile={attachedFile} setAttachedFile={setAttachedFile}
              requiresDimensions={requiresDimensions}
              height={height} setHeight={setHeight}
              width={width} setWidth={setWidth}
              quantity={quantity} setQuantity={setQuantity}
              isSolventTarp={isSolventTarp}
              eyelets={eyelets} setEyelets={setEyelets}
              pickupDate={pickupDate} setPickupDate={setPickupDate}
              pickupTime={pickupTime} setPickupTime={setPickupTime}
              instructions={instructions} setInstructions={setInstructions}
              showDatePicker={showDatePicker} setShowDatePicker={setShowDatePicker}
              showTimePicker={showTimePicker} setShowTimePicker={setShowTimePicker}
              handleDateChange={handleDateChange}
              handleTimeChange={handleTimeChange}
              pickDocument={pickDocument}
              dimWarning={dimWarning}
              dtfWarning={dtfWarning}
            />

            <View style={styles.sectionDivider} />

            <VariantSelector
              variants={variants}
              selectedVariant={selectedVariant}
              setSelectedVariant={setSelectedVariant}
            />
          </View>

          {/* Summary Card */}
          <OrderSummary 
            total={total} 
            isFormValid={isFormValid} 
            handleCheckout={handleCheckout} 
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  productHeader: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#232B55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  productHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  productIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  productHeaderText: {
    flex: 1,
  },
  productLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    fontWeight: '500',
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#232B55',
    marginBottom: 12,
  },
  note: {
    fontWeight: 'normal',
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputHalf: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
    fontSize: 16,
    color: '#1A1A1A',
  },
  inputFull: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    fontSize: 16,
    color: '#1A1A1A',
  },
  inputSmall: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
    fontSize: 16,
    color: '#1A1A1A',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#232B55',
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#232B55',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#232B55',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  radioLabel: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  attachBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#232B55',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F0F2FF',
    marginRight: 8,
    alignItems: 'center',
  },
  attachText: {
    color: '#232B55',
    fontWeight: '600',
    fontSize: 15,
  },
  plusBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#232B55',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#232B55',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  plusText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  instructions: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    backgroundColor: '#F8F9FA',
    marginBottom: 12,
    fontSize: 16,
    color: '#1A1A1A',
    textAlignVertical: 'top',
  },
  summaryBox: {
    backgroundColor: '#F0F2FF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#232B55',
  },
  summaryText: {
    color: '#232B55',
    fontWeight: 'bold',
    fontSize: 20,
  },
  checkoutBtn: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    overflow: 'hidden',
    shadowColor: '#232B55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  variantBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  variantBtnSelected: {
    backgroundColor: '#F0F2FF',
    borderColor: '#232B55',
  },
  variantText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '500',
  },
  variantTextSelected: {
    color: '#232B55',
    fontWeight: '700',
  },
  helperText: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
    fontWeight: '600',
  },
  productImageIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
});
