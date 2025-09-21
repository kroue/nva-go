import React, { useState, useEffect, useRef } from 'react';
import './Messages.css';
import { supabase } from './SupabaseClient';

const Messages = () => {
  const [userEmail, setUserEmail] = useState('');
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Get the logged-in user's email from Supabase Auth
  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || '');
    };
    getUserEmail();
  }, []);

  // Fetch all users (employees, admins, customers)
  useEffect(() => {
    const fetchChats = async () => {
      // Fetch all users except yourself
      const { data: employees } = await supabase.from('employees').select('id, first_name, last_name, email');
      const { data: admins } = await supabase.from('admins').select('id, username, email');
      const { data: customers } = await supabase.from('customers').select('id, first_name, last_name, email');
      const allUsers = [
        ...(employees || []).map(u => ({
          id: u.id,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
          avatar: '/default-avatar.png',
          email: u.email
        })),
        ...(admins || []).map(u => ({
          id: u.id,
          name: u.username,
          avatar: '/default-avatar.png',
          email: u.email
        })),
        ...(customers || []).map(u => ({
          id: u.id,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
          avatar: '/default-avatar.png',
          email: u.email
        }))
      ].filter(u => u.email !== userEmail); // Exclude yourself

      setChats(allUsers);
      if (allUsers.length > 0) setSelectedChat(allUsers[0]);
    };
    fetchChats();
  }, [userEmail]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;
    const chatId = [userEmail, selectedChat.email].sort().join('-');

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async payload => {
          console.log('New message received:', payload.new);
          // Refetch messages for the current chat
          if (payload.new.chat_id === chatId) {
            await fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat, userEmail]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !selectedChat) return;
    const chatId = [userEmail, selectedChat.email].sort().join('-');
    const { data: employees } = await supabase.from('employees').select('email');
    const { data: admins } = await supabase.from('admins').select('email');
    const allowedEmails = [
      ...(employees || []).map(e => e.email),
      ...(admins || []).map(a => a.email)
    ];
    const receiver = allowedEmails[0] || userEmail;

    const newMessage = {
      chat_id: chatId,
      sender: userEmail,
      receiver: selectedChat.email,
      text: input,
      created_at: new Date(Date.now() + (8 * 60 * 60 * 1000)).toISOString(), // Philippine time
    };
    setInput('');
    await supabase.from('messages').insert(newMessage);
    // Refetch messages after sending
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  return (
    <div className="Messages-page">
      <div className="Messages-header">Messages</div>
      <div className="Messages-container">
        <div className="Messages-chats">
          <div className="Messages-chats-title">Chats</div>
          <input className="Messages-search" placeholder="Search Messages" />
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`Messages-chat-item${selectedChat && selectedChat.id === chat.id ? ' active' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <img src={chat.avatar} alt={chat.name} className="Messages-chat-avatar" />
              <div>
                <span className="Messages-chat-time">
                    {messages.length > 0 && selectedChat && selectedChat.id === chat.id
                      ? new Date(messages[messages.length - 1].created_at).toLocaleString('en-PH', {
                          timeZone: 'Asia/Manila',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })
                      : ''}
                  </span>
                <div className="Messages-chat-name">{chat.name}</div>
                
                <div className="Messages-chat-last">
                  {/* Show last message if available */}
                  {messages.length > 0 && selectedChat && selectedChat.id === chat.id
                    ? `${messages[messages.length - 1].sender === userEmail ? 'You: ' : ''}${messages[messages.length - 1].text}`
                    : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="Messages-thread">
          {selectedChat && (
            <>
              <div className="Messages-thread-header">
                <img src={selectedChat.avatar} alt={selectedChat.name} className="Messages-thread-avatar" />
                <span className="Messages-thread-name">{selectedChat.name}</span>
              </div>
              <div className="Messages-thread-body">
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`Messages-message ${msg.sender === userEmail ? 'me' : 'other'}`}
                  >
                    <div className="Messages-message-time">
                      {new Date(msg.created_at).toLocaleString('en-PH', {
                        timeZone: 'Asia/Manila',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                    <div className="Messages-message-text">{msg.text}</div>
                    <div className="Messages-message-sender">
                      {msg.sender === userEmail ? "You" : (chats.find(u => u.email === msg.sender)?.name || msg.sender)}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="Messages-thread-inputbar">
                <input
                  className="Messages-input"
                  placeholder="Aa"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button className="Messages-send-btn" onClick={sendMessage}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;