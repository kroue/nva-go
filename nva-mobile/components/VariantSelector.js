import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const VariantSelector = ({ variants, selectedVariant, setSelectedVariant }) => {
  if (variants.length === 0) return null;

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.sectionTitle}>Choose Variant</Text>
      {variants.map((variant, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            styles.variantBtn,
            selectedVariant === variant && styles.variantBtnSelected
          ]}
          onPress={() => setSelectedVariant(variant)}
        >
          <Text style={[styles.variantText, selectedVariant === variant && { color: '#fff' }]}>
            {variant.description || variant.size || 'Variant'} - Retail: ₱{variant.retail_price}
            {variant.wholesale_price ? ` / Wholesale: ₱${variant.wholesale_price}` : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: 'bold', fontSize: 16, color: '#232B55', marginTop: 8, marginBottom: 6 },
  variantBtn: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#232B55', marginBottom: 6, backgroundColor: '#fff' },
  variantBtnSelected: { backgroundColor: '#232B55', borderColor: '#2196F3' },
  variantText: { color: '#232B55', fontSize: 15 },
});

export default VariantSelector;
