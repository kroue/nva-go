import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ImageBackground, Image, ActivityIndicator, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../SupabaseClient';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Home() {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  useEffect(() => {
    // Fetch products from Supabase
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('product_id,name,category,image_url');
        
        console.log('Products data:', data);
        console.log('Products error:', error);
        
        if (!error && data) {
          setProducts(data);
          // Animate in after products load
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]).start();
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleProductPress = (product) => {
    navigation.navigate('OrderForm', { product });
  };

  return (
    <ImageBackground
      source={require('../assets/Dashboard.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Modern Header */}


        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#232B55" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.loadingContainer}>
            <FontAwesome name="inbox" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No products available</Text>
          </View>
        ) : (
          <Animated.View
            style={{
              flex: 1,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <ScrollView 
              contentContainerStyle={styles.gridContainer} 
              showsVerticalScrollIndicator={false}
            >
              {/* Products Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Our Products</Text>
                <Text style={styles.sectionSubtitle}>Choose from our collection</Text>
              </View>

              <View style={styles.grid}>
                {products.map((item, index) => (
                  <TouchableOpacity
                    key={item.product_id || index}
                    style={styles.gridItem}
                    onPress={() => handleProductPress(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.productCard}>
                      {/* Product Image */}
                      <View style={styles.imageContainer}>
                        <Image
                          source={item.image_url ? { uri: item.image_url } : require('../assets/nvago-icon.png')}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                        {/* Overlay Gradient */}
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.1)']}
                          style={styles.imageOverlay}
                        />
                      </View>

                      {/* Product Info */}
                      <View style={styles.productInfo}>
                        <Text style={styles.gridText} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText} numberOfLines={1}>
                            {item.category}
                          </Text>
                        </View>
                      </View>

                      {/* Hover Effect Icon */}
                      <View style={styles.selectIcon}>
                        <FontAwesome name="chevron-right" size={12} color="#232B55" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Animated.View>
        )}

        {/* Enhanced Wave Footer */}
      </View>
    </ImageBackground>
  );
}

const { width } = Dimensions.get('window');
const gridItemSize = (width - 64) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  titleContainer: {
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#232B55',
    fontStyle: 'italic',
  },
  headerSubtitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4A5698',
    fontStyle: 'italic',
  },
  profileButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#232B55',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  profileGradient: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#999',
    fontWeight: '500',
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  sectionHeader: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: gridItemSize,
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: gridItemSize - 60,
    backgroundColor: '#F8F9FA',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  productInfo: {
    padding: 12,
  },
  gridText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#232B55',
    fontSize: 12,
    fontWeight: '600',
  },
  selectIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 80,
    overflow: 'hidden',
  },
  wave: {
    width: '200%',
    height: 100,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    alignSelf: 'center',
    position: 'absolute',
    bottom: -20,
  },
});