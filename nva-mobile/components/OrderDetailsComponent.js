import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

const OrderDetailsComponent = ({
  hasFile,
  setHasFile,
  attachedFile,
  setAttachedFile,
  requiresDimensions,
  height,
  setHeight,
  width,
  setWidth,
  quantity,
  setQuantity,
  isSolventTarp,
  eyelets,
  setEyelets,
  pickupDate,
  setPickupDate,
  pickupTime,
  setPickupTime,
  instructions,
  setInstructions,
  showDatePicker,
  setShowDatePicker,
  showTimePicker,
  setShowTimePicker,
  handleDateChange,
  handleTimeChange,
  pickDocument,
  dimWarning,
  dtfWarning
}) => {
  return (
    <>
      <Text style={styles.sectionTitle}>
        Order Details <Text style={styles.note}>NOTE: Additional fee for layout ₱150</Text>
      </Text>
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
          <Text style={styles.attachText}>{attachedFile ? 'Replace file' : 'Attach file'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.plusBtn}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {requiresDimensions && (
          <>
            <TextInput
              style={styles.inputSmall}
              placeholder="Height (ft)"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.inputSmall}
              placeholder="Width (ft)"
              value={width}
              onChangeText={setWidth}
              keyboardType="numeric"
            />
          </>
        )}
        <TextInput
          style={styles.inputSmall}
          placeholder="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />
      </View>
      {isSolventTarp && (
        <TextInput
          style={styles.inputSmall}
          placeholder="Eyelets"
          value={eyelets}
          onChangeText={setEyelets}
          keyboardType="numeric"
        />
      )}

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

      {requiresDimensions && !!dimWarning && (
        <Text style={styles.errorText}>{dimWarning}</Text>
      )}
      {!!dtfWarning && (
        <Text style={styles.errorText}>{dtfWarning}</Text>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: 'bold', fontSize: 16, color: '#232B55', marginTop: 8, marginBottom: 6 },
  note: { fontWeight: 'normal', fontSize: 12, color: '#222' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 14, color: '#232B55', marginRight: 8 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#232B55', marginRight: 4 },
  radioSelected: { backgroundColor: '#2196F3' },
  radioLabel: { fontSize: 14, color: '#232B55' },
  attachBtn: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, backgroundColor: '#fff', marginRight: 8 },
  attachText: { color: '#232B55', fontWeight: '500' },
  plusBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#232B55', alignItems: 'center', justifyContent: 'center' },
  plusText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  inputSmall: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginRight: 8, backgroundColor: '#fff' },
  inputHalf: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginRight: 8, backgroundColor: '#fff', justifyContent: 'center' },
  instructions: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, minHeight: 60, backgroundColor: '#fff', marginBottom: 8 },
  errorText: { color: '#D32F2F', fontSize: 12, marginTop: 4, marginBottom: 8, fontWeight: '600' },
});

export default OrderDetailsComponent;
