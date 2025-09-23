import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './SupabaseClient';
import './Messages.css';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dfejxqixw/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'proofs'; // Changed to use existing preset

const Messages = () => {
  const [userEmail, setUserEmail] = useState('');
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get the logged-in user's email from Supabase Auth
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  // Fetch chats involving the current user
  useEffect(() => {
    const fetchChats = async () => {
      if (!userEmail) return;

      // Get all messages where current user is either sender or receiver
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender.eq.${userEmail},receiver.eq.${userEmail}`)
        .order('created_at', { ascending: false });

      if (error || !allMessages) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Group messages by conversation partner and fetch their details
      const chatMap = new Map();
      const partnerEmails = new Set();
      
      allMessages.forEach(message => {
        const partnerEmail = message.sender === userEmail ? message.receiver : message.sender;
        partnerEmails.add(partnerEmail);
        
        if (!chatMap.has(partnerEmail)) {
          chatMap.set(partnerEmail, {
            partnerEmail,
            messages: [],
            lastMessage: message.text,
            lastMessageTime: message.created_at,
            unreadCount: 0
          });
        }
        
        chatMap.get(partnerEmail).messages.push(message);
        
        // Count unread messages
        if (message.receiver === userEmail && !message.read) {
          chatMap.get(partnerEmail).unreadCount++;
        }
      });

      // Fetch customer details for each partner
      const partnersArray = Array.from(partnerEmails);
      const { data: customers } = await supabase
        .from('customers')
        .select('email, first_name, last_name')
        .in('email', partnersArray);

      // Fetch employee details as well
      const { data: employees } = await supabase
        .from('employees')
        .select('email, first_name, last_name')
        .in('email', partnersArray);

      // Combine customer and employee data
      const allUsers = [...(customers || []), ...(employees || [])];

      // Create final chats array with user details
      const chatsList = Array.from(chatMap.values()).map(chat => {
        const userDetails = allUsers.find(user => user.email === chat.partnerEmail);
        return {
          id: chat.partnerEmail,
          email: chat.partnerEmail,
          name: userDetails ? `${userDetails.first_name} ${userDetails.last_name}`.trim() : chat.partnerEmail,
          firstName: userDetails?.first_name || 'User',
          lastName: userDetails?.last_name || '',
          lastMessage: chat.lastMessage,
          lastMessageTime: chat.lastMessageTime,
          unreadCount: chat.unreadCount
        };
      }).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

      setChats(chatsList);
    };

    fetchChats();

    // IMPROVED: Use polling instead of realtime to avoid WebSocket errors
    const pollInterval = setInterval(() => {
      fetchChats();
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(pollInterval);
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

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender', selectedChat.email)
        .eq('receiver', userEmail)
        .eq('read', false);
    };

    fetchMessages();

    // Poll for new messages in the selected chat
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 3000); // Poll every 3 seconds for active chat

    return () => {
      clearInterval(pollInterval);
    };
  }, [selectedChat, userEmail]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // IMPROVED: Fetch unread messages on component mount
  useEffect(() => {
    if (userEmail) {
      fetchUnreadMessages(userEmail);
      
      // Poll for unread messages
      const pollInterval = setInterval(() => {
        fetchUnreadMessages(userEmail);
      }, 10000); // Poll every 10 seconds for unread messages

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [userEmail]);

  const uploadImageToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      console.log('Uploading to Cloudinary...', {
        preset: CLOUDINARY_UPLOAD_PRESET,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      console.log('Cloudinary response:', responseText);

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Upload successful:', data.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  const handleImageUpload = async (file) => {
    if (!file || !selectedChat) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      
      const messageData = {
        sender: userEmail,
        receiver: selectedChat.email,
        text: `[IMAGE]${imageUrl}`,
        chat_id: [userEmail, selectedChat.email].sort().join('-'),
        created_at: new Date().toISOString(),
        read: false
      };

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error sending image:', error);
      alert('Failed to send image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    } else {
      alert('Please select an image file');
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedChat) return;

    const messageData = {
      sender: userEmail,
      receiver: selectedChat.email,
      text: input.trim(),
      chat_id: [userEmail, selectedChat.email].sort().join('-'),
      created_at: new Date().toISOString(),
      read: false
    };

    const { error } = await supabase
      .from('messages')
      .insert([messageData]);

    if (!error) {
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const truncateMessage = (message, length = 50) => {
    if (message.startsWith('[IMAGE]')) {
      return '📷 Image';
    }
    return message.length > length ? message.substring(0, length) + '...' : message;
  };

  const renderMessage = (message) => {
    if (message.text.startsWith('[IMAGE]')) {
      const imageUrl = message.text.substring(7); // Remove '[IMAGE]' prefix
      return (
        <div className="Messages-message-image">
          <img src={imageUrl} alt="Sent image" onClick={() => window.open(imageUrl, '_blank')} />
        </div>
      );
    }
    return <div className="Messages-message-content">{message.text}</div>;
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchUnreadMessages = async (email) => {
    try {
      console.log('Fetching unread messages for:', email);
      
      // Get unread messages for the employee
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver', email)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return;
      }

      console.log('Raw unread messages:', messages);

      if (!messages || messages.length === 0) {
        setUnreadMessages([]);
        return;
      }

      // Get unique sender emails
      const senderEmails = [...new Set(messages.map(msg => msg.sender))];
      console.log('Unique sender emails:', senderEmails);

      // Fetch customer details for these senders
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('email, first_name, last_name')
        .in('email', senderEmails);

      if (customersError) {
        console.error('Error fetching customers:', customersError);
      }

      console.log('Customer details:', customers);

      // Combine messages with customer details
      const messagesWithCustomers = messages.map(message => {
        const customer = customers?.find(c => c.email === message.sender);
        return {
          ...message,
          sender_name: customer ? `${customer.first_name} ${customer.last_name}` : message.sender
        };
      });

      console.log('Messages with customer names:', messagesWithCustomers);
      setUnreadMessages(messagesWithCustomers);

    } catch (error) {
      console.error('Error in fetchUnreadMessages:', error);
    }
  };

  return (
    <div className="Messages-container">
      {/* Chat List Sidebar */}
      <div className="Messages-sidebar">
        <div className="Messages-header">
          <h2>Messages</h2>
          {/* ADD: Show unread messages count */}
          {unreadMessages.length > 0 && (
            <div className="Messages-unread-indicator">
              {unreadMessages.length} unread
            </div>
          )}
        </div>
        
        <div className="Messages-chats-section">
          <div className="Messages-chats-header">
            <h3>Chats</h3>
          </div>
          
          <div className="Messages-search-container">
            <svg className="Messages-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Search Messages"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="Messages-search-input"
            />
          </div>

          <div className="Messages-chat-list">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`Messages-chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="Messages-chat-info">
                  <div className="Messages-chat-name">{chat.name}</div>
                  <div className="Messages-chat-preview">
                    You: {truncateMessage(chat.lastMessage)}
                  </div>
                </div>
                <div className="Messages-chat-meta">
                  <div className="Messages-chat-time">
                    {formatTime(chat.lastMessageTime)}
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="Messages-unread-badge">{chat.unreadCount}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="Messages-chat-area">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="Messages-chat-header">
              <div className="Messages-chat-user">
                <div>
                  <div className="Messages-chat-user-name">{selectedChat.name}</div>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="Messages-list">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`Messages-message ${message.sender === userEmail ? 'sent' : 'received'}`}
                >
                  {renderMessage(message)}
                  <div className="Messages-message-time">
                    {formatTime(message.created_at)}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="Messages-input-container">
              <div className="Messages-input-wrapper">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button 
                  className="Messages-input-action"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Attach Image"
                >
                  {uploading ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z">
                        <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" values="0 12 12;360 12 12"/>
                      </path>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  )}
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="Messages-input"
                  rows="1"
                />
                <button onClick={sendMessage} className="Messages-send-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="Messages-no-chat">
            <div className="Messages-no-chat-content">
              <h3>Messages</h3>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;