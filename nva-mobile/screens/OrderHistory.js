import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../SupabaseCient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const email = await AsyncStorage.getItem('email');
      setUserEmail(email);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('email', email)
        .eq('status', 'Finished')
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const toggleExpand = (orderId) => {
    setExpandedId(expandedId === orderId ? null : orderId);
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#232B55" />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Order History</Text>
      {orders.map((order) => (
        <TouchableOpacity 
          key={order.id} 
          style={styles.orderCard}
          onPress={() => toggleExpand(order.id)}
        >
          {/* Preview */}
          <View style={styles.previewContainer}>
            {order.attached_file ? (
              <Image 
                source={{ uri: order.attached_file }} 
                style={styles.productImage} 
              />
            ) : (
              <View style={styles.placeholderImage} />
            )}
            <View style={styles.orderInfo}>
              <Text style={styles.productTitle}>{order.variant}</Text>
              <Text style={styles.totalText}>₱{order.total}</Text>
              <Text style={styles.orderDate}>
                {new Date(order.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Expanded Details */}
          {expandedId === order.id && (
            <View style={styles.expandedDetails}>
              <View style={styles.divider} />
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order #:</Text>
                <Text style={styles.detailValue}>{order.id.slice(0, 8)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Size:</Text>
                <Text style={styles.detailValue}>
                  {order.height && order.width ? `${order.height} × ${order.width}` : '---'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity:</Text>
                <Text style={styles.detailValue}>{order.quantity} pcs</Text>
              </View>

              {order.eyelets && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Eyelets:</Text>
                  <Text style={styles.detailValue}>{order.eyelets}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Instructions:</Text>
                <Text style={styles.detailValue}>{order.instructions || 'None'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pickup Date:</Text>
                <Text style={styles.detailValue}>{order.pickup_date}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pickup Time:</Text>
                <Text style={styles.detailValue}>{order.pickup_time}</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL:</Text>
                <Text style={styles.totalValue}>₱{order.total}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
    color: '#232B55',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    elevation: 2,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  orderInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232B55',
    marginBottom: 4,
  },
  totalText: {
    fontWeight: 'bold',
    color: '#232B55',
    fontSize: 15,
  },
  orderDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  expandedDetails: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  detailLabel: {
    color: '#666',
    fontSize: 14,
  },
  detailValue: {
    color: '#232B55',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232B55',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232B55',
  },
});