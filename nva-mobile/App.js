import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Text, TouchableOpacity, Dimensions, Image } from 'react-native';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import Home from './screens/Home';
import Verification from './screens/Verification';
import OrderForm from './screens/OrderForm';
import TrackOrder from './screens/TrackOrder';
import Payment from './screens/Payment';
import { FontAwesome, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // If you want to persist user info
import ForgotPassword from './screens/ForgotPassword';
import OrderHistory from './screens/OrderHistory';
import Messaging from './screens/Messaging';
const Stack = createStackNavigator();
const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(width * 0.8, 320);

function SplashScreen({ navigation }) {
  const [showSecond, setShowSecond] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // After 2s, fade out the first splash (light), fade in the second (dark)
    setTimeout(() => {
      setShowSecond(true);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // After fade, wait 2s then go to Login
        setTimeout(() => navigation.replace('Login'), 2000);
      });
    }, 2000);
  }, []);

  return (
    <View style={styles.splash}>
      {!showSecond ? (
        <Animated.Image
          source={require('./assets/splash-light.png')}
          style={[styles.splash, { opacity: 1 }]}
          resizeMode="cover"
        />
      ) : (
        <Animated.Image
          source={require('./assets/splash-dark.png')}
          style={[styles.splash, { opacity: fadeAnim }]}
          resizeMode="cover"
        />
      )}
    </View>
  );
}

function Sidebar({ visible, onClose, userName }) {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -SIDEBAR_WIDTH,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  const handleLogout = async () => {
    onClose();
    navigation.replace('Login');
  };

  const handleTrackOrder = () => {
    onClose();
    navigation.navigate('TrackOrder');
  };

  return (
    <>
      {visible && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      )}
      <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
        {/* Header */}
        <View style={styles.sidebarHeader}>
          <View style={styles.profilePic} />
          <View>
            <Text style={styles.profileName}>{userName || 'Guest'}</Text>
            <Text style={styles.profileLink}>View Profile</Text>
          </View>
        </View>
        {/* Blue Divider */}
        <View style={styles.sidebarBlueDivider} />
        {/* Menu Items */}
        <View style={styles.sidebarMenu}>
          <SidebarItem icon="home" lib="FontAwesome" label="Home" color="#232B55" onPress={() => navigation.navigate('Home')} />
          <SidebarItem icon="search" lib="FontAwesome" label="Track Order" color="#232B55" onPress={handleTrackOrder} />
          <SidebarItem icon="history" lib="FontAwesome" label="Order History" color="#232B55" onPress={() => { onClose(); navigation.navigate('OrderHistory'); }} />
          <SidebarItem icon="message-circle" lib="Feather" label="Messaging" color="#232B55" onPress={() => { onClose(); navigation.navigate('Messaging'); }} />
        </View>
        {/* Bottom Actions */}
        <View style={styles.sidebarBottomBox}>
          <SidebarItem icon="cog" lib="FontAwesome" label="Settings" color="#232B55" />
          <SidebarItem icon="sign-out" lib="FontAwesome" label="Log out" color="#232B55" onPress={handleLogout} />
        </View>
      </Animated.View>
    </>
  );
}

function SidebarItem({ icon, lib, label, onPress, color }) {
  let IconComponent = FontAwesome;
  if (lib === 'Feather') IconComponent = Feather;
  // Add more icon libraries if needed

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <View style={styles.sidebarItem}>
        <IconComponent name={icon} size={18} color={color || "#888"} style={{ marginRight: 16 }} />
        <Text style={[styles.sidebarItemText, { color: color || "#232B55" }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function CustomHeader({ onMenu }) {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.menuButton} onPress={onMenu}>
        <FontAwesome name="bars" size={28} color="#fff" />
      </TouchableOpacity>
      <View style={styles.logoContainer}>
        <Image
          source={require('./assets/nvago-icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

function ScreenWithHeaderSidebar({ children }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const route = useRoute();

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('firstName'),
      AsyncStorage.getItem('lastName')
    ]).then(([first, last]) => {
      if (first || last) setFullName(`${first || ''} ${last || ''}`.trim());
    });
  }, []);

  // List of screens that should NOT have header/sidebar
  const excludedScreens = [
    'Login',
    'SignUp',
    'Verification',
    'ForgotPassword',
    'Splash'
  ];

  if (excludedScreens.includes(route.name)) {
    return children;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#232B55' }}>
      <CustomHeader onMenu={() => setSidebarVisible(true)} />
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {children}
      </View>
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} userName={fullName} />
    </View>
  );
}

// Example for React Navigation
const linking = {
  prefixes: ['nvamobile://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      // ...other screens
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Verification" component={Verification} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen
          name="Home"
          children={props => (
            <ScreenWithHeaderSidebar>
              <Home {...props} />
            </ScreenWithHeaderSidebar>
          )}
        />
        <Stack.Screen
          name="OrderForm"
          children={props => (
            <ScreenWithHeaderSidebar>
              <OrderForm {...props} />
            </ScreenWithHeaderSidebar>
          )}
        />
        <Stack.Screen
          name="Payment"
          children={props => (
            <ScreenWithHeaderSidebar>
              <Payment {...props} />
            </ScreenWithHeaderSidebar>
          )}
        />
        <Stack.Screen
          name="TrackOrder"
          children={props => (
            <ScreenWithHeaderSidebar>
              <TrackOrder {...props} />
            </ScreenWithHeaderSidebar>
          )}
        />
        <Stack.Screen
          name="OrderHistory"
          children={props => (
            <ScreenWithHeaderSidebar>
              <OrderHistory {...props} />
            </ScreenWithHeaderSidebar>
          )}
        />
        <Stack.Screen
          name="Messaging"
          children={props => (
            <ScreenWithHeaderSidebar>
              <Messaging {...props} />
            </ScreenWithHeaderSidebar>
          )}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // <-- changed from 'space-between' to 'flex-end'
    backgroundColor: '#232B55',
    paddingTop: 36,
    paddingBottom: 12,
    paddingHorizontal: 18,
  },
  menuButton: {
    padding: 4,
    marginRight: 'auto', // <-- push everything else to the right
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 48,
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 10,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#fff',
    zIndex: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 0 },
  },
  sidebarHeader: {
    backgroundColor: '#232B55',
    paddingTop: 36,
    paddingBottom: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ccc',
    marginRight: 14,
  },
  profileName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  profileLink: {
    color: '#d1d5e0',
    fontSize: 13,
  },
  sidebarBlueDivider: {
    height: 3,
    backgroundColor: '#1877F3',
    width: '100%',
  },
  sidebarMenu: {
    paddingTop: 18,
    paddingHorizontal: 18,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sidebarItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  sidebarBottomBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});