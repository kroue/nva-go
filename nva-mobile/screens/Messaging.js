import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
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
  const scrollViewRef = useRef();

  // Move fetchMessages to top-level so both effects can use it
  const fetchMessages = async (email, allowedEmails) => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender.in.(${allowedEmails.join(',')}),receiver.in.(${allowedEmails.join(',')})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);
  };

  // Fetch users and initial messages
  useEffect(() => {
    const fetchUsersAndMessages = async () => {
      const email = await AsyncStorage.getItem('email');
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
      setAllowedEmails(emails);

      // Fetch initial messages
      await fetchMessages(email, emails);
    };

    fetchUsersAndMessages();
  }, []);

  // Subscription for realtime updates
  useEffect(() => {
    if (!userEmail || allowedEmails.length === 0) return;

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async payload => {
          await fetchMessages(userEmail, allowedEmails);
          // Only scroll to bottom if user is near bottom
          setTimeout(() => {
            if (isNearBottom) {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, allowedEmails, isNearBottom]);

  // Detect if user is near bottom (keep this for future use if needed)
  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 40; // px
    const nearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsNearBottom(nearBottom);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !userEmail) return;
    const receiver = allowedEmails[0] || userEmail;

    const newMessage = {
      chat_id: [userEmail, receiver].sort().join('-'),
      sender: userEmail,
      receiver,
      text: input,
      created_at: new Date(Date.now() + (8 * 60 * 60 * 1000)).toISOString(), // Philippine time
    };
    setInput('');
    await supabase.from('messages').insert(newMessage);
    // Refetch messages after sending
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender.in.(${allowedEmails.join(',')}),receiver.in.(${allowedEmails.join(',')})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    // Always scroll to bottom after sending
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      >
        {loading ? (
          <Text>Loading...</Text>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender === userEmail;
            const senderName = isMe ? 'You' : userLookup[msg.sender] || msg.sender;
            return (
              <View key={msg.id || idx} style={[styles.row, isMe ? { justifyContent: 'flex-end' } : {}]}>
                {!isMe && <View style={styles.avatar} />}
                <View style={[isMe ? styles.bubbleMe : styles.bubbleOther]}>
                  <Text style={{ fontSize: 11, color: '#888', marginBottom: 2, textAlign: 'right' }}>
                    {new Date(msg.created_at).toLocaleString('en-PH', {
                      timeZone: 'Asia/Manila',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })}
                  </Text>
                  <Text style={{ color: isMe ? '#fff' : '#252b55', fontSize: 16 }}>{msg.text}</Text>
                  <Text style={styles.senderName}>
                    {senderName}
                  </Text>
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
  container: {
    padding: 18,
    backgroundColor: '#fff',
    flexGrow: 1,
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
});