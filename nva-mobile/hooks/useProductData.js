import { useEffect, useState } from 'react';
import { supabase } from '../SupabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useProductData = (product) => {
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [productData, setProductData] = useState(null);

  // Fetch product and variants from Supabase
  useEffect(() => {
    const fetchProductAndVariants = async () => {
      if (!product) return;
      const { data: products, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('name', product)
        .limit(1);

      if (pErr) {
        console.warn('Product fetch error:', pErr.message);
        return;
      }

      if (products && products.length > 0) {
        const prod = products[0];
        setProductData(prod);

        const { data: vdata, error: vErr } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', prod.product_id);

        if (vErr) {
          console.warn('Variants fetch error:', vErr.message);
        }

        const list = vdata || [];
        setVariants(list);

        // Auto-select first variant if none selected
        if (list.length > 0 && !selectedVariant) {
          setSelectedVariant(list[0]);
        }
      }
    };
    fetchProductAndVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Fetch customer info from AsyncStorage and Supabase
  const fetchCustomer = async () => {
    try {
      const email = await AsyncStorage.getItem('email');
      if (!email) return null;
      const { data, error } = await supabase
        .from('customers')
        .select('first_name,last_name,phone_number,address')
        .eq('email', email)
        .single();
      if (error) {
        console.warn('Customer fetch error:', error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('AsyncStorage error:', e.message);
      return null;
    }
  };

  return { variants, selectedVariant, setSelectedVariant, productData, fetchCustomer };
};

export default useProductData;
