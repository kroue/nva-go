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
  Alert
} from 'react-native';
import { supabase } from '../SupabaseCient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dfejxqixw/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'proofs';

export default function Messaging() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLookup, setUserLookup] = useState({});
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const scrollViewRef = useRef();

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
        allowsEditing: true,
        aspect: [4, 3],
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
    
    console.log('Sending image message:', newMessage);
    
    const { error } = await supabase.from('messages').insert(newMessage);
    if (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Failed to send image');
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!userEmail) {
      console.log('❌ No user email, cannot fetch messages');
      setLoading(false);
      return;
    }
    
    console.log('🔍 Fetching messages for user:', userEmail);
    setLoading(true);
    
    try {
      const { data: userMessages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender.eq.${userEmail},receiver.eq.${userEmail}`)
        .order('created_at', { ascending: true });
    
    console.log('📨 Messages for current user:', {
      error: error,
      messageCount: userMessages?.length || 0,
      userEmail: userEmail
    });
    
    if (error) {
      console.error('❌ Error fetching messages:', error);
      setDebugInfo(`Error: ${error.message}`);
      setMessages([]);
    } else {
      console.log('✅ Messages fetched successfully:', userMessages?.length || 0);
      setMessages(userMessages || []);
      setDebugInfo(`User: ${userEmail}\nUser messages: ${userMessages?.length || 0}`);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  } catch (error) {
    console.error('💥 Exception fetching messages:', error);
    setDebugInfo(`Exception: ${error.message}`);
    setMessages([]);
  }
  
  setLoading(false);
};

  // Initialize user and fetch data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const email = await AsyncStorage.getItem('email');
        console.log('👤 Current user email from storage:', email);
        
        if (!email) {
          console.log('❌ No email found in storage');
          setDebugInfo('No user email found in storage');
          setLoading(false);
          return;
        }
        
        setUserEmail(email);

        console.log('👥 Fetching users for lookup...');
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
        console.error('💥 Error in initialization:', error);
        setDebugInfo(`Init error: ${error.message}`);
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
          if (payload.new.sender === userEmail || payload.new.receiver === userEmail) {
            await fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail]);

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
      console.error('❌ Error sending message:', error);
      Alert.alert('Error', 'Failed to send message: ' + error.message);
    }
  };

  const handleApprove = async (orderId) => {
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'Printing',
          approved: 'yes'
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      const confirmMessage = {
        chat_id: [userEmail, allowedEmails[0]].sort().join('-'),
        sender: userEmail,
        receiver: allowedEmails[0],
        text: `✅ Order #${orderId.slice(0, 7)} has been approved. Status updated to Printing.`,
        read: false,
        created_at: new Date().toISOString(),
      };
      
      const { error: messageError } = await supabase
        .from('messages')
        .insert(confirmMessage);

      if (messageError) throw messageError;

      Alert.alert('Success', 'Order approved and moved to printing!');
      
    } catch (error) {
      console.error('Error approving order:', error);
      Alert.alert('Error', 'Failed to approve order: ' + error.message);
    }
  };

  // ENHANCED: Extract image URL from different message types and text containing URLs
  const extractImageUrl = (text) => {
    // Check for [IMAGE] prefix
    if (text.startsWith('[IMAGE]')) {
      return text.substring(7); // Remove '[IMAGE]' prefix
    }
    
    // Check for approval request images
    if (text.startsWith('[APPROVAL_REQUEST]')) {
      const parts = text.split('\n');
      const imageLine = parts.find(line => line.startsWith('Image: '));
      if (imageLine) {
        return imageLine.replace('Image: ', '').trim();
      }
    }
    
    // Check for pickup ready images  
    if (text.startsWith('[PICKUP_READY]')) {
      const parts = text.split('\n');
      const imageLine = parts.find(line => line.startsWith('Image: '));
      if (imageLine) {
        return imageLine.replace('Image: ', '').trim();
      }
    }
    
    // NEW: Check for Cloudinary URLs in the message text
    const cloudinaryRegex = /https:\/\/res\.cloudinary\.com\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi;
    const match = text.match(cloudinaryRegex);
    if (match && match[0]) {
      return match[0];
    }
    
    // NEW: Check for any image URL in the message
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

  // ENHANCED: Render message with improved image handling
  const renderMessage = (msg, idx) => {
    const isMe = msg.sender === userEmail;
    const senderName = isMe ? 'You' : userLookup[msg.sender] || msg.sender;
    const isApproval = msg.text.startsWith('[APPROVAL_REQUEST]');
    const isPickupReady = msg.text.startsWith('[PICKUP_READY]');
    const isImage = msg.text.startsWith('[IMAGE]');
    
    // Extract image URL from different message types
    const imageUrl = extractImageUrl(msg.text);
    
    // Get order ID if it's an approval or pickup message
    let orderId = null;
    if (isApproval || isPickupReady) {
      const lines = msg.text.split('\n');
      const orderLine = lines.find(line => line.startsWith('Order ID: ') || line.includes('243e9bb7-e686-456f-94ad-3927aed8c17'));
      if (orderLine) {
        // Extract order ID from different formats
        if (orderLine.startsWith('Order ID: ')) {
          orderId = orderLine.replace('Order ID: ', '').trim();
        } else {
          // Extract the UUID from the line
          const uuidMatch = orderLine.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
          if (uuidMatch) {
            orderId = uuidMatch[0];
          }
        }
      }
    }

    // Process message text - Remove image URLs from display text
    let messageText = msg.text;
    if (isApproval) {
      // Remove the [APPROVAL_REQUEST] prefix and format the message
      const cleanText = msg.text.replace('[APPROVAL_REQUEST]|', '');
      const lines = cleanText.split('\n');
      messageText = lines.filter(line => 
        !line.startsWith('Image: ') && 
        !line.match(/https:\/\/res\.cloudinary\.com\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi) &&
        line.trim() !== ''
      ).join('\n');
    } else if (isPickupReady) {
      // Remove the [PICKUP_READY] prefix and format the message
      const cleanText = msg.text.replace('[PICKUP_READY]|', '');
      const lines = cleanText.split('\n');
      messageText = lines.filter(line => 
        !line.startsWith('Image: ') && 
        !line.match(/https:\/\/res\.cloudinary\.com\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi) &&
        line.trim() !== ''
      ).join('\n');
    } else if (isImage) {
      messageText = ''; // Don't show text for pure image messages
    } else if (imageUrl) {
      // Remove the image URL from regular messages
      messageText = msg.text.replace(imageUrl, '').trim();
    }

    return (
      <View key={msg.id || idx} style={[styles.row, isMe ? { justifyContent: 'flex-end' } : {}]}>
        {!isMe && <View style={styles.avatar} />}
        <View style={[isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {/* Timestamp */}
          <Text style={styles.timestamp}>
            {new Date(msg.created_at).toLocaleString()}
          </Text>
          
          {/* Message Text - Only show if there's text after removing image URL */}
          {messageText && messageText !== imageUrl ? (
            <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
              {messageText}
            </Text>
          ) : null}
          
          {/* Image Display - Works for all image types */}
          {imageUrl && (
            <TouchableOpacity 
              onPress={() => handleImagePress(imageUrl)}
              style={styles.imageContainer}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.previewImage}
                resizeMode="cover"
                onError={(error) => {
                  console.log('Image load error:', error);
                }}
              />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageOverlayText}>📷 Tap to expand</Text>
              </View>
            </TouchableOpacity>
          )}
          
          {/* Approval Button - Only for approval requests and if user is employee */}
          {isApproval && !isMe && orderId && (
            <TouchableOpacity 
              style={styles.approveButton}
              onPress={() => handleApprove(orderId)}
            >
              <Text style={styles.approveButtonText}>✅ Approve Order</Text>
            </TouchableOpacity>
          )}
          
          {/* Sender Name */}
          <Text style={[styles.senderName, isMe ? styles.senderNameMe : styles.senderNameOther]}>
            {senderName}
          </Text>
        </View>
        {isMe && <View style={{ width: 36 }} />}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ENHANCED: Full Screen Image Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <ScrollView
            contentContainerStyle={styles.modalScrollContainer}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            >
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </ScrollView>
          
          <View style={styles.modalInfo}>
            <Text style={styles.modalInfoText}>Pinch to zoom • Tap to close</Text>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Messages ({messages.length})
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        ref={scrollViewRef}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#252b55" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <>
            {messages.length === 0 ? (
              <Text style={styles.emptyText}>No messages yet</Text>
            ) : (
              messages.map((msg, idx) => renderMessage(msg, idx))
            )}
          </>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity 
          style={styles.attachButton} 
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#252b55" />
          ) : (
            <Text style={styles.attachButtonText}>📎</Text>
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ddd',
    marginRight: 12,
  },
  bubbleMe: {
    maxWidth: '70%',
    backgroundColor: '#252b55',
    borderRadius: 18,
    padding: 12,
    marginLeft: 32,
    marginRight: 0,
    alignSelf: 'flex-end',
  },
  bubbleOther: {
    maxWidth: '70%',
    backgroundColor: '#ededed',
    borderRadius: 18,
    padding: 12,
    marginLeft: 0,
    marginRight: 32,
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#252b55',
  },
  senderName: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  senderNameMe: {
    color: '#ccc',
  },
  senderNameOther: {
    color: '#888',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  attachButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attachButtonText: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    fontSize: 16,
    marginRight: 8,
    backgroundColor: '#f9f9f9',
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: '#252b55',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
    textAlign: 'right',
  },
  // ENHANCED: Image styles
  imageContainer: {
    position: 'relative',
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  },
  imageOverlayText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  // ENHANCED: Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(255,255,255,0.8)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  modalScrollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  modalInfo: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  modalInfoText: {
    color: 'white',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 15,
  },
});