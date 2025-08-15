import React from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView } from 'react-native';

export default function TrackOrder() {
  // Example order data (replace with real data as needed)
  const order = {
    product: 'Tarpaulin',
    fileAttached: false,
    size: '5x3',
    pcs: '1',
    eyelets: '4',
    quality: 'High Quality',
    pickupDate: '2025-05-30',
    pickupTime: '2:00 PM',
    instructions: '',
    subtotal: 229,
    layout: 150,
    total: 379,
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.trackingTitle}>Order Tracking</Text>
      <View style={styles.progressRow}>
        <View style={styles.progressStep}>
          <View style={[styles.circle, styles.circleActive]} />
          <Text style={styles.progressLabel}>Validation</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={styles.circle} />
          <Text style={styles.progressLabel}>Layout Approval</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={styles.circle} />
          <Text style={styles.progressLabel}>Printing</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={styles.circle} />
          <Text style={styles.progressLabel}>For Pickup</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        <View style={styles.headerRow}>
          <Image source={order.image} style={styles.productImage} />
          <Text style={styles.productTitle}>{order.product}</Text>
        </View>
        <TextInput
          style={styles.fileInput}
          value={order.fileAttached ? 'file.pdf' : 'No file attached'}
          editable={false}
        />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Size</Text>
          <Text style={styles.detailValue}>{order.size}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>No. of pcs</Text>
          <Text style={styles.detailValue}>{order.pcs} pcs</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Eyelets</Text>
          <Text style={styles.detailValue}>{order.eyelets}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quality</Text>
          <Text style={styles.detailValue}>{order.quality}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date to pickup</Text>
          <Text style={styles.detailValue}>{order.pickupDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time to pickup</Text>
          <Text style={styles.detailValue}>{order.pickupTime}</Text>
        </View>
        <Text style={styles.instructionsLabel}>Instructions</Text>
        <TextInput
          style={styles.instructionsInput}
          value={order.instructions}
          editable={false}
          multiline
        />
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Subtotal</Text>
          <Text style={styles.priceValue}>₱ {order.subtotal}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Layout</Text>
          <Text style={styles.priceValue}>₱ {order.layout}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabelTotal}>TOTAL</Text>
          <Text style={styles.priceValueTotal}>₱ {order.total}</Text>
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