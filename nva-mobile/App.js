import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Text, TouchableOpacity, Dimensions, Image } from 'react-native';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';

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
import ForgotPassword from './screens/ForgetPassword';
import ResetPassword from './screens/ResetPassword';
import Verification from './screens/Verification';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(width * 0.8, 320);
const navigationRef = React.createRef();

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
  const route = useRoute();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [first, last, userEmail] = await Promise.all([
          AsyncStorage.getItem('firstName'),
          AsyncStorage.getItem('lastName'),
          AsyncStorage.getItem('email')
        ]);
        if (first || last) {
          setFullName(`${first || ''} ${last || ''}`.trim());
        } else {
          setFullName('Guest User');
        }
        setEmail(userEmail || 'guest@example.com');
      } catch (error) {
        console.error('Error loading user data:', error);
        setFullName('Guest User');
        setEmail('guest@example.com');
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

  const handleNavigation = (screen) => {
    onClose();
    if (route.name === screen) {
      // If already on the same screen, just close the sidebar
      return;
    }
    navigation.navigate(screen);
  };

  return (
    <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={['#232B55', '#4A5698']}
        style={styles.sidebarHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{fullName}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
            <TouchableOpacity
              onPress={() => handleNavigation('Profile')}
              style={styles.viewProfileButton}
            >
              <Text style={styles.viewProfileText}>View Profile</Text>
              <FontAwesome name="chevron-right" size={12} color="#fff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Menu Items */}
      <View style={styles.sidebarMenu}>
        <Text style={styles.menuSection}>MAIN MENU</Text>

        <SidebarItem
          icon="home"
          lib="FontAwesome"
          label="Home"
          onPress={() => handleNavigation('Home')}
        />
        <SidebarItem
          icon="file-text"
          lib="Feather"
          label="Track Order"
          onPress={() => handleNavigation('TrackOrder')}
        />
        <SidebarItem
          icon="history"
          lib="FontAwesome"
          label="Order History"
          onPress={() => handleNavigation('OrderHistory')}
        />
        <SidebarItem
          icon="message-circle"
          lib="Feather"
          label="Messages"
          onPress={() => handleNavigation('Messaging')}
        />

        <View style={styles.divider} />

        <Text style={styles.menuSection}>ACCOUNT</Text>

        <SidebarItem
          icon="user"
          lib="FontAwesome"
          label="Profile"
          onPress={() => handleNavigation('Profile')}
        />
      </View>

      {/* Logout Button */}
      <View style={styles.sidebarFooter}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <FontAwesome name="sign-out" size={18} color="#D32F2F" style={{ marginRight: 12 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function SidebarItem({ icon, lib, label, onPress }) {
  let IconComponent = FontAwesome;
  if (lib === 'Feather') IconComponent = Feather;
  if (lib === 'Ionicons') IconComponent = Ionicons;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.sidebarItem}>
        <View style={styles.iconContainer}>
          <IconComponent name={icon} size={20} color="#232B55" />
        </View>
        <Text style={styles.sidebarItemText}>{label}</Text>
        <FontAwesome name="chevron-right" size={14} color="#ccc" />
      </View>
    </TouchableOpacity>
  );
}

function CustomHeader({ onMenu }) {
  const navigation = useNavigation();
  const route = useRoute();

  const excludedFromBackButton = ['Home', 'TrackOrder', 'OrderHistory', 'Messaging'];
  const showBackButton = navigation.canGoBack() && !excludedFromBackButton.includes(route.name);

  return (
    <LinearGradient
      colors={['#232B55', '#4A5698']}
      style={styles.headerContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <Image
        source={require('./assets/nvago-icon.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />

      <TouchableOpacity style={styles.menuButton} onPress={onMenu}>
        <View style={styles.headerIconButton}>
          <FontAwesome name="bars" size={20} color="#fff" />
        </View>
      </TouchableOpacity>
    </LinearGradient>
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
      <CustomHeader onMenu={() => setSidebarVisible(!sidebarVisible)} />
      <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: 106 }}>
        {children}
      </View>
      {sidebarVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setSidebarVisible(false)}
        />
      )}
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

// Individual screen wrappers
function HomeWithHeader() {
  return (
    <ScreenWithHeaderSidebar>
      <Home />
    </ScreenWithHeaderSidebar>
  );
}

function OrderFormWithHeader() {
  return (
    <ScreenWithHeaderSidebar>
      <OrderForm />
    </ScreenWithHeaderSidebar>
  );
}

function PaymentWithHeader() {
  return (
    <ScreenWithHeaderSidebar>
      <Payment />
    </ScreenWithHeaderSidebar>
  );
}

function TrackOrderWithHeader() {
  return (
    <ScreenWithHeaderSidebar>
      <TrackOrder />
    </ScreenWithHeaderSidebar>
  );
}

function OrderHistoryWithHeader() {
  return (
    <ScreenWithHeaderSidebar>
      <OrderHistory />
    </ScreenWithHeaderSidebar>
  );
}

function MessagingWithHeader() {
  return (
    <ScreenWithHeaderSidebar>
      <Messaging />
    </ScreenWithHeaderSidebar>
  );
}

function ProfileWithHeader() {
  return (
    <ScreenWithHeaderSidebar>
      <Profile />
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

    // Handle notification tap
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      // Navigate to Messaging screen when notification is tapped
      if (navigationRef.current?.isReady()) {
        navigationRef.current.navigate('Messaging');
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <NavigationContainer ref={navigationRef} linking={linking}>
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
            name="ForgetPassword" 
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
          <Stack.Screen name="Home" component={HomeWithHeader} />
          <Stack.Screen name="OrderForm" component={OrderFormWithHeader} />
          <Stack.Screen name="Payment" component={PaymentWithHeader} />
          <Stack.Screen name="TrackOrder" component={TrackOrderWithHeader} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryWithHeader} />
          <Stack.Screen name="Messaging" component={MessagingWithHeader} />
          <Stack.Screen name="Profile" component={ProfileWithHeader} />
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
  // Header Styles
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 40,
  },
  backButton: {
    width: 40,
  },
  menuButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 40,
  },
  // Sidebar Styles
  overlay: {
    position: 'absolute',
    top: 106,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 25,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#fff',
    zIndex: 50,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 4, height: 0 },
  },
  sidebarHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicContainer: {
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profilePic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  profileEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginBottom: 8,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewProfileText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sidebarMenu: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  menuSection: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sidebarItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 24,
  },
  sidebarFooter: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});