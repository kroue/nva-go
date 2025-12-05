import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';

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
  eyeletInstructions,
  setEyeletInstructions,
  instructions,
  setInstructions,
  pickDocument,
  dimWarning,
  dtfWarning
}) => {
  const [showImageModal, setShowImageModal] = useState(false);

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
        <TouchableOpacity style={styles.attachBtn} onPress={attachedFile ? () => setShowImageModal(true) : null}>
          <Text style={styles.attachText}>{attachedFile ? attachedFile.name : 'Attach file'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.plusBtn} onPress={pickDocument}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showImageModal} transparent={true} onRequestClose={() => setShowImageModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image source={{ uri: attachedFile?.url }} style={styles.modalImage} />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowImageModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {requiresDimensions && (
        <>
          <Text style={styles.label}>
            Dimensions (Length x Width in feet) *
          </Text>
          <Text style={styles.helperText}>
            {isSolventTarp 
              ? 'Price calculated as: Length × Width × Price per sq.ft × Quantity + (Eyelets × ₱1)'
              : 'Price calculated as: Length × Width × Price per sq.ft × Quantity'}
          </Text>
          <View style={styles.row}>
            <TextInput
              style={styles.inputHalf}
              placeholder="Length (ft)"
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
            <TextInput
              style={styles.inputHalf}
              placeholder="Width (ft)"
              keyboardType="numeric"
              value={width}
              onChangeText={setWidth}
            />
          </View>
          {/* Only show dimWarning once, here at the end of dimensions section */}
          {dimWarning ? <Text style={styles.errorText}>{dimWarning}</Text> : null}
        </>
      )}
      <Text style={styles.label}>Quantity</Text>
      <TextInput
        style={styles.inputSmall}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />
      {isSolventTarp && (
        <>
          <Text style={styles.label}>Number of Eyelets *</Text>
          <Text style={styles.helperText}>₱1 per eyelet will be added to the total</Text>
          <TextInput
            style={styles.inputFull}
            placeholder="Enter number of eyelets"
            keyboardType="numeric"
            value={eyelets}
            onChangeText={setEyelets}
          />
          <Text style={styles.label}>Eyelet Placement Instructions</Text>
          <Text style={styles.helperText}>Describe where eyelets should be placed (e.g., "4 corners", "every 2 feet along edges")</Text>
          <TextInput
            style={styles.instructions}
            placeholder="Example: Place eyelets on all 4 corners"
            value={eyeletInstructions}
            onChangeText={setEyeletInstructions}
            multiline
          />
        </>
      )}

      <Text style={styles.label}>Instructions</Text>
      <TextInput
        style={styles.instructions}
        value={instructions}
        onChangeText={setInstructions}
        multiline
      />

      {/* Make sure dimWarning is NOT displayed again elsewhere in the component */}
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
  inputFull: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, backgroundColor: '#fff', marginBottom: 8 },
  instructions: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, minHeight: 60, backgroundColor: '#fff', marginBottom: 8 },
  errorText: { color: '#D32F2F', fontSize: 12, marginTop: 4, marginBottom: 8, fontWeight: '600' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderRadius: 8, padding: 16, alignItems: 'center' },
  modalImage: { width: 300, height: 300, resizeMode: 'contain' },
  closeBtn: { marginTop: 16, padding: 10, backgroundColor: '#232B55', borderRadius: 8 },
  closeText: { color: '#fff', fontWeight: 'bold' },
  helperText: { fontSize: 12, color: '#666', marginBottom: 8 },
});

export default OrderDetailsComponent;
