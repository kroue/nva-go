import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './SupabaseClient';
import './Messages.css';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

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

  // NEW: Subscription for real-time updates
  useEffect(() => {
    if (!currentUserEmail) return;

    const channel = supabase
      .channel(`messages-${currentUserEmail}`)
      .on(
        'postgres_changes',
        // removed server-side filter; handle filtering client-side to avoid silent filter mismatches
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        },
        async payload => {
          console.log('Realtime payload received:', payload);
          const newMsg = payload?.new;
          if (!newMsg) return;

          // Only react when the new message involves the current user
          if (newMsg.receiver === currentUserEmail || newMsg.sender === currentUserEmail) {
            try {
              // Refresh chat list and, if open, the selected conversation
              await fetchChats(currentUserEmail);
              if (selectedChat && selectedChat.id === newMsg.chat_id) {
                await fetchMessages(selectedChat.id);
              }
            } catch (err) {
              console.error('Error handling realtime payload:', err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserEmail, selectedChat]);

  const fetchChats = async (userEmail) => {
    try {
      console.log('Fetching chats for:', userEmail);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender.eq.${userEmail},receiver.eq.${userEmail}`)
        .order('created_at', { ascending: false });

      console.log('Chats query result:', { dataCount: data?.length, error });

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
      console.log('Fetching messages for chat:', chatId);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      console.log('Messages query result:', { dataCount: data?.length, error });

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
        // let the DB set timestamps if it has defaults; avoid client-side created_at skew
        read: false
      };

      // Optimistic add
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');

      // Insert and return DB row
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Error sending message (insert):', error);
        // Rollback optimistic add
        setMessages(prev => prev.filter(m => m !== messageData));
        return;
      }

      // Refresh messages and chats from DB to ensure authoritative state
      await fetchMessages(selectedChat.id);
      await fetchChats(currentUserEmail);
      console.log('Message sent and refreshed:', data);
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
        read: false
      };

      // Optimistic add
      setMessages(prev => [...prev, messageData]);

      // Insert and get DB row
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Error sending image message (insert):', error);
        // Rollback optimistic add
        setMessages(prev => prev.filter(m => m !== messageData));
      } else {
        // Refresh authoritative state
        await fetchMessages(selectedChat.id);
        fetchChats(currentUserEmail);
        console.log('Image message sent and refreshed:', data);
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
        <div className="Messages-loading">
          <ChatBubbleOutlineOutlinedIcon style={{ fontSize: 64, opacity: 0.3 }} />
          <h2>Loading Messages...</h2>
          <p>Please wait while we fetch your conversations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="Messages-page">
      <div className="Messages-header">
        <div className="Messages-header-content">
          <ChatBubbleOutlineOutlinedIcon className="Messages-header-icon" />
          <div className="Messages-header-text">
            <h1>Messages</h1>
            <p>Chat with customers and manage conversations</p>
          </div>
        </div>
        <div className="Messages-stats">
          <div className="stat-badge">
            <span className="stat-number">{chats.length}</span>
            <span className="stat-label">Conversations</span>
          </div>
          <div className="stat-badge">
            <span className="stat-number">
              {chats.reduce((sum, chat) => sum + chat.unreadCount, 0)}
            </span>
            <span className="stat-label">Unread</span>
          </div>
        </div>
      </div>

      <div className="Messages-container">
        {/* Sidebar */}
        <div className="Messages-chat-list">
          <div className="Messages-chat-list-header">
            <h3>Conversations</h3>
            <span className="conversation-count">{chats.length}</span>
          </div>
          <div className="Messages-chat-list-scroll">
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`Messages-chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => handleChatSelect(chat)}
              >
                <div className="chat-avatar">
                  <PersonOutlineOutlinedIcon />
                </div>
                <div className="chat-info">
                  <div className="chat-header-row">
                    <span className="chat-participant">
                      {displayName(chat.participant)}
                    </span>
                    <span className="chat-time">
                      <AccessTimeOutlinedIcon style={{ fontSize: 12 }} />
                      {chat.timestamp ? new Date(chat.timestamp).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div className="chat-preview-row">
                    <span className="chat-preview">
                      {chat.latestMessage?.length > 45
                        ? chat.latestMessage.substring(0, 45) + '...'
                        : chat.latestMessage}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="unread-badge">{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {chats.length === 0 && (
              <div className="Messages-no-chats">
                <ChatBubbleOutlineOutlinedIcon style={{ fontSize: 48, opacity: 0.3 }} />
                <p>No conversations yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="Messages-chat-area">
          {selectedChat ? (
            <>
              <div className="Messages-chat-header">
                <div className="chat-header-left">
                  <div className="chat-avatar-large">
                    <PersonOutlineOutlinedIcon style={{ fontSize: 28 }} />
                  </div>
                  <div className="chat-header-info">
                    <h2>{displayName(selectedChat.participant)}</h2>
                    <p>{selectedChat.participant}</p>
                  </div>
                </div>
              </div>

              <div className="Messages-messages-container" ref={listRef}>
                {messages.map((message, index) => {
                  const isImage =
                    typeof message.text === 'string' && message.text.startsWith('[IMAGE]');
                  const imgUrl = isImage ? message.text.replace(/^\[IMAGE\]/, '') : null;
                  const isSent = message.sender === currentUserEmail;
                  
                  return (
                    <div
                      key={index}
                      className={`Messages-message ${isSent ? 'sent' : 'received'}`}
                    >
                      {!isSent && (
                        <div className="message-avatar">
                          <PersonOutlineOutlinedIcon style={{ fontSize: 20 }} />
                        </div>
                      )}
                      <div className="message-wrapper">
                        <div className="Messages-message-content">
                          {isImage ? (
                            <a href={imgUrl} target="_blank" rel="noopener noreferrer">
                              <img
                                src={imgUrl}
                                alt="attachment"
                                className="message-image"
                                onLoad={scrollToBottom}
                              />
                            </a>
                          ) : (
                            message.text
                          )}
                        </div>
                        <div className="Messages-message-time">
                          {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : ''}
                          {isSent && <CheckCircleOutlinedIcon style={{ fontSize: 12, marginLeft: 4 }} />}
                        </div>
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
                  {uploading ? (
                    <span className="uploading-spinner">⏳</span>
                  ) : (
                    <AttachFileOutlinedIcon style={{ fontSize: 20 }} />
                  )}
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
                <button 
                  onClick={sendMessage} 
                  className="Messages-send-btn" 
                  disabled={uploading || !newMessage.trim()}
                >
                  <SendOutlinedIcon style={{ fontSize: 20 }} />
                </button>
              </div>
            </>
          ) : (
            <div className="Messages-no-chat-selected">
              <ChatBubbleOutlineOutlinedIcon style={{ fontSize: 64, opacity: 0.3 }} />
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