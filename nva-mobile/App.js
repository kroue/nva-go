import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Text, TouchableOpacity, Dimensions, Image } from 'react-native';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Import screens
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import Home from './screens/Home';
import OrderForm from './screens/OrderForm';
import OrderHistory from './screens/OrderHistory';
import Payment from './screens/Payment';
import Profile from './screens/Profile';
import TrackOrder from './screens/TrackOrder';
import Messaging from './screens/Messaging';
import ForgotPassword from './screens/ForgotPassword';
import ResetPassword from './screens/ResetPassword';
import Verification from './screens/Verification';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
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

function Sidebar({ visible, onClose }) {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -SIDEBAR_WIDTH,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [first, last] = await Promise.all([
          AsyncStorage.getItem('firstName'),
          AsyncStorage.getItem('lastName')
        ]);
        if (first || last) {
          setFullName(`${first || ''} ${last || ''}`.trim());
        } else {
          setFullName('Guest');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setFullName('Guest');
      }
    };
    
    if (visible) {
      loadUserData();
    }
  }, [visible]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      onClose();
      navigation.replace('Login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleTrackOrder = () => {
    onClose();
    navigation.navigate('TrackOrder');
  };

  const handleViewProfile = () => {
    onClose();
    navigation.navigate('Profile');
  };

  return (
    <>
      {visible && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      )}
      <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
        {/* Header */}
        <View style={styles.sidebarHeader}>
          <View style={styles.profilePic}>
            <FontAwesome name="user" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.profileName}>{fullName}</Text>
            <TouchableOpacity onPress={handleViewProfile}>
              <Text style={styles.profileLink}>View Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Blue Divider */}
        <View style={styles.sidebarBlueDivider} />
        {/* Menu Items */}
        <View style={styles.sidebarMenu}>
          <SidebarItem 
            icon="home" 
            lib="FontAwesome" 
            label="Home" 
            color="#232B55" 
            onPress={() => {
              onClose();
              navigation.navigate('Home');
            }} 
          />
          <SidebarItem 
            icon="search" 
            lib="FontAwesome" 
            label="Track Order" 
            color="#232B55" 
            onPress={handleTrackOrder} 
          />
          <SidebarItem 
            icon="history" 
            lib="FontAwesome" 
            label="Order History" 
            color="#232B55" 
            onPress={() => { 
              onClose(); 
              navigation.navigate('OrderHistory'); 
            }} 
          />
          <SidebarItem 
            icon="message-circle" 
            lib="Feather" 
            label="Messaging" 
            color="#232B55" 
            onPress={() => { 
              onClose(); 
              navigation.navigate('Messaging'); 
            }} 
          />
        </View>
        {/* Bottom Actions */}
        <View style={styles.sidebarBottomBox}>
          <SidebarItem 
            icon="sign-out" 
            lib="FontAwesome" 
            label="Log out" 
            color="#232B55" 
            onPress={handleLogout} 
          />
        </View>
      </Animated.View>
    </>
  );
}

function SidebarItem({ icon, lib, label, onPress, color }) {
  let IconComponent = FontAwesome;
  if (lib === 'Feather') IconComponent = Feather;
  if (lib === 'Ionicons') IconComponent = Ionicons;

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
  const navigation = useNavigation();
  const route = useRoute();

  // Screens that should NOT have back buttons
  const excludedFromBackButton = ['Home', 'TrackOrder', 'OrderHistory', 'Messaging'];

  const showBackButton = navigation.canGoBack() && !excludedFromBackButton.includes(route.name);

  return (
    <View style={styles.headerContainer}>
      {showBackButton && (
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
      )}
      <View style={styles.logoContainer}>
        <Image
          source={require('./assets/nvago-icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <TouchableOpacity style={styles.menuButton} onPress={onMenu}>
        <FontAwesome name="bars" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function ScreenWithHeaderSidebar({ children }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const route = useRoute();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [first, last] = await Promise.all([
          AsyncStorage.getItem('firstName'),
          AsyncStorage.getItem('lastName')
        ]);
        if (first || last) {
          setFullName(`${first || ''} ${last || ''}`.trim());
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  // List of screens that should NOT have header/sidebar
  const excludedScreens = [
    'Login',
    'SignUp',
    'Verification',
    'ForgotPassword',
    'ResetPassword',
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

// Main Tab Navigator (for authenticated users)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#252b55',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Hide default headers since we have custom ones
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Orders" component={OrderHistory} />
      <Tab.Screen name="Messages" component={Messaging} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

// Wrapper component for screens that need header/sidebar
function MainTabsWithHeader() {
  return (
    <ScreenWithHeaderSidebar>
      <MainTabs />
    </ScreenWithHeaderSidebar>
  );
}

// Deep linking configuration
const linking = {
  prefixes: ['nvamobile://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      Verification: 'verification',
    },
  },
};

export default function App() {
  useEffect(() => {
    // Request notification permissions
    Notifications.requestPermissionsAsync();

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <NavigationContainer linking={linking}>
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false, // Hide all default headers
          }}
        >
          {/* Splash Screen */}
          <Stack.Screen 
            name="Splash" 
            component={SplashScreen}
          />
          
          {/* Auth Screens */}
          <Stack.Screen 
            name="Login" 
            component={Login}
          />
          <Stack.Screen 
            name="SignUp" 
            component={SignUp}
          />
          <Stack.Screen 
            name="ForgotPassword" 
            component={ForgotPassword}
          />
          <Stack.Screen 
            name="ResetPassword" 
            component={ResetPassword}
          />
          <Stack.Screen 
            name="Verification" 
            component={Verification}
          />
          
          {/* Main App with custom header */}
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabsWithHeader}
          />
          
          {/* Other Screens with custom header */}
          <Stack.Screen name="Home" component={() => (
            <ScreenWithHeaderSidebar>
              <Home />
            </ScreenWithHeaderSidebar>
          )} />
          <Stack.Screen name="OrderForm" component={() => (
            <ScreenWithHeaderSidebar>
              <OrderForm />
            </ScreenWithHeaderSidebar>
          )} />
          <Stack.Screen name="Payment" component={() => (
            <ScreenWithHeaderSidebar>
              <Payment />
            </ScreenWithHeaderSidebar>
          )} />
          <Stack.Screen name="TrackOrder" component={() => (
            <ScreenWithHeaderSidebar>
              <TrackOrder />
            </ScreenWithHeaderSidebar>
          )} />
          <Stack.Screen name="OrderHistory" component={() => (
            <ScreenWithHeaderSidebar>
              <OrderHistory />
            </ScreenWithHeaderSidebar>
          )} />
          <Stack.Screen name="Messaging" component={() => (
            <ScreenWithHeaderSidebar>
              <Messaging />
            </ScreenWithHeaderSidebar>
          )} />
          <Stack.Screen name="Profile" component={() => (
            <ScreenWithHeaderSidebar>
              <Profile />
            </ScreenWithHeaderSidebar>
          )} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
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
    justifyContent: 'space-between',
    backgroundColor: '#232B55',
    paddingTop: 36,
    paddingBottom: 12,
    paddingHorizontal: 18,
  },
  backButton: {
    padding: 4,
  },
  menuButton: {
    padding: 4,
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
    backgroundColor: '#666',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
    flex: 1,
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
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});