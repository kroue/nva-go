
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, Animated, TouchableOpacity, Modal } from 'react-native';
import { supabase } from '../SupabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const statuses = ['Validation', 'Layout Approval', 'Printing', 'For Pickup'];

export default function TrackOrder() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(20));
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const isStepActive = (step) => {
    const currentIndex = statuses.indexOf(order?.status);
    const stepIndex = statuses.indexOf(step);
    return currentIndex >= stepIndex;
  };

  const isCurrentStep = (step) => {
    return order?.status === step;
  };

  const getStepIcon = (step) => {
    const icons = {
      'Validation': 'check-circle',
      'Layout Approval': 'file-text-o',
      'Printing': 'print',
      'For Pickup': 'shopping-bag'
    };
    return icons[step] || 'circle';
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [order]);

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#232B55" />
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome name="inbox" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>No Active Orders</Text>
        <Text style={styles.emptyText}>You don't have any orders to track</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={['#232B55', '#4A5698']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <FontAwesome name="map-marker" size={32} color="#fff" />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Track Your Order</Text>
              <Text style={styles.headerSubtitle}>Real-time status updates</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Progress Tracker */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Order Progress</Text>
          <View style={styles.progressContainer}>
            {statuses.map((step, index) => (
              <View key={step} style={styles.progressStepWrapper}>
                <View style={styles.progressStep}>
                  {/* Circle with Icon */}
                  <View style={[
                    styles.circle,
                    isStepActive(step) && styles.circleActive,
                    isCurrentStep(step) && styles.circleCurrent
                  ]}>
                    <FontAwesome 
                      name={getStepIcon(step)} 
                      size={16} 
                      color={isStepActive(step) ? '#fff' : '#999'} 
                    />
                  </View>
                  
                  {/* Label */}
                  <Text style={[
                    styles.progressLabel,
                    isCurrentStep(step) && styles.progressLabelCurrent
                  ]}>
                    {step}
                  </Text>
                  
                  {/* Current Status Badge */}
                  {isCurrentStep(step) && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>

                {/* Connecting Line */}
                {index < statuses.length - 1 && (
                  <View style={[
                    styles.progressLine,
                    isStepActive(statuses[index + 1]) && styles.progressLineActive
                  ]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Order Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <FontAwesome name="file-text" size={20} color="#232B55" />
            <Text style={styles.cardTitle}>Order Details</Text>
          </View>

          {/* Product Info */}
          <View style={styles.productSection}>
            {order.image_url && (
              <Image source={{ uri: order.image_url }} style={styles.productImage} />
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{order.variant || order.product}</Text>
              <View style={styles.statusBadge}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isCurrentStep(order.status) ? '#FFC107' : '#4CAF50' }
                ]} />
                <Text style={styles.statusText}>{order.status}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* File Attached */}
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => {
              if (order.attached_file) {
                setSelectedImage(order.attached_file);
                setImageModalVisible(true);
              }
            }}
            disabled={!order.attached_file}
          >
            <View style={styles.infoIconContainer}>
              <FontAwesome name="paperclip" size={16} color="#232B55" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>File Attached</Text>
              <Text style={[styles.infoValue, order.attached_file && styles.linkText]}>
                {order.attached_file ? order.attached_file.split('/').pop() : 'No file'}
              </Text>
            </View>
            {order.attached_file && (
              <FontAwesome name="external-link" size={14} color="#232B55" />
            )}
          </TouchableOpacity>

          {/* Dimensions */}
          {(order.height && order.width) && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <FontAwesome name="expand" size={16} color="#232B55" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Size</Text>
                <Text style={styles.infoValue}>{order.height} x {order.width}</Text>
              </View>
            </View>
          )}

          {/* Quantity */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <FontAwesome name="cubes" size={16} color="#232B55" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Quantity</Text>
              <Text style={styles.infoValue}>{order.quantity} pcs</Text>
            </View>
          </View>

          {/* Eyelets */}
          {order.eyelets && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <FontAwesome name="circle-o" size={16} color="#232B55" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Eyelets</Text>
                <Text style={styles.infoValue}>{order.eyelets}</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Pickup Date */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <FontAwesome name="calendar" size={16} color="#232B55" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Pickup Date</Text>
              <Text style={styles.infoValue}>{order.pickup_date}</Text>
            </View>
          </View>

          {/* Pickup Time */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <FontAwesome name="clock-o" size={16} color="#232B55" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Pickup Time</Text>
              <Text style={styles.infoValue}>{order.pickup_time}</Text>
            </View>
          </View>

          {/* Instructions */}
          {order.instructions && (
            <>
              <View style={styles.divider} />
              <View style={styles.instructionsSection}>
                <View style={styles.instructionsHeader}>
                  <FontAwesome name="info-circle" size={16} color="#232B55" />
                  <Text style={styles.instructionsLabel}>Special Instructions</Text>
                </View>
                <Text style={styles.instructionsText}>{order.instructions}</Text>
              </View>
            </>
          )}

          {/* Total Price */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₱ {order.total}</Text>
          </View>
        </View>

        {/* Image Modal */}
        <Modal
          visible={imageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setImageModalVisible(false)}
              >
                <FontAwesome name="arrow-left" size={24} color="#232B55" />
              </TouchableOpacity>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </Modal>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  headerSection: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#232B55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  progressStepWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  circleActive: {
    backgroundColor: '#4CAF50',
  },
  circleCurrent: {
    backgroundColor: '#FFC107',
  },
  progressLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4,
  },
  progressLabelCurrent: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  currentBadge: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  currentBadgeText: {
    fontSize: 9,
    color: '#F57C00',
    fontWeight: 'bold',
  },
  progressLine: {
    width: 20,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginTop: -40,
  },
  progressLineActive: {
    backgroundColor: '#4CAF50',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  productSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#232B55',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  instructionsSection: {
    marginTop: 4,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#232B55',
    marginLeft: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
  },
  totalSection: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F2FF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#232B55',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232B55',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#232B55',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '70%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  modalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
});
