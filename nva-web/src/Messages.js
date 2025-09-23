import React, { useState, useEffect } from 'react';
import { supabase } from './SupabaseClient';
import './Messages.css';

const Messages = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  useEffect(() => {
    const initializeMessages = async () => {
      try {
        // FIXED: Get user email directly in useEffect
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setCurrentUserEmail(session.user.email);
          await fetchChats(session.user.email);
        }
      } catch (error) {
        console.error('Error getting user session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeMessages();
  }, []);

  const fetchChats = async (userEmail) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender.eq.${userEmail},receiver.eq.${userEmail}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error);
        return;
      }

      // Group messages by chat_id
      const chatGroups = {};
      data.forEach(message => {
        if (!chatGroups[message.chat_id]) {
          chatGroups[message.chat_id] = [];
        }
        chatGroups[message.chat_id].push(message);
      });

      // Convert to chat list with latest message
      const chatList = Object.keys(chatGroups).map(chatId => {
        const chatMessages = chatGroups[chatId];
        const latestMessage = chatMessages[0];
        const otherParticipant = latestMessage.sender === userEmail 
          ? latestMessage.receiver 
          : latestMessage.sender;

        return {
          id: chatId,
          participant: otherParticipant,
          latestMessage: latestMessage.text,
          timestamp: latestMessage.created_at,
          unreadCount: chatMessages.filter(m => !m.read && m.receiver === userEmail).length
        };
      });

      setChats(chatList);
    } catch (error) {
      console.error('Exception fetching chats:', error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);

      // Mark messages as read
      if (currentUserEmail) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('chat_id', chatId)
          .eq('receiver', currentUserEmail);
      }
    } catch (error) {
      console.error('Exception fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUserEmail) return;

    try {
      const messageData = {
        chat_id: selectedChat.id,
        sender: currentUserEmail,
        receiver: selectedChat.participant,
        text: newMessage,
        created_at: new Date().toISOString(),
        read: false
      };

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
      fetchMessages(selectedChat.id);
      fetchChats(currentUserEmail);
    } catch (error) {
      console.error('Exception sending message:', error);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  if (loading) {
    return (
      <div className="Messages-page">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Loading...</h2>
          <p>Please wait while we fetch your messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="Messages-page">
      <div className="Messages-header">Messages</div>
      
      <div className="Messages-container">
        <div className="Messages-chat-list">
          <div className="Messages-chat-list-header">Conversations</div>
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`Messages-chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
              onClick={() => handleChatSelect(chat)}
            >
              <div className="Messages-chat-participant">
                {chat.participant.split('@')[0]}
              </div>
              <div className="Messages-chat-preview">
                {chat.latestMessage.length > 50 
                  ? chat.latestMessage.substring(0, 50) + '...'
                  : chat.latestMessage}
              </div>
              <div className="Messages-chat-time">
                {new Date(chat.timestamp).toLocaleDateString()}
              </div>
              {chat.unreadCount > 0 && (
                <div className="Messages-unread-badge">{chat.unreadCount}</div>
              )}
            </div>
          ))}
          {chats.length === 0 && (
            <div className="Messages-no-chats">No conversations yet</div>
          )}
        </div>

        <div className="Messages-chat-area">
          {selectedChat ? (
            <>
              <div className="Messages-chat-header">
                <div className="Messages-chat-title">
                  {selectedChat.participant.split('@')[0]}
                </div>
              </div>
              
              <div className="Messages-messages-container">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`Messages-message ${
                      message.sender === currentUserEmail ? 'sent' : 'received'
                    }`}
                  >
                    <div className="Messages-message-content">
                      {message.text}
                    </div>
                    <div className="Messages-message-time">
                      {new Date(message.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="Messages-input-area">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="Messages-input"
                />
                <button onClick={sendMessage} className="Messages-send-btn">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="Messages-no-chat-selected">
              <h3>Select a conversation to start messaging</h3>
              <p>Choose a conversation from the left to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;