import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Payment() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.gcashLogo}>GCash</Text>
        <Text style={styles.policyText}>
          Payment first policy. We only receive Gcash payment only.
        </Text>
        <Text style={styles.acceptedText}>ACCEPTED HERE</Text>
        <View style={styles.qrBox}>
          <Image
            source={require('../assets/gcash-qr.png')}
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
            editable={false}
          />
          <TouchableOpacity style={styles.attachPlus}>
            <Text style={styles.attachPlusText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={styles.placeOrderBtn}
        onPress={() => navigation.replace('Home')}
      >
        <Text style={styles.placeOrderText}>Place Order</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    flex: 1,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1877F3',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    width: '100%',
    maxWidth: 370,
    alignItems: 'center',
  },
  gcashLogo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  policyText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  acceptedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 8,
    textAlign: 'center',
  },
  qrBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  qrImage: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  transferNote: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'center',
  },
  accountName: {
    color: '#1877F3',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
    textAlign: 'center',
  },
  accountDetails: {
    color: '#222',
    fontSize: 13,
    textAlign: 'center',
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
    marginBottom: 6,
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
  placeOrderBtn: {
    backgroundColor: '#232B55',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
    maxWidth: 370,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});