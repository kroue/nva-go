import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../SupabaseClient';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  const loadUserEmail = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const email = data?.user?.email || (await AsyncStorage.getItem('userEmail'));
      setUserEmail(email || null);
      return email || null;
    } catch {
      const email = await AsyncStorage.getItem('userEmail');
      setUserEmail(email || null);
      return email || null;
    }
  }, []);

  const loadOrders = useCallback(async (email) => {
    if (!email) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('email', email)
      .eq('status', 'Finished')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const email = await loadUserEmail();
      await loadOrders(email);
    })();
  }, [loadUserEmail, loadOrders]);

  // Reload when screen gains focus (ensures latest data is shown)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const email = await loadUserEmail();
        if (active) await loadOrders(email);
      })();
      return () => {
        active = false;
      };
    }, [loadUserEmail, loadOrders])
  );

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const peso = (n) =>
    '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#232B55" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Order History</Text>

      {!userEmail && (
        <Text style={styles.helper}>Please log in to view your finished orders.</Text>
      )}

      {userEmail && orders.length === 0 && (
        <Text style={styles.helper}>No finished orders yet.</Text>
      )}

      {orders.map((order) => {
        const hasTitle =
          (typeof order.product_name === 'string' && order.product_name.trim().length > 0) ||
          (typeof order.variant === 'string' && order.variant.trim().length > 0);
        const productTitle = order.product_name?.trim() || order.variant?.trim() || null;

        const hasTotal = Number.isFinite(Number(order.total));
        const created = order.created_at ? new Date(order.created_at) : null;
        const createdText = created ? created.toLocaleString() : null;

        const showDims =
          Number.isFinite(Number(order.height)) &&
          Number.isFinite(Number(order.width)) &&
          Number(order.height) > 0 &&
          Number(order.width) > 0;

        const eyeletsVal = parseInt(order.eyelets);
        const showEyelets = Number.isFinite(eyeletsVal) && eyeletsVal > 0;

        const hasFileBool = order.has_file === true || String(order.has_file).toLowerCase() === 'true';
        const layoutFee = hasFileBool ? 0 : 150;

        return (
          <TouchableOpacity key={order.id} onPress={() => toggleExpand(order.id)} activeOpacity={0.8}>
            <View style={styles.orderCard}>
              {/* No placeholder image; render only if image_url exists */}
              {order.image_url ? (
                <Image source={{ uri: order.image_url }} style={styles.productImage} />
              ) : null}

              <View style={styles.orderInfo}>
                {hasTitle ? <Text style={styles.productTitle}>{productTitle}</Text> : null}
                {hasTotal ? <Text style={styles.totalText}>{peso(order.total)}</Text> : null}
                {createdText ? <Text style={styles.metaText}>Finished • {createdText}</Text> : null}
              </View>
            </View>

            {expandedId === order.id && (
              <View style={styles.detailsBox}>
                {Number.isFinite(Number(order.quantity)) && Number(order.quantity) > 0 ? (
                  <Row label="Quantity" value={`${order.quantity}`} />
                ) : null}
                {showDims ? (
                  <Row label="Dimensions" value={`${order.height} × ${order.width} ft`} />
                ) : null}
                {showEyelets ? <Row label="Eyelets" value={`${eyeletsVal}`} /> : null}
                <Row label="Has File" value={hasFileBool ? 'Yes' : 'No'} />
                {!hasFileBool ? <Row label="Layout Fee" value={peso(layoutFee)} /> : null}
                {(order.pickup_date || order.pickup_time) ? (
                  <Row label="Pickup" value={`${order.pickup_date || ''} ${order.pickup_time || ''}`.trim()} />
                ) : null}
                {order.instructions ? <Row label="Instructions" value={order.instructions} /> : null}
                {order.status ? <Row label="Status" value={order.status} /> : null}
                {hasTotal ? <Row label="Total" value={peso(order.total)} bold /> : null}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.bold]}>{label}:</Text>
      <Text style={[styles.rowValue, bold && styles.bold]}>{value}</Text>
    </View>
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
  helper: {
    color: '#666',
    marginBottom: 12,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    padding: 8,
    elevation: 1,
  },
  productImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    // Removed gray placeholder background
    // backgroundColor: '#eee',
  },
  orderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232B55',
    marginBottom: 4,
  },
  totalText: {
    fontWeight: 'bold',
    color: '#232B55',
    fontSize: 15,
  },
  metaText: {
    color: '#667085',
    fontSize: 12,
    marginTop: 2,
  },
  detailsBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    padding: 10,
    marginLeft: 8,
    marginRight: 8,
    borderColor: '#e6e6e6',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  rowLabel: {
    width: 110,
    color: '#232B55',
    fontSize: 13,
  },
  rowValue: {
    flex: 1,
    color: '#333',
    fontSize: 13,
  },
  bold: {
    fontWeight: 'bold',
  },
});