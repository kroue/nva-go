import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../SupabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

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
  const [dimError, setDimError] = useState(null);
  // NEW: live warning text shown above inputs
  const [dimWarning, setDimWarning] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [eyelets, setEyelets] = useState('4');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [instructions, setInstructions] = useState('');
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [productData, setProductData] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);

  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Price calculation
  const [total, setTotal] = useState(0);

  const requiresDimensions = ['Tarp', 'Sticker', 'Cloth', 'Film', 'Print', 'Photopaper'].includes(productData?.category);

  // helper to parse numeric inputs safely
  const parseNum = (v) => {
    const n = parseFloat(String(v ?? '').toString().replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  };

  // Fetch product and variants from Supabase
  useEffect(() => {
    const fetchProductAndVariants = async () => {
      if (!product) return;
      const { data: products, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('name', product)
        .limit(1);

      if (pErr) {
        console.warn('Product fetch error:', pErr.message);
        return;
      }

      if (products && products.length > 0) {
        const prod = products[0];
        setProductData(prod);

        const { data: vdata, error: vErr } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', prod.product_id);

        if (vErr) {
          console.warn('Variants fetch error:', vErr.message);
        }

        const list = vdata || [];
        setVariants(list);

        // Auto-select first variant if none selected
        if (list.length > 0 && !selectedVariant) {
          setSelectedVariant(list[0]);
        }
      }
    };
    fetchProductAndVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Fetch customer info from AsyncStorage and Supabase
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const email = await AsyncStorage.getItem('email');
        if (!email) return;
        const { data, error } = await supabase
          .from('customers')
          .select('first_name,last_name,phone_number,address')
          .eq('email', email)
          .single();
        if (error) {
          console.warn('Customer fetch error:', error.message);
        }
        if (data) {
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setContact(data.phone_number || '');
          setAddress(data.address || '');
        }
      } catch (e) {
        console.warn('AsyncStorage error:', e.message);
      }
    };
    fetchCustomer();
  }, []);

  // Calculate price + dimension validation + live warning
  useEffect(() => {
    // LIVE WARNING: runs on every change to width/height
    if (requiresDimensions) {
      const h = parseNum(height);
      const w = parseNum(width);

      const parts = [];
      if (Number.isFinite(w) && w < 2) parts.push('Width is below 2"');
      if (Number.isFinite(h) && h < 2) parts.push('Height is below 2"');

      if (Number.isFinite(h) && Number.isFinite(w)) {
        const small = Math.min(h, w);
        const large = Math.max(h, w);
        if (small < 2 || large < 3) {
          // orientation-agnostic 2×3 rule
          if (!parts.length) parts.push('Minimum size is 2 × 3 inches (any orientation)');
        }
      }

      setDimWarning(parts.length ? `Minimum size: 2 × 3 inches. ${parts.join('. ')}` : '');
    } else {
      setDimWarning('');
    }

    // PRICE + FORM VALIDATION (kept from your previous logic)
    if (requiresDimensions) {
      const h = parseNum(height);
      const w = parseNum(width);
      if (!Number.isFinite(h) || !Number.isFinite(w)) {
        setDimError(null);
        setTotal(0);
        return;
      }
      const small = Math.min(h, w);
      const large = Math.max(h, w);
      if (small < 2 || large < 3) {
        setDimError('Minimum size is 2 × 3 inches (either 2×3 or 3×2).');
        setTotal(0);
        return;
      }
      setDimError(null);
    } else {
      setDimError(null);
    }

    let price = 0;
    const qty = parseInt(quantity) || 1;
    let area = 1;

    if (selectedVariant && requiresDimensions) {
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
  }, [selectedVariant, quantity, width, height, hasFile, requiresDimensions]);

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
    // Only require variant when there are variants
    if (variants.length > 0 && !selectedVariant) return false;
    if (!quantity || isNaN(quantity) || parseInt(quantity) < 1) return false;

    if (requiresDimensions) {
      const h = parseNum(height);
      const w = parseNum(width);
      if (!Number.isFinite(h) || !Number.isFinite(w)) return false;
      if (w < 2 || h < 2) return false;               // both sides must be >= 2
      if (w < 3 && h < 3) return false;               // at least one side must be >= 3
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
      height: requiresDimensions ? (height ? parseFloat(height) : null) : null,
      width: requiresDimensions ? (width ? parseFloat(width) : null) : null,
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

        <Text style={styles.sectionTitle}>Customer Details</Text>
        <View style={styles.row}>
          <TextInput style={styles.inputHalf} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
          <TextInput style={styles.inputHalf} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
        </View>
        <TextInput style={styles.inputFull} placeholder="Contact Number" value={contact} onChangeText={setContact} />
        <TextInput style={styles.inputFull} placeholder="Address" value={address} onChangeText={setAddress} />

        <Text style={styles.sectionTitle}>Order Details<Text style={styles.note}>  NOTE: Additional fee for layout ₱150</Text></Text>
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
          <TouchableOpacity style={styles.attachBtn} onPress={pickDocument}>
            <Text style={styles.attachText}>{attachedFile ? 'Replace file' : 'Attach file'} + </Text>
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
                <Text style={[styles.variantText, selectedVariant === variant && { color: '#fff' }]}>
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
      {/* NEW: Dimension error message */}
      {requiresDimensions && (
        <Text style={dimError ? styles.errorText : styles.helperText}>
          {dimError || 'Minimum size: 2 × 3 inches (either 2×3 or 3×2).'}
        </Text>
      )}
      {requiresDimensions && !!dimWarning && (
        <Text style={styles.errorText}>{dimWarning}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Keep original container but stop using it for contentContainerStyle to allow scrolling
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },

  // New styles to enable scrolling properly
  scroll: { 
    flex: 1,
    backgroundColor: '#ffffff' 
  },
  contentContainer: { 
    marginTop: 20,
    marginBottom: 20,
    padding: 20, 
    backgroundColor: '#ffffff'
  },
  card: { 
    backgroundColor: '#EDEDED', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 24, 
    elevation: 2 
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  productImage: { 
    width: 80, 
    height: 60, 
    borderRadius: 8, 
    marginRight: 12 
  },
  productTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#232B55' 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#ccc', 
    marginVertical: 8 
  },
  sectionTitle: { 
    fontWeight: 800, 
    textTransform: "uppercase",
    fontSize: 15, 
    color: '#232B55', 
    marginTop: 10, 
    marginBottom: 10 
  },
  note: { 
    fontWeight: 'normal', 
    fontSize: 10, 
    color: '#222', 
    textTransform: 'lowercase', 
    paddingLeft: 20
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  inputHalf: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    padding: 8, 
    marginRight: 8, 
    backgroundColor: '#fff', 
    justifyContent: 'center' 
  },
  inputFull: { 
    width: '100%', 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    padding: 8, 
    marginBottom: 8, 
    backgroundColor: '#fff'
  },
  inputSmall: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    padding: 8, 
    marginRight: 8, 
    backgroundColor: '#fff' 
  },
  label: { 
    fontSize: 14, 
    color: '#232B55', 
    marginRight: 8, 
    marginTop: 10,
  },
  radioRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginRight: 8 
  },
  radio: { 
    width: 16, 
    height: 16, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#232B55', 
    marginRight: 4 
  },
  radioSelected: { 
    backgroundColor: '#2196F3' 
  },
  radioLabel: { 
    fontSize: 14, 
    color: '#232B55' 
  },
  attachBtn: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    padding: 8, 
    backgroundColor: '#fff', 
    marginRight: 8 
  },
  attachText: { 
    color: '#232B55', 
    fontWeight: '500' 
  },
  plusBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#232B55', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  plusText: { 
    color: '#fff',
    fontSize: 20, 
    fontWeight: 'bold'
   },
  instructions: { 
    width: '100%', 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8, 
    padding: 8, 
    minHeight: 60, 
    backgroundColor: '#fff', 
    marginBottom: 8 
  },
  summaryBox: { 
    backgroundColor: '#eee', 
    borderRadius: 8, 
    padding: 12, 
    marginVertical: 12 
  },
  summaryText: { 
    color: '#232B55', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  checkoutBtn: {
    backgroundColor: '#232B55', 
    borderRadius: 24, 
    padding: 16, 
    alignItems: 'center', 
    marginTop: 12 
  },
  checkoutText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  variantBtn: { 
    padding: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    marginBottom: 6, 
    backgroundColor: '#fff', 
  },
  variantBtnSelected: { 
    backgroundColor: '#232B55', 
    borderColor: '#2196F3' 
  },
  variantText: { 
    color: '#232B55', 
    fontSize: 15 
  },
  helperText: { 
    color: '#556', 
    fontSize: 12, 
    marginTop: 4, 
    marginBottom: 8
   },
  errorText: { 
    color: '#D32F2F', 
    fontSize: 12, 
    marginTop: 4, 
    marginBottom: 8, 
    fontWeight: '600'
   },
});