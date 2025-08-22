import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

const orders = [
  {
    product: 'Tarpaulin',
    total: 'TOTAL',
  },
  {
    product: 'Tarpaulin',
    total: 'TOTAL',
  },
];

export default function OrderHistory() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Order History</Text>
      {orders.map((order, idx) => (
        <View key={idx} style={styles.orderCard}>
          <Image source={order.image} style={styles.productImage} />
          <View style={styles.orderInfo}>
            <Text style={styles.productTitle}>{order.product}</Text>
            <Text style={styles.totalText}>{order.total}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
    color: '#232B55',
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 8,
    elevation: 1,
  },
  productImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  orderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#232B55',
    marginBottom: 6,
  },
  totalText: {
    fontWeight: 'bold',
    color: '#232B55',
    fontSize: 15,
  },
});