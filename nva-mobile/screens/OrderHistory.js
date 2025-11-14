import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../SupabaseClient';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

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
    
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    (async () => {
      const email = await loadUserEmail();
      await loadOrders(email);
    })();
  }, [loadUserEmail, loadOrders]);

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
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <LinearGradient
          colors={['#232B55', '#4A5698']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <FontAwesome name="history" size={28} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Order History</Text>
              <Text style={styles.headerSubtitle}>
                {orders.length} {orders.length === 1 ? 'order' : 'orders'} completed
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Empty States */}
      {!userEmail && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <FontAwesome name="user-times" size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>Not Logged In</Text>
          <Text style={styles.emptyText}>
            Please log in to view your finished orders
          </Text>
        </View>
      )}

      {userEmail && orders.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <FontAwesome name="shopping-bag" size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptyText}>
            Your completed orders will appear here
          </Text>
        </View>
      )}

      {/* Orders List */}
      <Animated.View style={{ opacity: fadeAnim }}>
        {orders.map((order, index) => {
          const hasTitle =
            (typeof order.product_name === 'string' && order.product_name.trim().length > 0) ||
            (typeof order.variant === 'string' && order.variant.trim().length > 0);
          const productTitle = order.product_name?.trim() || order.variant?.trim() || 'Order';

          const hasTotal = Number.isFinite(Number(order.total));
          const created = order.created_at ? new Date(order.created_at) : null;
          const createdText = created 
            ? created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : null;

          const showDims =
            Number.isFinite(Number(order.height)) &&
            Number.isFinite(Number(order.width)) &&
            Number(order.height) > 0 &&
            Number(order.width) > 0;

          const eyeletsVal = parseInt(order.eyelets);
          const showEyelets = Number.isFinite(eyeletsVal) && eyeletsVal > 0;

          const hasFileBool = order.has_file === true || String(order.has_file).toLowerCase() === 'true';
          const layoutFee = hasFileBool ? 0 : 150;

          const isExpanded = expandedId === order.id;

          return (
            <TouchableOpacity 
              key={order.id} 
              onPress={() => toggleExpand(order.id)} 
              activeOpacity={0.7}
              style={styles.orderCardContainer}
            >
              <View style={styles.orderCard}>
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  {order.image_url ? (
                    <View style={styles.imageContainer}>
                      <Image 
                        source={{ uri: order.image_url }} 
                        style={styles.productImage} 
                      />
                      <View style={styles.imageOverlay}>
                        <FontAwesome name="check-circle" size={20} color="#fff" />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.placeholderImage}>
                      <FontAwesome name="file-text" size={32} color="#9CA3AF" />
                    </View>
                  )}

                  <View style={styles.orderMainInfo}>
                    <View style={styles.titleRow}>
                      {hasTitle && <Text style={styles.productTitle}>{productTitle}</Text>}
                      <View style={styles.statusBadge}>
                        <FontAwesome name="check" size={10} color="#10B981" />
                        <Text style={styles.statusText}>Finished</Text>
                      </View>
                    </View>
                    
                    {hasTotal && (
                      <Text style={styles.totalText}>{peso(order.total)}</Text>
                    )}
                    
                    <View style={styles.metaRow}>
                      <FontAwesome name="calendar" size={12} color="#9CA3AF" />
                      {createdText && (
                        <Text style={styles.metaText}>{createdText}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.expandIcon}>
                    <FontAwesome 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#6B7280" 
                    />
                  </View>
                </View>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.detailsBox}>
                    <View style={styles.detailsHeader}>
                      <FontAwesome name="info-circle" size={14} color="#007AFF" />
                      <Text style={styles.detailsHeaderText}>Order Details</Text>
                    </View>
                    
                    <View style={styles.detailsContent}>
                      {Number.isFinite(Number(order.quantity)) && Number(order.quantity) > 0 && (
                        <DetailRow 
                          icon="cubes" 
                          label="Quantity" 
                          value={`${order.quantity}`} 
                        />
                      )}
                      {showDims && (
                        <DetailRow 
                          icon="arrows-alt" 
                          label="Dimensions" 
                          value={`${order.height} × ${order.width} ft`} 
                        />
                      )}
                      {showEyelets && (
                        <DetailRow 
                          icon="circle-o" 
                          label="Eyelets" 
                          value={`${eyeletsVal}`} 
                        />
                      )}
                      <DetailRow 
                        icon="file-image-o" 
                        label="Has File" 
                        value={hasFileBool ? 'Yes' : 'No'} 
                      />
                      {!hasFileBool && (
                        <DetailRow 
                          icon="paint-brush" 
                          label="Layout Fee" 
                          value={peso(layoutFee)} 
                        />
                      )}
                      {(order.pickup_date || order.pickup_time) && (
                        <DetailRow 
                          icon="calendar-check-o" 
                          label="Pickup" 
                          value={`${order.pickup_date || ''} ${order.pickup_time || ''}`.trim()} 
                        />
                      )}
                      {order.instructions && (
                        <DetailRow 
                          icon="comment" 
                          label="Instructions" 
                          value={order.instructions} 
                          multiline 
                        />
                      )}
                    </View>

                    {hasTotal && (
                      <View style={styles.totalSection}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalAmount}>{peso(order.total)}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, multiline }) {
  return (
    <View style={[styles.detailRow, multiline && styles.detailRowMultiline]}>
      <View style={styles.detailLabelContainer}>
        <FontAwesome name={icon} size={14} color="#6B7280" style={styles.detailIcon} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={[styles.detailValue, multiline && styles.detailValueMultiline]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8F9FD',
    flexGrow: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Header
  headerSection: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#232B55',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    padding: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Order Cards
  orderCardContainer: {
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  orderMainInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  productTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 4,
  },
  totalText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#007AFF',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 6,
    fontWeight: '500',
  },
  expandIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Details Box
  detailsBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailsHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    marginLeft: 8,
  },
  detailsContent: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  detailRowMultiline: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A2E',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  detailValueMultiline: {
    textAlign: 'left',
    marginTop: 8,
    lineHeight: 20,
  },

  // Total Section
  totalSection: {
    backgroundColor: '#EBF5FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#007AFF',
  },

  bottomSpace: {
    height: 20,
  },
});