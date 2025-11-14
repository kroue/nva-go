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
  Animated
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

  // Send image message
  const sendImageMessage = async (imageUrl) => {
    if (!userEmail || allowedEmails.length === 0) return;
    
    const receiver = allowedEmails[0];

    const newMessage = {
      chat_id: [userEmail, receiver].sort().join('-'),
      sender: userEmail,
      receiver,
      text: `[IMAGE]${imageUrl}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    
    const { error } = await supabase.from('messages').insert(newMessage);
    if (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Failed to send image');
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
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
        setMessages(userMessages || []);
        
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Animate in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Exception fetching messages:', error);
      setMessages([]);
    }
    
    setLoading(false);
  };

  // Initialize user and fetch data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const email = await AsyncStorage.getItem('email');
        
        if (!email) {
          setLoading(false);
          return;
        }
        
        setUserEmail(email);

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

  // Fetch messages when userEmail is set
  useEffect(() => {
    if (userEmail) {
      fetchMessages();
    }
  }, [userEmail]);

  // Subscription for realtime updates
  useEffect(() => {
    if (!userEmail) return;

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async payload => {
          if (payload.new.receiver === userEmail) {
            await fetchMessages();
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'New Message',
                body: `You have a new message from ${userLookup[payload.new.sender] || payload.new.sender}`,
              },
              trigger: null,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, userLookup]);

  // Send text message
  const sendMessage = async () => {
    if (!input.trim() || !userEmail || allowedEmails.length === 0) return;
    
    const receiver = allowedEmails[0];

    const newMessage = {
      chat_id: [userEmail, receiver].sort().join('-'),
      sender: userEmail,
      receiver,
      text: input.trim(),
      read: false,
      created_at: new Date().toISOString(),
    };
    
    setInput('');
    
    const { error } = await supabase.from('messages').insert(newMessage);
    if (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message: ' + error.message);
    }
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
        const confirmMessage = {
          chat_id: [userEmail, receiver].sort().join('-'),
          sender: userEmail,
          receiver,
          text: `✅ Order #${orderId.slice(0, 8)} approved by customer. Status set to Printing.`,
          read: false,
          created_at: new Date().toISOString(),
        };
        const { error: messageError } = await supabase
          .from('messages')
          .insert(confirmMessage);
        if (messageError) throw messageError;
      }

      Alert.alert('Success', 'Order approved and moved to printing!');
    } catch (error) {
      console.error('Error approving order:', error);
      Alert.alert('Error', 'Failed to approve order: ' + error.message);
    }
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
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <FontAwesome name="search-plus" size={16} color="#fff" />
                <Text style={styles.imageOverlayText}>Tap to view</Text>
              </View>
            </TouchableOpacity>
          )}
          
          {/* Approval Button */}
          {isApproval && !isMe && orderId && (
            <TouchableOpacity 
              style={styles.approveButton}
              onPress={() => handleApprove(orderId, msg.sender)}
              activeOpacity={0.8}
            >
              <FontAwesome name="check-circle" size={16} color="#fff" />
              <Text style={styles.approveButtonText}>Approve Order</Text>
            </TouchableOpacity>
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
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </Text>
          </View>
        </View>
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
  },
  messageImage: {
    width: '100%',
    height: 200,
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
  
  // Approve Button
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
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
});