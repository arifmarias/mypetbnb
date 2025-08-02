import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip,
  Image,
  Smile,
  MessageSquare,
  Calendar,
  User
} from 'lucide-react';

const MessagingCenter = () => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  const mockConversations = [
    {
      id: 'booking1',
      otherUser: {
        id: 'caregiver1',
        full_name: 'Sarah Johnson',
        profile_image_url: null,
        role: 'caregiver'
      },
      booking: {
        id: 'booking1',
        service_title: 'Premium Pet Boarding',
        start_date: '2024-12-30',
        pet_names: ['Buddy', 'Luna']
      },
      lastMessage: {
        content: 'Looking forward to taking care of Buddy and Luna!',
        timestamp: '2024-12-28T10:30:00Z',
        sender_id: 'caregiver1'
      },
      unread: true
    },
    {
      id: 'booking2',
      otherUser: {
        id: 'caregiver2',
        full_name: 'Michael Chen',
        profile_image_url: null,
        role: 'caregiver'
      },
      booking: {
        id: 'booking2',
        service_title: 'Dog Walking Service',
        start_date: '2024-12-29',
        pet_names: ['Max']
      },
      lastMessage: {
        content: 'Thanks for the booking! I\'ll be there at 3 PM.',
        timestamp: '2024-12-27T15:45:00Z',
        sender_id: 'caregiver2'
      },
      unread: false
    }
  ];

  const mockMessages = [
    {
      id: '1',
      booking_id: 'booking1',
      sender_id: 'caregiver1',
      receiver_id: user?.id,
      content: 'Hi! Thanks for booking with me. I\'m excited to take care of Buddy and Luna!',
      message_type: 'text',
      created_at: '2024-12-27T09:00:00Z'
    },
    {
      id: '2',
      booking_id: 'booking1',
      sender_id: user?.id,
      receiver_id: 'caregiver1',
      content: 'Thank you! They are both very friendly. Buddy loves to play fetch and Luna prefers quieter activities.',
      message_type: 'text',
      created_at: '2024-12-27T09:15:00Z'
    },
    {
      id: '3',
      booking_id: 'booking1',
      sender_id: 'caregiver1',
      receiver_id: user?.id,
      content: 'Perfect! I have a nice yard for Buddy to play in, and plenty of cozy spots for Luna. Do they have any special dietary requirements?',
      message_type: 'text',
      created_at: '2024-12-27T09:30:00Z'
    },
    {
      id: '4',
      booking_id: 'booking1',
      sender_id: user?.id,
      receiver_id: 'caregiver1',
      content: 'Buddy eats twice a day and Luna once in the evening. I\'ll pack their regular food. Luna is on medication for her joints - one pill with dinner.',
      message_type: 'text',
      created_at: '2024-12-27T10:00:00Z'
    },
    {
      id: '5',
      booking_id: 'booking1',
      sender_id: 'caregiver1',
      receiver_id: user?.id,
      content: 'Got it! I\'ll make sure Luna gets her medication with dinner. Looking forward to taking care of them both!',
      message_type: 'text',
      created_at: '2024-12-28T10:30:00Z'
    }
  ];

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      // In production, this would fetch from API
      setConversations(mockConversations);
      
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0]);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (bookingId) => {
    try {
      // In production: const response = await axios.get(`/api/messages/${bookingId}`);
      const bookingMessages = mockMessages.filter(msg => msg.booking_id === bookingId);
      setMessages(bookingMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const messageData = {
        booking_id: selectedConversation.id,
        receiver_id: selectedConversation.otherUser.id,
        content: newMessage.trim()
      };

      // In production: await axios.post('/api/messages', messageData);
      
      // Mock adding message locally
      const newMsg = {
        id: Date.now().toString(),
        booking_id: selectedConversation.id,
        sender_id: user.id,
        receiver_id: selectedConversation.otherUser.id,
        content: newMessage.trim(),
        message_type: 'text',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');

      // Update last message in conversation
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: { content: newMessage.trim(), timestamp: new Date().toISOString(), sender_id: user.id } }
            : conv
        )
      );
      
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.booking.service_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="card h-96 bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Messages</h1>
          <p className="text-gray-600">
            Communicate with caregivers about your bookings
          </p>
        </div>

        {/* Messages Interface */}
        <div className="card overflow-hidden" style={{ height: '600px' }}>
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">No conversations yet</p>
                      <p className="text-sm text-gray-400">Messages will appear here when you book services</p>
                    </div>
                  </div>
                ) : (
                  filteredConversations.map(conversation => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-purple-50 border-purple-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                            {conversation.otherUser.full_name.charAt(0)}
                          </div>
                          {conversation.unread && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {conversation.otherUser.full_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <p className="text-xs text-gray-500 truncate">
                              {conversation.booking.service_title}
                            </p>
                          </div>
                          
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                          {selectedConversation.otherUser.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {selectedConversation.otherUser.full_name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {selectedConversation.booking.service_title}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">
                              Pets: {selectedConversation.booking.pet_names.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <Phone className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <Video className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="space-y-4">
                      {messages.map(message => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            message.sender_id === user?.id
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user?.id ? 'text-purple-200' : 'text-gray-500'
                            }`}>
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Message Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <Image className="h-5 w-5" />
                      </button>
                      
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                          <Smile className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="btn btn-primary p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                /* No Conversation Selected */
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the sidebar to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingCenter;