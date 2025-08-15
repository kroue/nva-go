import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function OrderForm({ route }) {
  const { product } = route.params;
  const navigation = useNavigation();

  // States for form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  const [hasFile, setHasFile] = useState(true);
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [pcs, setPcs] = useState('1');
  const [eyelets, setEyelets] = useState('4');
  const [quality, setQuality] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [instructions, setInstructions] = useState('');

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
        <View style={styles.row}>
          <TextInput style={styles.inputSmall} placeholder="Height" value={height} onChangeText={setHeight} />
          <TextInput style={styles.inputSmall} placeholder="Width" value={width} onChangeText={setWidth} />
          <TextInput style={styles.inputSmall} placeholder="No. of pcs" value={pcs} onChangeText={setPcs} />
          <TextInput style={styles.inputSmall} placeholder="Eyelets" value={eyelets} onChangeText={setEyelets} />
        </View>
        <TextInput style={styles.inputFull} placeholder="Quality" value={quality} onChangeText={setQuality} />
        <View style={styles.row}>
          <TextInput style={styles.inputHalf} placeholder="Date to Pickup" value={pickupDate} onChangeText={setPickupDate} />
          <TextInput style={styles.inputHalf} placeholder="Time to Pickup" value={pickupTime} onChangeText={setPickupTime} />
        </View>
        <TextInput
          style={styles.instructions}
          placeholder="Instructions"
          value={instructions}
          onChangeText={setInstructions}
          multiline
        />

        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>Order Summary</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Payment')}
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
  inputHalf: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginRight: 8, backgroundColor: '#fff' },
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
});