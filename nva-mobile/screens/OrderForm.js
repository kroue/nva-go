import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../SupabaseCient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function OrderForm({ route }) {
  const { product } = route.params;
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
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [productData, setProductData] = useState(null);

  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Price calculation
  const [total, setTotal] = useState(0);

  // Fetch product and variants from Supabase
  useEffect(() => {
    const fetchProductAndVariants = async () => {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('name', product)
        .limit(1);
      if (products && products.length > 0) {
        setProductData(products[0]);
        const { data: vdata } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', products[0].product_id);
        setVariants(vdata || []);
      }
    };
    fetchProductAndVariants();
  }, [product]);

  // Fetch customer info from AsyncStorage and Supabase
  useEffect(() => {
    const fetchCustomer = async () => {
      const email = await AsyncStorage.getItem('email');
      if (!email) return;
      const { data, error } = await supabase
        .from('customers')
        .select('first_name,last_name,phone_number,address')
        .eq('email', email)
        .single();
      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setContact(data.phone_number || '');
        setAddress(data.address || '');
      }
    };
    fetchCustomer();
  }, []);

  // Calculate price
  useEffect(() => {
    let price = 0;
    let qty = parseInt(quantity) || 1;
    let area = 1;
    if (
      selectedVariant &&
      ['Tarp', 'Sticker', 'Cloth', 'Film', 'Print', 'Photopaper'].includes(productData?.category)
    ) {
      const w = parseFloat(width) || 0;
      const h = parseFloat(height) || 0;
      area = w * h;
      if (area === 0) area = 1;
      const unitPrice =
        qty >= 10
          ? selectedVariant.wholesale_price || selectedVariant.retail_price || 0
          : selectedVariant.retail_price || 0;
      price = unitPrice * area * qty;
    } else if (selectedVariant) {
      const unitPrice =
        qty >= 10
          ? selectedVariant.wholesale_price || selectedVariant.retail_price || 0
          : selectedVariant.retail_price || 0;
      price = unitPrice * qty;
    }
    if (!hasFile) price += 150;
    setTotal(price);
  }, [selectedVariant, quantity, width, height, hasFile, productData]);

  // Date/time picker handlers
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setPickupDate(dateStr);
    }
  };
  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setPickupTime(`${hours}:${minutes}`);
    }
  };

  const isFormValid = () => {
    if (!firstName.trim() || !lastName.trim() || !contact.trim() || !address.trim()) return false;
    if (!selectedVariant) return false;
    if (!quantity || isNaN(quantity) || parseInt(quantity) < 1) return false;
    if (
      ['Tarp', 'Sticker', 'Cloth', 'Film', 'Print', 'Photopaper'].includes(productData?.category)
    ) {
      if (!height || isNaN(height) || parseFloat(height) <= 0) return false;
      if (!width || isNaN(width) || parseFloat(width) <= 0) return false;
    }
    if (product === 'SOLVENT TARP' && (!eyelets || isNaN(eyelets) || parseInt(eyelets) < 0)) return false;
    if (!pickupDate || !pickupTime) return false;
    return true;
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
      variant: selectedVariant?.description || selectedVariant?.size || '',
      height: noDimensionProducts.includes(product) ? null : (height ? parseFloat(height) : null),
      width: noDimensionProducts.includes(product) ? null : (width ? parseFloat(width) : null),
      quantity: parseInt(quantity) || 1,
      eyelets: product === 'SOLVENT TARP' ? (parseInt(eyelets) * (parseInt(quantity) || 1)) : null,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      instructions,
      total,
      status: 'Validation',
      email,
      attached_file: attachedFile?.url || null,
      approval_file: null,
      approved: 'no',
      created_at: new Date().toISOString(), // Add timestamp for mobile orders
      employee_email: null // Will be set when employee sends approval
    };

    console.log('Order data:', orderData); // Debug log
    navigation.navigate('Payment', { order: orderData });
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
        formData.append('upload_preset', 'proofs'); // Changed to match web app preset

        try {
          console.log('Uploading to Cloudinary...'); // Debug log
          const response = await fetch('https://api.cloudinary.com/v1_1/dfejxqixw/upload', {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'multipart/form-data',
            },
          });

          const data = await response.json();
          console.log('Cloudinary full response:', data); // Debug log

          if (data.secure_url) {
            setAttachedFile({
              url: data.secure_url,
              name: result.assets[0].uri.split('/').pop()
            });
            console.log('Successfully set attached file:', data.secure_url);
          } else {
            console.error('Cloudinary error:', data.error || 'No secure_url in response');
            alert('Upload failed: ' + (data.error?.message || 'Unknown error'));
          }
        } catch (error) {
          console.error('Upload error:', error);
          alert('Failed to upload image: ' + error.message);
        }
      }
    } catch (err) {
      console.error('Gallery error:', err);
      alert('Failed to pick image: ' + err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.productTitle}>{product}</Text>
        </View>
        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.row}>
          <TextInput style={styles.inputHalf} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
          <TextInput style={styles.inputHalf} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
        </View>
        <TextInput style={styles.inputFull} placeholder="Contact Number" value={contact} onChangeText={setContact} />
        <TextInput style={styles.inputFull} placeholder="Address" value={address} onChangeText={setAddress} />

        <Text style={styles.sectionTitle}>Order Details <Text style={styles.note}>NOTE: Additional fee for layout ₱150</Text></Text>
        <View style={styles.row}>
          <Text style={styles.label}>Already have file?</Text>
          <TouchableOpacity onPress={() => setHasFile(true)} style={styles.radioRow}>
            <View style={[styles.radio, hasFile && styles.radioSelected]} />
            <Text style={styles.radioLabel}>YES</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setHasFile(false)} style={styles.radioRow}>
            <View style={[styles.radio, !hasFile && styles.radioSelected]} />
            <Text style={styles.radioLabel}>NO</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={styles.attachBtn}>
            <Text style={styles.attachText}>Attach file</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.plusBtn}>
            <Text style={styles.plusText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Variant selection */}
        {variants.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Choose Variant</Text>
            {variants.map((variant, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.variantBtn,
                  selectedVariant === variant && styles.variantBtnSelected
                ]}
                onPress={() => setSelectedVariant(variant)}
              >
                <Text style={styles.variantText}>
                  {variant.description || variant.size || 'Variant'} - Retail: ₱{variant.retail_price}
                  {variant.wholesale_price ? ` / Wholesale: ₱${variant.wholesale_price}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.row}>
          <TextInput style={styles.inputSmall} placeholder="Height (ft)" value={height} onChangeText={setHeight} keyboardType="numeric" />
          <TextInput style={styles.inputSmall} placeholder="Width (ft)" value={width} onChangeText={setWidth} keyboardType="numeric" />
          <TextInput style={styles.inputSmall} placeholder="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
        </View>
        {/* Eyelets only for Solvent Tarp */}
        {product === 'SOLVENT TARP' && (
          <TextInput style={styles.inputSmall} placeholder="Eyelets" value={eyelets} onChangeText={setEyelets} keyboardType="numeric" />
        )}

        {/* Date and Time Pickers */}
        <View style={styles.row}>
          <TouchableOpacity style={styles.inputHalf} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: pickupDate ? '#222' : '#888' }}>
              {pickupDate ? pickupDate : 'Date to Pickup'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputHalf} onPress={() => setShowTimePicker(true)}>
            <Text style={{ color: pickupTime ? '#222' : '#888' }}>
              {pickupTime ? pickupTime : 'Time to Pickup'}
            </Text>
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={pickupDate ? new Date(pickupDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={pickupTime ? new Date(`1970-01-01T${pickupTime}:00`) : new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}

        <TextInput
          style={styles.instructions}
          placeholder="Instructions"
          value={instructions}
          onChangeText={setInstructions}
          multiline
        />

        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>Order Summary</Text>
          <Text style={styles.summaryText}>Total: ₱{total}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            { opacity: isFormValid() ? 1 : 0.5 }
          ]}
          onPress={handleCheckout}
          disabled={!isFormValid()}
        >
          <Text style={styles.checkoutText}>Check Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: '#f5f5f5' },
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
});