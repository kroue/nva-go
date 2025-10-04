import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './SupabaseClient';
import './Messages.css';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dfejxqixw/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'proofs';

const Messages = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const listRef = useRef(null);

  // NEW: names cache for participants
  const [nameByEmail, setNameByEmail] = useState({});

  // Helper to show display name
  const displayName = (email) => {
    if (!email) return '';
    return nameByEmail[email] || email.split('@')[0];
  };

  // NEW: scroll helper
  const scrollToBottom = () => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    const initializeMessages = async () => {
      try {
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

      const chatGroups = {};
      (data || []).forEach(message => {
        // FIX: ensure array exists before push
        if (!chatGroups[message.chat_id]) chatGroups[message.chat_id] = [];
        chatGroups[message.chat_id].push(message);
      });

      const chatList = Object.keys(chatGroups).map(chatId => {
        const chatMessages = chatGroups[chatId];
        const latestMessage = chatMessages[0];
        const otherParticipant =
          latestMessage.sender === userEmail ? latestMessage.receiver : latestMessage.sender;

        return {
          id: chatId,
          participant: otherParticipant,
          latestMessage: latestMessage.text || '',
          timestamp: latestMessage.created_at,
          unreadCount: chatMessages.filter(m => !m.read && m.receiver === userEmail).length
        };
      });

      setChats(chatList);

      // NEW: load display names for all participants
      const emails = Array.from(new Set(chatList.map(c => c.participant).filter(Boolean)));
      if (emails.length > 0) {
        // Query customers and employees; build a combined map
        const [custRes, empRes] = await Promise.all([
          supabase.from('customers').select('email,first_name,last_name').in('email', emails),
          supabase.from('employees').select('email,first_name,last_name').in('email', emails),
        ]);

        const map = {};
        const addRows = (rows) => {
          (rows || []).forEach(r => {
            const fn = (r.first_name || '').trim();
            const ln = (r.last_name || '').trim();
            const full = `${fn} ${ln}`.trim();
            if (full) map[r.email] = full;
          });
        };
        if (!custRes.error) addRows(custRes.data);
        if (!empRes.error) addRows(empRes.data);

        // Only set if we found anything; otherwise keep existing/fallback
        if (Object.keys(map).length > 0) {
          setNameByEmail(prev => ({ ...prev, ...map }));
        }
      }
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

      if (currentUserEmail) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('chat_id', chatId)
          .eq('receiver', currentUserEmail);
      }

      // NEW: scroll after loading a conversation
      requestAnimationFrame(scrollToBottom);
    } catch (error) {
      console.error('Exception fetching messages:', error);
    }
  };

  // NEW: auto-scroll when messages append or when switching chats
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChat]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUserEmail) return;

    try {
      const messageData = {
        chat_id: selectedChat.id,
        sender: currentUserEmail,
        receiver: selectedChat.participant,
        text: newMessage.trim(),
        created_at: new Date().toISOString(),
        read: false
      };

      // Optimistic add
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');

      const { error } = await supabase.from('messages').insert(messageData);
      if (error) {
        console.error('Error sending message:', error);
        // Rollback
        setMessages(prev => prev.filter(m => m !== messageData));
        return;
      }

      fetchChats(currentUserEmail);
    } catch (error) {
      console.error('Exception sending message:', error);
    }
  };

  const handleAttachClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so selecting the same file again triggers change
    if (!file || !selectedChat || !currentUserEmail) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'messages');

      const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      const json = await res.json();
      if (!json?.secure_url) {
        console.error('Cloudinary upload failed:', json);
        setUploading(false);
        return;
      }

      const imageUrl = json.secure_url;
      const text = `[IMAGE]${imageUrl}`;

      const messageData = {
        chat_id: selectedChat.id,
        sender: currentUserEmail,
        receiver: selectedChat.participant,
        text,
        created_at: new Date().toISOString(),
        read: false
      };

      // Optimistic add
      setMessages(prev => [...prev, messageData]);

      const { error } = await supabase.from('messages').insert(messageData);
      if (error) {
        console.error('Error sending image message:', error);
        // Rollback
        setMessages(prev => prev.filter(m => m !== messageData));
      } else {
        fetchChats(currentUserEmail);
      }
    } catch (err) {
      console.error('Attach image error:', err);
    } finally {
      setUploading(false);
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
        {/* Sidebar */}
        <div className="Messages-chat-list">
          <div className="Messages-chat-list-header">Conversations</div>
          <div style={{ overflowY: 'auto' }}>
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`Messages-chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => handleChatSelect(chat)}
              >
                <div className="Messages-chat-participant">
                  {displayName(chat.participant)}
                </div>
                <div className="Messages-chat-preview">
                  {chat.latestMessage?.length > 50
                    ? chat.latestMessage.substring(0, 50) + '...'
                    : chat.latestMessage}
                </div>
                <div className="Messages-chat-time">
                  {chat.timestamp ? new Date(chat.timestamp).toLocaleDateString() : ''}
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
        </div>

        {/* Chat area */}
        <div className="Messages-chat-area">
          {selectedChat ? (
            <>
              <div className="Messages-chat-header">
                <div className="Messages-chat-title">
                  {displayName(selectedChat.participant)}
                </div>
              </div>

              {/* NEW: attach ref so we can scroll */}
              <div className="Messages-messages-container" ref={listRef}>
                {messages.map((message, index) => {
                  const isImage =
                    typeof message.text === 'string' && message.text.startsWith('[IMAGE]');
                  const imgUrl = isImage ? message.text.replace(/^\[IMAGE\]/, '') : null;
                  return (
                    <div
                      key={index}
                      className={`Messages-message ${
                        message.sender === currentUserEmail ? 'sent' : 'received'
                      }`}
                    >
                      <div className="Messages-message-content">
                        {isImage ? (
                          <a href={imgUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={imgUrl}
                              alt="attachment"
                              style={{ maxWidth: 260, borderRadius: 10, display: 'block' }}
                              onLoad={scrollToBottom} // NEW: scroll after image loads
                            />
                          </a>
                        ) : (
                          message.text
                        )}
                      </div>
                      <div className="Messages-message-time">
                        {message.created_at ? new Date(message.created_at).toLocaleString() : ''}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="Messages-input-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.png,.jpg,.jpeg,.gif"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button
                  className="Messages-attach-btn"
                  onClick={handleAttachClick}
                  disabled={uploading}
                  title="Attach image"
                >
                  📎
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={uploading ? 'Uploading image…' : 'Type a message...'}
                  className="Messages-input"
                  disabled={uploading}
                />
                <button onClick={sendMessage} className="Messages-send-btn" disabled={uploading}>
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