import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const OrderSummary = ({ total, isFormValid, handleCheckout }) => {
  return (
    <>
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
    </>
  );
};

const styles = StyleSheet.create({
  summaryBox: { backgroundColor: '#eee', borderRadius: 8, padding: 12, marginVertical: 12 },
  summaryText: { color: '#232B55', fontWeight: 'bold', fontSize: 16 },
  checkoutBtn: { backgroundColor: '#232B55', borderRadius: 24, padding: 16, alignItems: 'center', marginTop: 12 },
  checkoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default OrderSummary;
