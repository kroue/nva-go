import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import CustomerDetails from '../components/CustomerDetails';
import OrderDetailsComponent from '../components/OrderDetailsComponent';
import VariantSelector from '../components/VariantSelector';
import OrderSummary from '../components/OrderSummary';
import useOrderCalculation from '../hooks/useOrderCalculation';
import useFormValidation from '../hooks/useFormValidation';
import useProductData from '../hooks/useProductData';

export default function OrderForm() {
  // Safely access route params
  const route = useRoute();
  const product = route?.params?.product ?? null;

  const navigation = useNavigation();

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
  const requiresDimensions = isSintra || isSolventTarp; // only these two per spec

  // Custom hooks
  const { variants, selectedVariant, setSelectedVariant, productData, fetchCustomer } = useProductData(product);
  const { total, dimWarning } = useOrderCalculation(selectedVariant, quantity, width, height, hasFile, requiresDimensions, isSolventTarp, eyelets);
  const { isFormValid, dtfWarning } = useFormValidation(
    firstName, lastName, contact, address, variants, selectedVariant, quantity, isDTFPrint, requiresDimensions, height, width, isSolventTarp, eyelets, pickupDate, pickupTime, hasFile, attachedFile
  );

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
      const dayOfWeek = pickupDate ? new Date(pickupDate).getDay() : 1; // Default to Monday if no date
      const isSunday = dayOfWeek === 0;
      const minHour = isSunday ? 8 : 9;
      const maxHour = isSunday ? 16 : 19; // 4pm is 16, 7pm is 19
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
      product_name: product || productData?.name || '',
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
    // Pass attached file URL for compatibility as cloudinaryUrl
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
    <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.productTitle}>{product || 'Product'}</Text>
        </View>
        <View style={styles.divider} />

        <CustomerDetails
          firstName={firstName} setFirstName={setFirstName}
          lastName={lastName} setLastName={setLastName}
          contact={contact} setContact={setContact}
          address={address} setAddress={setAddress}
        />

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

        <VariantSelector
          variants={variants}
          selectedVariant={selectedVariant}
          setSelectedVariant={setSelectedVariant}
        />

        <OrderSummary total={total} isFormValid={isFormValid} handleCheckout={handleCheckout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Keep original container but stop using it for contentContainerStyle to allow scrolling
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },

  // New styles to enable scrolling properly
  scroll: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { padding: 16, paddingBottom: 32 },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, elevation: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  productImage: { width: 80, height: 60, borderRadius: 8, marginRight: 12 },
  productTitle: { fontSize: 22, fontWeight: 'bold', color: '#232B55' },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 8 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, color: '#232B55', marginTop: 8, marginBottom: 6 },
  note: { fontWeight: 'normal', fontSize: 12, color: '#222' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputHalf: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginRight: 8, backgroundColor: '#fff', justifyContent: 'center' },
  inputFull: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 8, backgroundColor: '#fff' },
  inputSmall: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginRight: 8, backgroundColor: '#fff' },
  label: { fontSize: 14, color: '#232B55', marginRight: 8 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#232B55', marginRight: 4 },
  radioSelected: { backgroundColor: '#2196F3' },
  radioLabel: { fontSize: 14, color: '#232B55' },
  attachBtn: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, backgroundColor: '#fff', marginRight: 8 },
  attachText: { color: '#232B55', fontWeight: '500' },
  plusBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#232B55', alignItems: 'center', justifyContent: 'center' },
  plusText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  instructions: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, minHeight: 60, backgroundColor: '#fff', marginBottom: 8 },
  summaryBox: { backgroundColor: '#eee', borderRadius: 8, padding: 12, marginVertical: 12 },
  summaryText: { color: '#232B55', fontWeight: 'bold', fontSize: 16 },
  checkoutBtn: { backgroundColor: '#232B55', borderRadius: 24, padding: 16, alignItems: 'center', marginTop: 12 },
  checkoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  variantBtn: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#232B55', marginBottom: 6, backgroundColor: '#fff' },
  variantBtnSelected: { backgroundColor: '#232B55', borderColor: '#2196F3' },
  variantText: { color: '#232B55', fontSize: 15 },
  helperText: { color: '#556', fontSize: 12, marginTop: 4, marginBottom: 8 },
  errorText: { color: '#D32F2F', fontSize: 12, marginTop: 4, marginBottom: 8, fontWeight: '600' },
});
