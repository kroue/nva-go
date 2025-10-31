import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, Alert } from 'react-native';
import { supabase } from '../SupabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const statuses = ['Validation', 'Layout Approval', 'Printing', 'For Pickup'];

export default function TrackOrder() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const isStepActive = (step) => {
    const currentIndex = statuses.indexOf(order?.status);
    const stepIndex = statuses.indexOf(step);
    return currentIndex >= stepIndex;
  };

  // Fetch the logged-in user's order (latest)
  useEffect(() => {
    let subscription;
    let userEmail = '';

    const setup = async () => {
      setLoading(true);
      userEmail = await AsyncStorage.getItem('email');
      if (!userEmail) {
        setLoading(false);
        return;
      }
      // Get latest order for this user that is not finished
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('email', userEmail)
        .neq('status', 'Finished')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) setOrder(data);
      else setOrder(null);
      setLoading(false);

      // Subscribe to changes in the orders table for this user
      subscription = supabase
        .channel(`order-status-${userEmail}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `email=eq.${userEmail}`,
          },
          payload => {
            console.log('Realtime payload:', payload);
            setOrder(payload.new);
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Order Status Updated',
                body: `Your order status changed to "${payload.new.status}"`,
              },
              trigger: null,
            });
          }
        )
        .subscribe();
    };

    setup();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>No order found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.trackingTitle}>Order Tracking</Text>
      <View style={styles.progressRow}>
        <View style={styles.progressStep}>
          <View style={[styles.circle, isStepActive('Validation') && styles.circleActive]} />
          <Text style={styles.progressLabel}>Validation</Text>
        </View>
        <View style={[styles.progressLine, isStepActive('Layout Approval') && styles.progressLineActive]} />
        <View style={styles.progressStep}>
          <View style={[styles.circle, isStepActive('Layout Approval') && styles.circleActive]} />
          <Text style={styles.progressLabel}>Layout Approval</Text>
        </View>
        <View style={[styles.progressLine, isStepActive('Printing') && styles.progressLineActive]} />
        <View style={styles.progressStep}>
          <View style={[styles.circle, isStepActive('Printing') && styles.circleActive]} />
          <Text style={styles.progressLabel}>Printing</Text>
        </View>
        <View style={[styles.progressLine, isStepActive('For Pickup') && styles.progressLineActive]} />
        <View style={styles.progressStep}>
          <View style={[styles.circle, isStepActive('For Pickup') && styles.circleActive]} />
          <Text style={styles.progressLabel}>For Pickup</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        <View style={styles.headerRow}>
          <Image source={{ uri: order.image_url }} style={styles.productImage} />
          <Text style={styles.productTitle}>{order.variant || order.product}</Text>
        </View>
        <TextInput
          style={styles.fileInput}
          value={order.has_file ? 'file.pdf' : 'No file attached'}
          editable={false}
        />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Size</Text>
          <Text style={styles.detailValue}>
            {order.height && order.width ? `${order.height} x ${order.width}` : '---'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>No. of pcs</Text>
          <Text style={styles.detailValue}>{order.quantity} pcs</Text>
        </View>
        {order.eyelets && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Eyelets</Text>
            <Text style={styles.detailValue}>{order.eyelets}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date to pickup</Text>
          <Text style={styles.detailValue}>{order.pickup_date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time to pickup</Text>
          <Text style={styles.detailValue}>{order.pickup_time}</Text>
        </View>
        <Text style={styles.instructionsLabel}>Instructions</Text>
        <TextInput
          style={styles.instructionsInput}
          value={order.instructions}
          editable={false}
          multiline
        />
        <View style={styles.priceRow}>
          <Text style={styles.priceLabelTotal}>TOTAL</Text>
          <Text style={styles.priceValueTotal}>₱ {order.total}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text style={styles.detailValue}>{order.status}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
    alignItems: 'center',
  },
  trackingTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 4,
    width: '100%',
    maxWidth: 370,
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    width: 70,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ccc',
    marginBottom: 2,
  },
  circleActive: {
    backgroundColor: '#4CAF50',
  },
  progressLabel: {
    fontSize: 11,
    color: '#222',
    textAlign: 'center',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#ccc',
    marginHorizontal: 2,
  },
  progressLineActive: {
    backgroundColor: '#4CAF50',
  },
  summaryCard: {
    backgroundColor: '#eee',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    width: '100%',
    maxWidth: 370,
    alignSelf: 'center',
  },
  summaryTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
    color: '#232B55',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  productTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#232B55',
    flex: 1,
    flexWrap: 'wrap',
  },
  fileInput: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  detailLabel: {
    color: '#222',
    fontSize: 14,
  },
  detailValue: {
    color: '#232B55',
    fontWeight: 'bold',
    fontSize: 14,
  },
  instructionsLabel: {
    marginTop: 8,
    color: '#222',
    fontSize: 14,
    marginBottom: 2,
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
    minHeight: 48,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 2,
  },
  priceLabel: {
    color: '#222',
    fontSize: 15,
  },
  priceValue: {
    color: '#232B55',
    fontWeight: 'bold',
    fontSize: 15,
  },
  priceLabelTotal: {
    color: '#232B55',
    fontWeight: 'bold',
    fontSize: 17,
    marginTop: 8,
  },
  priceValueTotal: {
    color: '#232B55',
    fontWeight: 'bold',
    fontSize: 17,
    marginTop: 8,
  },
});