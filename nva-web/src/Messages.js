import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './SupabaseClient';
import './Messages.css';

const Messages = () => {
  const [userEmail, setUserEmail] = useState('');
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Get the logged-in user's email from Supabase Auth
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  // Fetch chats involving the current user only
  useEffect(() => {
    const fetchChats = async () => {
      if (!userEmail) return;

      // Get all messages where current user is either sender or receiver
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select(`
          *,
          customers!messages_sender_fkey(first_name, last_name, email),
          customers!messages_receiver_fkey(first_name, last_name, email)
        `)
        .or(`sender.eq.${userEmail},receiver.eq.${userEmail}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Group messages by conversation partner
      const chatMap = new Map();
      
      allMessages?.forEach(message => {
        let chatPartner;
        let chatPartnerId;
        
        // Determine who the chat partner is (not the current user)
        if (message.sender === userEmail) {
          // Current user sent this message
          chatPartner = message.customers_receiver || { 
            first_name: 'Unknown', 
            last_name: 'User', 
            email: message.receiver 
          };
          chatPartnerId = message.receiver;
        } else {
          // Current user received this message
          chatPartner = message.customers_sender || { 
            first_name: 'Unknown', 
            last_name: 'User', 
            email: message.sender 
          };
          chatPartnerId = message.sender;
        }

        if (!chatMap.has(chatPartnerId)) {
          chatMap.set(chatPartnerId, {
            id: chatPartnerId,
            name: `${chatPartner.first_name} ${chatPartner.last_name}`,
            email: chatPartnerId,
            lastMessage: message.text,
            lastMessageTime: message.created_at,
            unreadCount: 0
          });
        }

        // Count unread messages (messages received by current user that are unread)
        if (message.receiver === userEmail && !message.read) {
          chatMap.get(chatPartnerId).unreadCount++;
        }
      });

      const chatsList = Array.from(chatMap.values()).sort(
        (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );

      setChats(chatsList);
    };

    fetchChats();

    // Subscribe to new messages involving current user
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Only update if the new message involves current user
          if (payload.new.sender === userEmail || payload.new.receiver === userEmail) {
            fetchChats();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userEmail]);

  // Fetch messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat || !userEmail) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender.eq.${userEmail},receiver.eq.${selectedChat.email}),and(sender.eq.${selectedChat.email},receiver.eq.${userEmail})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);

      // Mark messages as read if they were sent to current user
      const unreadMessages = data?.filter(msg => 
        msg.receiver === userEmail && !msg.read
      );

      if (unreadMessages && unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg.id);
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', messageIds);
      }
    };

    fetchMessages();
  }, [selectedChat, userEmail]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedChat || !userEmail) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        sender: userEmail,
        receiver: selectedChat.email,
        text: input.trim(),
        read: false
      });

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="Messages">
      <div className="Messages-sidebar">
        <h2>Messages</h2>
        <div className="Messages-chat-list">
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`Messages-chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="Messages-chat-avatar">
                {chat.name.charAt(0).toUpperCase()}
              </div>
              <div className="Messages-chat-info">
                <div className="Messages-chat-name">{chat.name}</div>
                <div className="Messages-chat-preview">{chat.lastMessage}</div>
              </div>
              {chat.unreadCount > 0 && (
                <div className="Messages-unread-badge">{chat.unreadCount}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="Messages-main">
        {selectedChat ? (
          <>
            <div className="Messages-header">
              <h3>{selectedChat.name}</h3>
            </div>
            <div className="Messages-content">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`Messages-message ${
                    message.sender === userEmail ? 'sent' : 'received'
                  }`}
                >
                  <div className="Messages-message-text">{message.text}</div>
                  <div className="Messages-message-time">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="Messages-input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="Messages-empty">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;