import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ImageBackground, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../SupabaseClient';

export default function Home() {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch products from Supabase
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('product_id,name,category,image_url');
      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleProductPress = (product) => {
    navigation.navigate('OrderForm', { product: product.name });
  };

  return (
    <ImageBackground
      source={require('../assets/Dashboard.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Custom Header */}
        <View style={styles.header}>
          <Text style={styles.headerLine}>
            <Text style={styles.italicBoldUnderline}>Fast Picks</Text>
          </Text>
          <Text style={styles.headerLine}>
            <Text style={styles.italicBoldUnderline}>for Fast Prints.</Text>
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#232B55" style={{ marginTop: 120 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              {products.map((item) => (
                <TouchableOpacity
                  key={item.product_id}
                  style={[styles.gridItem, { backgroundColor: '#F8F9FF', borderWidth: 0 }]}
                  onPress={() => handleProductPress(item)}
                >
                  <Image
                    source={item.image_url ? { uri: item.image_url } : require('../assets/nvago-icon.png')}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.gridText}>{item.name}</Text>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Wavy Divider */}
        <View style={styles.waveContainer}>
          <View style={styles.wave} />
        </View>
      </View>
    </ImageBackground>
  );
}

const { width } = Dimensions.get('window');
const gridItemSize = (width - 64) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 30,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  headerLine: {
    fontSize: 28,
    marginBottom: 2,
  },
  italicBoldUnderline: {
    fontStyle: 'italic',
    fontWeight: 'bold',
    color: '#3A4286',
    textDecorationColor: '#2196F3',
    textDecorationStyle: 'solid',
  },
  gridContainer: {
    marginTop: 120,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: gridItemSize,
    height: gridItemSize + 40,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: '#F8F9FF',
    borderWidth: 0,
    padding: 8,
  },
  productImage: {
    width: gridItemSize - 16,
    height: gridItemSize - 32,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#eee',
  },
  gridText: {
    color: '#232B55',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  categoryText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 60,
    overflow: 'hidden',
  },
  wave: {
    width: '200%',
    height: 80,
    backgroundColor: '#232B55',
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    alignSelf: 'center',
    position: 'absolute',
    bottom: -20,
  },
});
