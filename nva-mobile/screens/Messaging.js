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
  Dimensions
} from 'react-native';
import { supabase } from '../SupabaseCient';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const scrollViewRef = useRef();

  // FIXED: Only fetch messages involving the current user
  const fetchMessages = async (email, allowedEmails) => {
    if (!email) return;
    
    setLoading(true);
    console.log('Fetching messages for user:', email);
    
    // Only get messages where current user is sender OR receiver
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender.eq.${email},receiver.eq.${email}`)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } else {
      // Additional filter to ensure we only show messages between user and allowed emails
      const filteredMessages = data?.filter(msg => 
        (msg.sender === email && allowedEmails.includes(msg.receiver)) ||
        (msg.receiver === email && allowedEmails.includes(msg.sender))
      ) || [];
      
      console.log('Filtered messages:', filteredMessages.length);
      setMessages(filteredMessages);
    }
    setLoading(false);
  };

  // Fetch users and initial messages
  useEffect(() => {
    const fetchUsersAndMessages = async () => {
      const email = await AsyncStorage.getItem('email');
      console.log('Current user:', email);
      setUserEmail(email);

      const { data: employees } = await supabase.from('employees').select('email,first_name,last_name');
      const { data: admins } = await supabase.from('admins').select('email,first_name,last_name');
      const allUsers = [
        ...(employees || []),
        ...(admins || [])
      ];
      const lookup = {};
      allUsers.forEach(u => {
        lookup[u.email] = `${u.first_name} ${u.last_name}`;
      });
      setUserLookup(lookup);

      const emails = allUsers.map(u => u.email);
      console.log('Allowed emails:', emails);
      setAllowedEmails(emails);

      // Fetch initial messages
      await fetchMessages(email, emails);
    };

    fetchUsersAndMessages();
  }, []);

  // Subscription for realtime updates
  useEffect(() => {
    if (!userEmail || allowedEmails.length === 0) return;

    console.log('Setting up subscription for user:', userEmail);

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async payload => {
          console.log('New message:', payload.new);
          
          // Only update if the new message involves the current user
          if (payload.new.sender === userEmail || payload.new.receiver === userEmail) {
            console.log('Message involves current user, updating...');
            await fetchMessages(userEmail, allowedEmails);
            // Only scroll to bottom if user is near bottom
            setTimeout(() => {
              if (isNearBottom) {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }
            }, 100);
          } else {
            console.log('Message does not involve current user, ignoring...');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, allowedEmails, isNearBottom]);

  // Detect if user is near bottom
  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 40;
    const nearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsNearBottom(nearBottom);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !userEmail || allowedEmails.length === 0) return;
    
    const receiver = allowedEmails[0]; // Send to first employee/admin

    const newMessage = {
      chat_id: [userEmail, receiver].sort().join('-'),
      sender: userEmail,
      receiver,
      text: input,
      read: false,
      created_at: new Date().toISOString(),
    };
    
    console.log('Sending message:', newMessage);
    setInput('');
    
    const { error } = await supabase.from('messages').insert(newMessage);
    if (error) {
      console.error('Error sending message:', error);
    } else {
      // Refetch messages after sending
      await fetchMessages(userEmail, allowedEmails);
      // Always scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleApprove = async (orderId) => {
    try {
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'Printing',
          approved: 'yes'
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Send confirmation message
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

      alert('Order approved and moved to printing!');
      
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Failed to approve order: ' + error.message);
    }
  };

  const extractImageUrl = (text) => {
    const matches = text.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif))/i);
    return matches ? matches[0] : null;
  };

  const handleImagePress = (url) => {
    setSelectedImage(url);
    setModalVisible(true);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <Image
            source={{ uri: selectedImage }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
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
        onScroll={handleScroll}
        scrollEventThrottle={100}
      >
        {loading ? (
          <Text>Loading...</Text>
        ) : messages.length === 0 ? (
          <Text style={styles.emptyText}>No messages yet</Text>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender === userEmail;
            const senderName = isMe ? 'You' : userLookup[msg.sender] || msg.sender;
            const isApproval = msg.text.startsWith('[APPROVAL_REQUEST]|');
            const isPickupReady = msg.text.startsWith('[PICKUP_READY]|');
            const orderId = (isApproval || isPickupReady) ? msg.text.split('|')[1].split('\n')[0] : null;
            const imageUrl = extractImageUrl(msg.text);

            const messageText = isApproval 
              ? msg.text.split('[APPROVAL_REQUEST]|')[1]
              : isPickupReady 
                ? msg.text.split('[PICKUP_READY]|')[1]
                : msg.text;

            return (
              <View key={msg.id || idx} style={[styles.row, isMe ? { justifyContent: 'flex-end' } : {}]}>
                {!isMe && <View style={styles.avatar} />}
                <View style={[isMe ? styles.bubbleMe : styles.bubbleOther]}>
                  <Text style={styles.timestamp}>
                    {new Date(msg.created_at).toLocaleString()}
                  </Text>
                  <Text style={styles.messageText}>
                    {messageText}
                  </Text>
                  {imageUrl && (
                    <TouchableOpacity onPress={() => handleImagePress(imageUrl)}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.previewImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                  {isApproval && !isMe && orderId && (
                    <TouchableOpacity 
                      style={styles.approveButton}
                      onPress={() => handleApprove(orderId)}
                    >
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.senderName}>{senderName}</Text>
                </View>
                {isMe && <View style={{ width: 36 }} />}
              </View>
            );
          })
        )}
      </ScrollView>
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: '#252b55',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  container: {
    padding: 18,
    backgroundColor: '#fff',
    flexGrow: 1,
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
  senderName: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
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
  },
  sendBtn: {
    backgroundColor: '#252b55',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messageText: {
    color: '#252b55',
    fontSize: 16,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
    textAlign: 'right',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});