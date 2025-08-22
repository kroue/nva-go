import React, { useState } from 'react';
import './Messages.css';

const chats = [
  {
    id: 1,
    name: 'Kriz Cultura',
    avatar: '/images/kriz-avatar.jpg',
    lastMessage: 'Hi Kriz, Your order is ready for pick up.',
    lastTime: '1m',
    messages: [
      {
        from: 'me',
        time: '5:16 PM',
        text: `Hi [Buyer's Name],

Thanks for letting me know. I understand you’d prefer the keyboard to be fixed. Would you like me to arrange the repairs, or would you prefer to handle the repairs yourself and I reimburse or share the cost? Please let me know what works best for you, and we’ll find a solution.

I want to make sure you’re satisfied with your purchase.`,
        color: 'purple'
      },
      {
        from: 'me',
        time: '9:18 PM',
        text: `Hi Kriz,

Your order is ready for pick up.

Just let us know for any updates and have a great day ahead.`,
        color: 'blue'
      }
    ]
  }
];

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState(chats[0]);

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
              className={`Messages-chat-item${selectedChat.id === chat.id ? ' active' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <img src={chat.avatar} alt={chat.name} className="Messages-chat-avatar" />
              <div>
                <div className="Messages-chat-name">{chat.name}</div>
                <div className="Messages-chat-last">
                  You: {chat.lastMessage} <span className="Messages-chat-time">{chat.lastTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="Messages-thread">
          <div className="Messages-thread-header">
            <img src={selectedChat.avatar} alt={selectedChat.name} className="Messages-thread-avatar" />
            <span className="Messages-thread-name">{selectedChat.name}</span>
          </div>
          <div className="Messages-thread-body">
            {selectedChat.messages.map((msg, idx) => (
              <div key={idx} className={`Messages-message ${msg.color}`}>
                <div className="Messages-message-time">{msg.time}</div>
                <div className="Messages-message-text">{msg.text}</div>
              </div>
            ))}
          </div>
          <div className="Messages-thread-inputbar">
            <input className="Messages-input" placeholder="Aa" />
            <button className="Messages-send-btn">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;