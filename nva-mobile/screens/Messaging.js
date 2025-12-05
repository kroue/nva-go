import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
  Dimensions,
  Alert,
  Animated,
  AppState
} from 'react-native';
import { supabase } from '../SupabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dfejxqixw/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'proofs';

export default function Messaging() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLookup, setUserLookup] = useState({});
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollViewRef = useRef();
  const [fadeAnim] = useState(new Animated.Value(0));
  const appState = useRef(AppState.currentState);
  const pollingRef = useRef(null);
  const [realtimeHealthy, setRealtimeHealthy] = useState(false);
  
  // Approval confirmation modal state
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvalOrderId, setApprovalOrderId] = useState(null);
  const [approvalEmployeeEmail, setApprovalEmployeeEmail] = useState(null);
  const [approvalLayoutImage, setApprovalLayoutImage] = useState(null);
  
  // Track which orders have been acted upon (approved/cancelled)
  const [actedOrderIds, setActedOrderIds] = useState(new Set());
  
  // Dispute conversation state
  const [isDisputeMode, setIsDisputeMode] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState(null);
  const [hasOngoingDispute, setHasOngoingDispute] = useState(false);
  
  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (imageUri) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      });
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      if (response.ok) {
        return data.secure_url;
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  // Pick and send image
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant photo library access to send images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        try {
          const imageUrl = await uploadImageToCloudinary(result.assets[0].uri);
          await sendImageMessage(imageUrl);
        } catch (error) {
          Alert.alert('Upload failed', 'Failed to upload image: ' + error.message);
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
      setUploading(false);
    }
  };

  // Determine conversation partner (employee/customer) from current messages
  const getConversationPartner = () => {
    // If in dispute mode, always return admin email
    if (isDisputeMode) {
      return 'admin@nvago.com';
    }
    
    // Prefer the most recent message participant that is not the current user.
    if (messages && messages.length > 0) {
      // messages are ordered ascending by created_at in fetchMessages
      const last = messages[messages.length - 1];
      if (last) {
        if (last.sender && last.sender !== userEmail) return last.sender;
        if (last.receiver && last.receiver !== userEmail) return last.receiver;
      }
    }
    // Fallback to allowedEmails[0] (existing behavior)
    return allowedEmails[0] || null;
  };

  // Helper: get authenticated user's email from Supabase session
  const getAuthEmail = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.user?.email || null;
    } catch (err) {
      console.error('Error getting auth session:', err);
      return null;
    }
  };

  // Send image message
  const sendImageMessage = async (imageUrl) => {
    if (!userEmail) return;
    
    const partner = getConversationPartner();
    if (!partner) return;
    const receiver = partner;

    const authEmail = await getAuthEmail();
    if (!authEmail) {
      Alert.alert('Authentication required', 'You must be signed in to send messages.');
      return;
    }

    // do NOT set created_at client-side; let DB provide authoritative timestamp
    const payload = {
      chat_id: [authEmail, receiver].sort().join('-'),
      sender: authEmail,
      receiver,
      text: `[IMAGE]${imageUrl}`,
      read: false
    };
    
    const { data, error } = await supabase.from('messages').insert(payload).select().single();
    if (error) {
      console.error('Error sending image:', error);
      if (error.code === '42501') {
        Alert.alert('Permission denied', 'Insert blocked by DB row-level security.');
      } else {
        Alert.alert('Error', 'Failed to send image');
      }
      return;
    }

    // append DB row and scroll
    appendIncomingMessage(data);
  };

  // helper: scroll to bottom (small delay to allow layout)
  const scrollToBottom = (delay = 120) => {
    setTimeout(() => {
      try { scrollViewRef.current?.scrollToEnd({ animated: true }); } catch(e){/* ignore */ }
    }, delay);
  };

  // helper: stable sort ascending by created_at
  const sortAsc = (arr) => {
    return (arr || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  };

  // fetchMessages supports a silent option so polling/app-state refreshes don't show loader
  const fetchMessages = async (opts = {}) => {
    const { silent = false } = opts;
    if (!userEmail) {
      if (!silent) setLoading(false);
      return;
    }
    
    if (!silent) setLoading(true);
    
    try {
      const { data: userMessages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender.eq.${userEmail},receiver.eq.${userEmail}`)
        .order('created_at', { ascending: true });
    
      if (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } else {
        // Check for ongoing disputes (messages with admin@nvago.com)
        const disputeMessages = (userMessages || []).filter(msg => 
          msg.sender === 'admin@nvago.com' || msg.receiver === 'admin@nvago.com'
        );
        
        // Check if the dispute has been resolved
        const hasResolutionMessage = disputeMessages.some(msg => 
          msg.text && msg.text.includes('✅ DISPUTE RESOLVED:')
        );
        
        // Check if there are any recent dispute messages (within last 24 hours)
        // but exclude if there's a resolution message
        let recentDisputes = [];
        if (!hasResolutionMessage) {
          recentDisputes = disputeMessages.filter(msg => {
            const msgDate = new Date(msg.created_at);
            const now = new Date();
            const hoursDiff = (now - msgDate) / (1000 * 60 * 60);
            return hoursDiff < 24;
          });
        }
        
        setHasOngoingDispute(recentDisputes.length > 0);
        
        // Filter messages based on dispute mode
        let filteredMessages = userMessages || [];
        if (isDisputeMode) {
          // Show only messages with admin@nvago.com
          filteredMessages = filteredMessages.filter(msg => 
            msg.sender === 'admin@nvago.com' || msg.receiver === 'admin@nvago.com'
          );
        } else {
          // Show messages excluding admin@nvago.com (regular conversations)
          filteredMessages = filteredMessages.filter(msg => 
            msg.sender !== 'admin@nvago.com' && msg.receiver !== 'admin@nvago.com'
          );
        }
        
        // ensure ascending order
        setMessages(sortAsc(filteredMessages));
        if (!silent) {
          // Animate in only when not silent (initial load)
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }
        // always scroll but with a small delay to avoid jumpy UI
        scrollToBottom(100);
      }
    } catch (error) {
      console.error('Exception fetching messages:', error);
      setMessages([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initialize user and fetch data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Prefer authenticated Supabase session email
        let email = null;
        try {
          const { data } = await supabase.auth.getSession();
          email = data?.session?.user?.email || null;
        } catch (err) {
          console.warn('Supabase session check failed', err);
        }

        // Fallback to AsyncStorage if no session email
        if (!email) {
          email = await AsyncStorage.getItem('email');
        }

        if (!email) {
          setLoading(false);
          return;
        }

        // Keep userEmail consistent with the auth session (and store it for fallback)
        setUserEmail(email);
        try { await AsyncStorage.setItem('email', email); } catch(e) {}

        const [employeesResult, customersResult] = await Promise.all([
          supabase.from('employees').select('email,first_name,last_name'),
          supabase.from('customers').select('email,first_name,last_name')
        ]);

        const allUsers = [
          ...(employeesResult.data || []),
          ...(customersResult.data || [])
        ];
        
        const lookup = {};
        allUsers.forEach(u => {
          lookup[u.email] = `${u.first_name} ${u.last_name}`.trim();
        });
        
        // Add admin email to lookup
        lookup['admin@nvago.com'] = 'Mr. Nicholson Anora (Business Owner)';
        
        setUserLookup(lookup);

        const isEmployee = employeesResult.data?.some(emp => emp.email === email);
        let allowedEmailsList = [];
        
        if (isEmployee) {
          allowedEmailsList = (customersResult.data || []).map(c => c.email);
        } else {
          allowedEmailsList = (employeesResult.data || []).map(e => e.email);
        }
        
        setAllowedEmails(allowedEmailsList);
        
      } catch (error) {
        console.error('Error in initialization:', error);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Fetch messages when userEmail is set or dispute mode changes
  useEffect(() => {
    if (userEmail) {
      fetchMessages();
    }
  }, [userEmail, isDisputeMode]);

  // helper: safely append incoming message if it's relevant and not already present
  const appendIncomingMessage = (incoming) => {
    if (!incoming) return;
    setMessages(prev => {
      const exists = incoming.id ? prev.some(m => m.id === incoming.id) :
        prev.some(m => m.text === incoming.text && m.created_at === incoming.created_at && m.sender === incoming.sender);
      if (exists) return prev;
      const next = sortAsc([...prev, incoming]);
      return next;
    });
    scrollToBottom(120);
  };

  // Subscription for realtime updates (listen globally, filter client-side, append)
  useEffect(() => {
    if (!userEmail) return;

    const channel = supabase.channel(`messages-${userEmail}`);
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      async payload => {
        try {
          console.log('Realtime payload:', payload);
          const newMsg = payload?.new;
          if (!newMsg) return;

          if (newMsg.receiver === userEmail || newMsg.sender === userEmail) {
            appendIncomingMessage(newMsg);

            Notifications.scheduleNotificationAsync({
              content: {
                title: 'New Message',
                body: `You have a new message from ${userLookup[newMsg.sender] || newMsg.sender}`,
              },
              trigger: null,
            });
          }
        } catch (err) {
          console.error('Error handling realtime payload:', err);
        }
      }
    );

    // subscribe and update health flag for polling control
    channel.subscribe((status) => {
      console.log('Realtime channel subscribe status:', status);
      // mark healthy when subscribed, otherwise unhealthy
      setRealtimeHealthy(status === 'SUBSCRIBED');
    });

    // AppState: refetch when app comes to foreground
    const onAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground — refreshing messages');
        // silent refresh to avoid showing loader
        fetchMessages({ silent: true }).catch(e => console.debug('AppState fetchMessages error', e));
      }
      appState.current = nextAppState;
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      // cleanup realtime channel and polling and AppState listener
      try { supabase.removeChannel(channel); } catch (e) { console.warn('removeChannel error', e); }
      subscription.remove();
    };
  }, [userEmail, userLookup]);

  // Polling effect: only poll when realtime is not healthy
  useEffect(() => {
    if (!userEmail) return;
 
    if (!realtimeHealthy) {
      // start polling if not already started
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          // silent polling so UI doesn't flash the loader
          fetchMessages({ silent: true }).catch(e => console.debug('Polling fetchMessages error', e));
        }, 5000);
        console.log('Started polling fallback (realtime unhealthy)');
      }
    } else {
      // stop polling when realtime becomes healthy
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        console.log('Stopped polling fallback (realtime healthy)');
      }
    }
 
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [userEmail, realtimeHealthy]);

  // Send text message
  const sendMessage = async () => {
    if (!input.trim() || !userEmail) return;
    
    const partner = getConversationPartner();
    if (!partner) return;
    const receiver = partner;

    const authEmail = await getAuthEmail();
    if (!authEmail) {
      Alert.alert('Authentication required', 'You must be signed in to send messages.');
      return;
    }

    const payload = {
      chat_id: [authEmail, receiver].sort().join('-'),
      sender: authEmail,
      receiver,
      text: input.trim(),
      read: false
    };
    
    setInput('');
    
    const { data, error } = await supabase.from('messages').insert(payload).select().single();
    if (error) {
      console.error('Error sending message:', error);
      if (error.code === '42501') {
        Alert.alert('Permission denied', 'Insert blocked by DB row-level security.');
      } else {
        Alert.alert('Error', 'Failed to send message: ' + error.message);
      }
      return;
    }

    // append DB row and scroll
    appendIncomingMessage(data);
  };

  // Extract Order ID
  const extractOrderId = (text) => {
    try {
      const uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

      if (text.startsWith('[APPROVAL_REQUEST]')) {
        const after = text.replace('[APPROVAL_REQUEST]|', '');
        const firstToken = after.split(/\s|\n/)[0]?.trim();
        if (uuidRe.test(firstToken)) return firstToken;
      }

      const lineMatch = text.split('\n').find(l => l.startsWith('Order ID: '));
      if (lineMatch) {
        const m = lineMatch.match(uuidRe);
        if (m) return m[0];
      }

      const any = text.match(uuidRe);
      if (any && any[0]) return any[0];
    } catch {}
    return null;
  };

  const handleApprove = async (orderId, employeeSenderEmail) => {
    // Extract the layout image from the SPECIFIC approval request message for this order
    // Search through messages in reverse order to get the most recent one
    let approvalMessage = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.text && msg.text.startsWith('[APPROVAL_REQUEST]')) {
        const msgOrderId = extractOrderId(msg.text);
        if (msgOrderId === orderId) {
          approvalMessage = msg;
          break;
        }
      } 
    }
    
    const layoutImage = approvalMessage ? extractImageUrl(approvalMessage.text) : null;
    
    console.log('Approval Details:', {
      orderId,
      foundMessage: !!approvalMessage,
      layoutImage,
      messageText: approvalMessage?.text?.substring(0, 100)
    });
    
    // Show confirmation modal with the layout image
    setApprovalOrderId(orderId);
    setApprovalEmployeeEmail(employeeSenderEmail);
    setApprovalLayoutImage(layoutImage);
    setApprovalModalVisible(true);
  };

  const confirmApproval = async () => {
    const orderId = approvalOrderId;
    const employeeSenderEmail = approvalEmployeeEmail;
    const layoutImage = approvalLayoutImage;
    
    // Close the modal
    setApprovalModalVisible(false);
    
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'Printing',
          approved: 'yes'
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      const receiver = employeeSenderEmail || (allowedEmails[0] || null);
      if (receiver) {
        // ensure sender is authenticated user for RLS
        const authEmail = await getAuthEmail();
        if (!authEmail) {
          Alert.alert('Authentication required', 'You must be signed in to send messages.');
          return;
        }

        // First, send the layout image back to the employee
        if (layoutImage) {
          const imageMessage = {
            chat_id: [authEmail, receiver].sort().join('-'),
            sender: authEmail,
            receiver,
            text: `[IMAGE]${layoutImage}`,
            read: false,
          };
          const { error: imageMessageError } = await supabase
            .from('messages')
            .insert(imageMessage);
          if (imageMessageError) {
            console.error('Error sending layout image:', imageMessageError);
          }
        }

        // Then send the approval confirmation message
        const confirmMessage = {
          chat_id: [authEmail, receiver].sort().join('-'),
          sender: authEmail,
          receiver,
          text: `✅ Order #${orderId.slice(0, 8)} approved by customer. Status set to Printing.`,
          read: false,
        };
        const { error: messageError } = await supabase
          .from('messages')
          .insert(confirmMessage);
        if (messageError) {
          console.error('Error inserting confirm message:', messageError);
          if (messageError.code === '42501') {
            Alert.alert(
              'Permission denied',
              'Insert blocked by database row-level security. Ensure the authenticated user matches the messages RLS policy.'
            );
          } else {
            throw messageError;
          }
        } else {
          // Refresh messages to show the new ones
          fetchMessages({ silent: true });
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }

      // Mark this order as acted upon
      setActedOrderIds(prev => new Set([...prev, orderId]));
      
      Alert.alert('Success', 'Order approved and moved to printing!');
    } catch (error) {
      console.error('Error approving order:', error);
      Alert.alert('Error', 'Failed to approve order: ' + error.message);
    }
  };

  const handleCancelOrder = async (orderId, employeeSenderEmail) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel your order?\n\nAny order and payment disputes will be handled by Mr. Nicholson Anora (Business Owner).',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Contact Owner', 
          style: 'default',
          onPress: async () => {
            try {
              const { error: updateError } = await supabase
                .from('orders')
                .update({ status: 'Cancelled', approved: 'no' })
                .eq('id', orderId);

              if (updateError) throw updateError;

              const receiver = employeeSenderEmail || (allowedEmails[0] || null);
              if (receiver) {
                // ensure sender is authenticated user for RLS
                const authEmail = await getAuthEmail();
                if (!authEmail) {
                  Alert.alert('Authentication required', 'You must be signed in to send messages.');
                  return;
                }

                const confirmMessage = {
                  chat_id: [authEmail, receiver].sort().join('-'),
                  sender: authEmail,
                  receiver,
                  text: `❌ Order #${orderId.slice(0, 8)} cancelled by customer.`,
                  read: false,
                  created_at: new Date().toISOString(),
                };
                const { error: messageError } = await supabase
                  .from('messages')
                  .insert(confirmMessage);
                if (messageError) {
                  console.error('Error inserting cancel message:', messageError);
                }
              }

              // Mark this order as acted upon
              setActedOrderIds(prev => new Set([...prev, orderId]));
              
              // Switch to dispute mode and set the order ID
              setDisputeOrderId(orderId);
              setIsDisputeMode(true);
              setHasOngoingDispute(true);
              
              // Prepare initial dispute message
              const authEmail = await getAuthEmail();
              if (authEmail) {
                const disputeMessage = {
                  chat_id: [authEmail, 'admin@nvago.com'].sort().join('-'),
                  sender: authEmail,
                  receiver: 'admin@nvago.com',
                  text: `🚨 DISPUTE: Order #${orderId.slice(0, 8)} has been cancelled. Customer requesting assistance from business owner.`,
                  read: false,
                };
                await supabase.from('messages').insert(disputeMessage);
              }
              
              // Fetch messages to show the dispute conversation
              await fetchMessages({ silent: false });
              
            } catch (error) {
              console.error('Error cancelling order:', error);
              Alert.alert('Error', 'Failed to cancel order: ' + error.message);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  // Extract image URL
  const extractImageUrl = (text) => {
    if (text.startsWith('[IMAGE]')) {
      return text.substring(7);
    }
    
    if (text.startsWith('[APPROVAL_REQUEST]')) {
      const parts = text.split('\n');
      const imageLine = parts.find(line => line.startsWith('Image: '));
      if (imageLine) {
        return imageLine.replace('Image: ', '').trim();
      }
    }
    
    if (text.startsWith('[PICKUP_READY]')) {
      const parts = text.split('\n');
      const imageLine = parts.find(line => line.startsWith('Image: '));
      if (imageLine) {
        return imageLine.replace('Image: ', '').trim();
      }
    }
    
    const cloudinaryRegex = /https:\/\/res\.cloudinary\.com\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi;
    const match = text.match(cloudinaryRegex);
    if (match && match[0]) {
      return match[0];
    }
    
    const imageUrlRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi;
    const imageMatch = text.match(imageUrlRegex);
    if (imageMatch && imageMatch[0]) {
      return imageMatch[0];
    }
    
    return null;
  };

  const handleImagePress = (url) => {
    setSelectedImage(url);
    setModalVisible(true);
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  // Render message
  const renderMessage = (msg, idx) => {
    const isMe = msg.sender === userEmail;
    const senderName = isMe ? 'You' : userLookup[msg.sender] || msg.sender;
    const isApproval = msg.text.startsWith('[APPROVAL_REQUEST]');
    const isPickupReady = msg.text.startsWith('[PICKUP_READY]');
    const isImage = msg.text.startsWith('[IMAGE]');
    
    const imageUrl = extractImageUrl(msg.text);
    const orderId = (isApproval || isPickupReady) ? extractOrderId(msg.text) : null;

    let messageText = msg.text;
    if (isApproval) {
      const cleanText = msg.text.replace('[APPROVAL_REQUEST]|', '');
      const lines = cleanText.split('\n');
      messageText = lines.filter(line => 
        !line.startsWith('Image: ') && 
        !line.match(/https:\/\/res\.cloudinary\.com\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi) &&
        line.trim() !== ''
      ).join('\n');
    } else if (isPickupReady) {
      const cleanText = msg.text.replace('[PICKUP_READY]|', '');
      const lines = cleanText.split('\n');
      messageText = lines.filter(line => 
        !line.startsWith('Image: ') && 
        !line.match(/https:\/\/res\.cloudinary\.com\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi) &&
        line.trim() !== ''
      ).join('\n');
    } else if (isImage) {
      messageText = '';
    } else if (imageUrl) {
      messageText = msg.text.replace(imageUrl, '').trim();
    }

    return (
      <View key={msg.id || idx} style={[styles.messageRow, isMe && styles.messageRowMe]}>
        <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {/* Sender name for other's messages */}
          {!isMe && (
            <Text style={styles.senderLabel}>{senderName}</Text>
          )}
          
          {/* Message Text */}
          {messageText && messageText !== imageUrl && (
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
              {messageText}
            </Text>
          )}
          
          {/* Image Display */}
          {imageUrl && (
            <TouchableOpacity 
              onPress={() => handleImagePress(imageUrl)}
              style={styles.imageMessageContainer}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.messageImage}
                resizeMode="contain"
              />
              <View style={styles.imageOverlay}>
                <FontAwesome name="search-plus" size={16} color="#fff" />
                <Text style={styles.imageOverlayText}>Tap to view</Text>
              </View>
            </TouchableOpacity>
          )}
          
          {/* Approval Buttons */}
          {isApproval && !isMe && orderId && (
            actedOrderIds.has(orderId) ? (
              <View style={styles.actedNoticeContainer}>
                <FontAwesome name="info-circle" size={14} color="#6B7280" />
                <Text style={styles.actedNoticeText}>You have already responded to this request</Text>
              </View>
            ) : (
              <View style={styles.approvalButtonsContainer}>
                <TouchableOpacity 
                  style={styles.approveButton}
                  onPress={() => handleApprove(orderId, msg.sender)}
                  activeOpacity={0.8}
                >
                  <FontAwesome name="check-circle" size={16} color="#fff" />
                  <Text style={styles.approveButtonText}>Approve Order</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelOrderButton}
                  onPress={() => handleCancelOrder(orderId, msg.sender)}
                  activeOpacity={0.8}
                >
                  <FontAwesome name="times-circle" size={16} color="#fff" />
                  <Text style={styles.cancelOrderButtonText}>Cancel Order</Text>
                </TouchableOpacity>
              </View>
            )
          )}
          
          {/* Timestamp */}
          <Text style={[styles.timestamp, isMe && styles.timestampMe]}>
            {formatTime(msg.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 0}
    >
      {/* Header */}
      <LinearGradient
        colors={['#232B55', '#4A5698']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <FontAwesome name="comments" size={22} color="#fff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {isDisputeMode ? 'Dispute with Owner' : 'Messages'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isDisputeMode 
                ? 'Mr. Nicholson Anora (Business Owner)'
                : `${messages.length} ${messages.length === 1 ? 'message' : 'messages'}`
              }
            </Text>
          </View>
          {isDisputeMode && (
            <TouchableOpacity
              style={styles.backToNormalButton}
              onPress={() => setIsDisputeMode(false)}
              activeOpacity={0.8}
            >
              <FontAwesome name="arrow-left" size={16} color="#fff" />
              <Text style={styles.backToNormalText}>Back</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Ongoing Dispute Banner */}
        {!isDisputeMode && hasOngoingDispute && (
          <TouchableOpacity
            style={styles.disputeBanner}
            onPress={() => setIsDisputeMode(true)}
            activeOpacity={0.8}
          >
            <FontAwesome name="exclamation-triangle" size={16} color="#FFA500" />
            <Text style={styles.disputeBannerText}>ONGOING DISPUTE</Text>
            <FontAwesome name="chevron-right" size={14} color="#FFA500" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#232B55" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <FontAwesome name="comment-o" size={48} color="#9CA3AF" />
                </View>
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptyText}>
                  Start a conversation by sending a message
                </Text>
              </View>
            ) : (
              messages.map((msg, idx) => renderMessage(msg, idx))
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.attachButton} 
          onPress={pickImage}
          disabled={uploading}
          activeOpacity={0.7}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#232B55" />
          ) : (
            <FontAwesome name="camera" size={20} color="#232B55" />
          )}
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity 
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={!input.trim()}
          activeOpacity={0.8}
        >
          <FontAwesome name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setModalVisible(false)}
            activeOpacity={0.9}
          >
            <FontAwesome name="times" size={24} color="#fff" />
          </TouchableOpacity>
          
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
          >
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Approval Confirmation Modal */}
      <Modal
        visible={approvalModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setApprovalModalVisible(false)}
      >
        <View style={styles.approvalModalContainer}>
          <View style={styles.approvalModalContent}>
            <View style={styles.approvalModalHeader}>
              <Text style={styles.approvalModalTitle}>Approve Layout?</Text>
              <TouchableOpacity
                style={styles.approvalModalCloseButton}
                onPress={() => setApprovalModalVisible(false)}
                activeOpacity={0.7}
              >
                <FontAwesome name="times" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.approvalModalText}>
              Are you sure you want to approve this layout?
            </Text>

            {approvalLayoutImage && (
              <View style={styles.approvalImageContainer}>
                <Image
                  source={{ uri: approvalLayoutImage }}
                  style={styles.approvalImage}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.viewFullImageButton}
                  onPress={() => {
                    setSelectedImage(approvalLayoutImage);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <FontAwesome name="search-plus" size={16} color="#232B55" />
                  <Text style={styles.viewFullImageText}>View Full Size</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.approvalModalButtons}>
              <TouchableOpacity
                style={styles.approvalModalCancelButton}
                onPress={() => setApprovalModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.approvalModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approvalModalConfirmButton}
                onPress={confirmApproval}
                activeOpacity={0.8}
              >
                <FontAwesome name="check" size={16} color="#fff" />
                <Text style={styles.approvalModalConfirmText}>Yes, Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  
  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 30,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#232B55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  backToNormalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  backToNormalText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  disputeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  disputeBannerText: {
    color: '#FFA500',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    marginRight: 8,
  },
  
  // Messages
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  messagesContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
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
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  
  // Message Rows
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 4,
    width: '100%',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  
  // Message Bubbles
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleMe: {
    backgroundColor: '#232B55',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#232B55',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#1A1A2E',
  },
  messageTextMe: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    fontWeight: '500',
  },
  timestampMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  
  // Image Messages
  imageMessageContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  messageImage: {
    width: '100%',
    aspectRatio: 1,
    minHeight: 200,
    maxHeight: 300,
    backgroundColor: '#F3F4F6',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Approval Buttons
  approvalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 12,
    marginRight: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  cancelOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 10,
    padding: 12,
    marginLeft: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelOrderButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  
  // Acted Notice
  actedNoticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  actedNoticeText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Input Container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    color: '#1A1A2E',
    backgroundColor: '#F9FAFB',
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#232B55',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#232B55',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  
  // Approval Confirmation Modal
  approvalModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  approvalModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  approvalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  approvalModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#232B55',
  },
  approvalModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalModalText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 22,
  },
  approvalImageContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  approvalImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F3F4F6',
  },
  viewFullImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F2FF',
    padding: 12,
  },
  viewFullImageText: {
    color: '#232B55',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  approvalModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  approvalModalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalModalCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  approvalModalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  approvalModalConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
});