import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const CustomerDetails = ({ firstName, setFirstName, lastName, setLastName, contact, setContact, address, setAddress }) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Customer Details</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.inputHalf}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.inputHalf}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>
      <TextInput
        style={styles.inputFull}
        placeholder="Contact Number"
        value={contact}
        onChangeText={setContact}
      />
      <TextInput
        style={styles.inputFull}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: 'bold', fontSize: 16, color: '#232B55', marginTop: 8, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputHalf: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginRight: 8, backgroundColor: '#fff' },
  inputFull: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 8, backgroundColor: '#fff' },
});

export default CustomerDetails;
