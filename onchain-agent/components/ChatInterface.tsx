'use client';

import { useState, useEffect, useRef } from 'react';
import { Pet } from '../lib/pet';
import InviteFriendsModal from './InviteFriendsModal';
import { ApiService, Friend } from '@/lib/api';

interface Message {
  id: string;
  _id?: string;
  content: string;
  text?: string; // For backward compatibility
  sender: 'user' | 'pet' | 'system';
  timestamp: Date;
  metadata?: {
    mood?: string;
    xpGained?: number;
  };
  isRead?: boolean;
}

interface ChatInterfaceProps {
  pet: Pet;
}

export default function ChatInterface({ pet }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'friends' | 'settings'>('chat');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendMessages, setFriendMessages] = useState<{[friendId: string]: Message[]}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const apiService = new ApiService();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, [pet.id]);

  // Load chat history from API
  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      // Get userId from localStorage or session
      const userId = localStorage.getItem('userId') || pet.petWalletAddress;
      if (!userId || !pet.id) {
        // Initialize with welcome message if no history
        const welcomeMessage: Message = {
          id: 'welcome',
          content: `Hi! I'm ${pet.name}! How are you doing today?`,
          sender: 'pet',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        setIsLoadingHistory(false);
        return;
      }

      const response = await fetch(
        `/api/chats?userId=${userId}&petId=${pet.id}&limit=50`
      );
      const data = await response.json();

      if (data.success && data.messages && data.messages.length > 0) {
        const loadedMessages = data.messages.map((msg: any) => ({
          id: msg._id,
          _id: msg._id,
          content: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp),
          metadata: msg.metadata,
          isRead: msg.isRead
        }));
        setMessages(loadedMessages);
      } else {
        // Initialize with welcome message if no history
        const welcomeMessage: Message = {
          id: 'welcome',
          content: `Hi! I'm ${pet.name}! How are you doing today?`,
          sender: 'pet',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Initialize with welcome message on error
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Hi! I'm ${pet.name}! How are you doing today?`,
        sender: 'pet',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load friends when component mounts
  useEffect(() => {
    loadFriends();
  }, []);

  // Load friends from API
  const loadFriends = async () => {
    try {
      const response = await apiService.friends.getAll();
      if (response.success && response.data && response.data.length > 0) {
        setFriends(response.data);
      } else {
        // Add placeholder friends if no friends exist
        const placeholderFriends: Friend[] = [
          {
            id: '1',
            name: 'Alice Cooper',
            address: '0x1234567890123456789012345678901234567890',
            xmtpAvailable: true,
            inviteSent: true,
            addedAt: Date.now() - 86400000 // 1 day ago
          },
          {
            id: '2',
            name: 'Bob Smith',
            address: '0x2345678901234567890123456789012345678901',
            xmtpAvailable: true,
            inviteSent: true,
            addedAt: Date.now() - 172800000 // 2 days ago
          },
          {
            id: '3',
            name: 'Charlie Brown',
            address: '0x3456789012345678901234567890123456789012',
            xmtpAvailable: false,
            inviteSent: false,
            addedAt: Date.now() - 259200000 // 3 days ago
          },
          {
            id: '4',
            name: 'Diana Prince',
            address: '0x4567890123456789012345678901234567890123',
            xmtpAvailable: true,
            inviteSent: true,
            addedAt: Date.now() - 345600000 // 4 days ago
          },
          {
            id: '5',
            name: 'Eve Wilson',
            address: '0x5678901234567890123456789012345678901234',
            xmtpAvailable: false,
            inviteSent: true,
            addedAt: Date.now() - 432000000 // 5 days ago
          },
          {
            id: '6',
            name: 'Frank Miller',
            address: '0x6789012345678901234567890123456789012345',
            xmtpAvailable: true,
            inviteSent: true,
            addedAt: Date.now() - 518400000 // 6 days ago
          },
          {
            id: '7',
            name: 'Grace Hopper',
            address: '0x7890123456789012345678901234567890123456',
            xmtpAvailable: true,
            inviteSent: false,
            addedAt: Date.now() - 604800000 // 1 week ago
          },
          {
            id: '8',
            name: 'Henry Ford',
            address: '0x8901234567890123456789012345678901234567',
            xmtpAvailable: false,
            inviteSent: true,
            addedAt: Date.now() - 691200000 // 8 days ago
          },
          {
            id: '9',
            name: 'Ivy Chen',
            address: '0x9012345678901234567890123456789012345678',
            xmtpAvailable: true,
            inviteSent: true,
            addedAt: Date.now() - 777600000 // 9 days ago
          },
          {
            id: '10',
            name: 'Jack Sparrow',
            address: '0xa123456789012345678901234567890123456789',
            xmtpAvailable: false,
            inviteSent: false,
            addedAt: Date.now() - 864000000 // 10 days ago
          },
          {
            id: '11',
            name: 'Kate Winslet',
            address: '0xb234567890123456789012345678901234567890',
            xmtpAvailable: true,
            inviteSent: true,
            addedAt: Date.now() - 950400000 // 11 days ago
          },
          {
            id: '12',
            name: 'Leo DiCaprio',
            address: '0xc345678901234567890123456789012345678901',
            xmtpAvailable: true,
            inviteSent: true,
            addedAt: Date.now() - 1036800000 // 12 days ago
          }
        ];
        setFriends(placeholderFriends);
        
        // Initialize placeholder messages for each friend
        const initialMessages: {[friendId: string]: Message[]} = {};
        placeholderFriends.forEach(friend => {
          initialMessages[friend.id] = [
            {
              id: `welcome-${friend.id}`,
              content: `Hey! This is your chat with ${friend.name}. Start a conversation! 🎉`,
              sender: 'system',
              timestamp: new Date()
            }
          ];
        });
        setFriendMessages(initialMessages);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      // Fallback to localStorage
      try {
        const savedFriends = localStorage.getItem('streakpet-friends');
        if (savedFriends) {
          setFriends(JSON.parse(savedFriends));
        }
      } catch (localError) {
        console.error('Error loading friends from localStorage:', localError);
      }
    }
  };

  // Count words in the message
  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Auto-resize textarea to expand upward
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the actual scroll height
      textarea.style.height = 'auto';
      const maxHeight = 120; // Maximum height in pixels (about 5 lines)
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      
      // Set the new height
      textarea.style.height = newHeight + 'px';
      
      // Calculate the difference in height to adjust container position
      const heightDiff = newHeight - 40; // 40px is the minimum height
      
      // Apply negative margin to move the container upward as it expands
      const container = textarea.closest('.flex.flex-col.space-y-2.mt-auto') as HTMLElement;
      if (container && heightDiff > 0) {
        container.style.transform = `translateY(-${heightDiff}px)`;
      } else if (container) {
        container.style.transform = 'translateY(0px)';
      }
    }
  };

  // Handle message change with word limit
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const wordCount = getWordCount(text);
    
    if (wordCount <= 100) {
      setNewMessage(text);
      setTimeout(autoResize, 0); // Delay to ensure DOM update
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = newMessage;
    setNewMessage('');
    setIsLoading(true);

    // Reset textarea height after sending
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 0);

    try {
      // Get userId from localStorage or session
      const userId = localStorage.getItem('userId') || pet.petWalletAddress;
      
      // Save user message to database
      if (userId && pet.id) {
        try {
          await fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              petId: pet.id,
              sender: 'user',
              content: messageToSend,
              metadata: {}
            })
          });
        } catch (dbError) {
          console.error('Error saving user message to database:', dbError);
        }
      }

      // Generate AI response via API route (secure - keeps API key on server)
      let aiResponse = '';
      try {
        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userMessage: messageToSend,
            petId: pet.id,
            petStage: pet.stage,
            petStats: pet.stats
          })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        aiResponse = data.response || "I'm here for you! 🐾";
      } catch (apiError) {
        console.error('Error getting AI response:', apiError);
        // Fallback response if API fails
        aiResponse = `*${pet.name} nuzzles you* I'm having trouble thinking right now, but I'm always here with you! 💕`;
      }
      
      const petMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'pet',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, petMessage]);

      // Save pet message to database
      if (userId && pet.id) {
        try {
          await fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              petId: pet.id,
              sender: 'pet',
              content: aiResponse,
              metadata: {
                mood: pet.mood,
                xpGained: 0
              }
            })
          });
        } catch (dbError) {
          console.error('Error saving pet message to database:', dbError);
        }
      }
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble responding right now. Try again later!",
        sender: 'pet',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Allow Shift+Enter for new lines
  };

  const Navigation = () => (
    <div className="flex space-x-1 sm:space-x-2 mb-3 sm:mb-4">
      {(['chat', 'friends', 'settings'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
            activeTab === tab
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'text-white/60 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          {tab === 'chat' && '💬 Chat'}
          {tab === 'friends' && '👥 Friends'}
          {tab === 'settings' && '⚙️ Settings'}
        </button>
      ))}
    </div>
  );

  const renderChatContent = () => (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div 
        className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 mb-3 sm:mb-4 pr-1"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
          maxHeight: 'calc(100% - 80px)', // Height relative to container minus input area
          minHeight: '120px' // Ensure minimum scrollable area
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}</style>
        {isLoadingHistory ? (
          <div className="flex justify-center items-center h-full">
            <div className="bg-white/10 text-white p-3 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id || message._id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <p className="text-xs break-words">{message.content || message.text}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-white p-2 sm:p-3 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex flex-col space-y-2 flex-shrink-0 transition-transform duration-200 ease-out">
        <div className="flex items-end space-x-1 sm:space-x-2">
          <div className="flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleMessageChange}
              onKeyDown={handleKeyPress}
              placeholder={`Chat with ${pet.name}...`}
              className="w-full bg-white/10 text-white placeholder-white/50 px-3 sm:px-4 py-2 rounded-xl border border-white/20 focus:outline-none focus:border-white/40 text-sm resize-none overflow-y-auto min-h-[40px] max-h-[120px] leading-5"
              disabled={isLoading}
              rows={1}
              style={{ 
                height: 'auto',
                minHeight: '40px',
                maxHeight: '120px'
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 sm:px-4 py-2 rounded-xl hover:from-purple-400 hover:to-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0 h-[40px] flex items-center justify-center"
          >
            Send
          </button>
        </div>
        
        {/* Word Counter */}
        <div className="flex justify-between items-center text-xs text-white/60 px-1">
          <span>Shift+Enter for new line</span>
          <span className={`${getWordCount(newMessage) > 90 ? 'text-yellow-400' : ''} ${getWordCount(newMessage) >= 100 ? 'text-red-400' : ''}`}>
            {getWordCount(newMessage)}/100 words
          </span>
        </div>
      </div>
    </div>
  );

  const FriendsContent = () => {
    // If a friend is selected, show individual chat
    if (selectedFriend) {
      return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Friend Chat Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedFriend(null)}
                className="text-white/60 hover:text-white transition-colors text-[11px]"
              >
                ← Back
              </button>
              <div className={`w-2 h-2 rounded-full ${
                selectedFriend.xmtpAvailable ? 'bg-green-400' : 'bg-gray-400'
              }`} />
              <div>
                <h3 className="text-white font-bold text-[11px]">
                  {selectedFriend.name || `${selectedFriend.address.slice(0, 6)}...${selectedFriend.address.slice(-4)}`}
                </h3>
                <p className="text-white/60 text-xs">
                  {selectedFriend.xmtpAvailable ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>

          {/* Friend Chat Messages */}
          <div 
            className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
              maxHeight: 'calc(100% - 100px)', // Height relative to container minus header and input area
              minHeight: '100px' // Ensure minimum scrollable area
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                width: 6px;
              }
              div::-webkit-scrollbar-track {
                background: transparent;
              }
              div::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.5);
              }
            `}</style>
            {(friendMessages[selectedFriend.id] || []).map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-2 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                      : message.sender === 'system'
                      ? 'bg-white/5 text-white/70 border border-white/10'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <p className="text-xs break-words">{message.text || message.content}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Friend Chat Input */}
          <div className="flex-shrink-0">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder={`Message ${selectedFriend.name || 'friend'}...`}
                className="flex-1 bg-white/10 text-white placeholder-white/50 px-3 py-2 rounded-xl border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    if (input.value.trim()) {
                      const newMsg: Message = {
                        id: Date.now().toString(),
                        content: input.value,
                        sender: 'user',
                        timestamp: new Date()
                      };
                      setFriendMessages(prev => ({
                        ...prev,
                        [selectedFriend.id]: [...(prev[selectedFriend.id] || []), newMsg]
                      }));
                      input.value = '';
                    }
                  }
                }}
              />
              <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-2 rounded-xl text-sm flex-shrink-0">
                Send
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Default friends list view
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header with Invite Button */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">👥</div>
            <div>
              <h3 className="text-white font-bold text-sm">Friends</h3>
              <p className="text-white/60 text-xs">{friends.length} friends</p>
            </div>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:shadow-lg transition-all"
          >
            Invite Friends
          </button>
        </div>

        {/* Friends List */}
        <div 
          className="flex-1 overflow-y-auto space-y-2 pr-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
            maxHeight: 'calc(100% - 60px)', // Height relative to container minus header
            minHeight: '120px' // Ensure minimum scrollable area
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 6px;
            }
            div::-webkit-scrollbar-track {
              background: transparent;
            }
            div::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.3);
              border-radius: 3px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.5);
            }
          `}</style>
          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div className="text-3xl mb-2 opacity-50">👥</div>
              <p className="text-white/60 text-xs mb-1">No friends yet</p>
              <p className="text-white/40 text-xs">Invite friends to get started!</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20 cursor-pointer hover:bg-white/15 transition-all flex-shrink-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      friend.xmtpAvailable ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-white text-xs font-medium">
                        {friend.name || `${friend.address.slice(0, 6)}...${friend.address.slice(-4)}`}
                      </p>
                      <p className="text-white/50 text-xs">
                        {friend.xmtpAvailable ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {friend.inviteSent && (
                      <div className="text-green-400 text-xs">✓</div>
                    )}
                    <div className="text-white/40 text-xs">→</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const SettingsContent = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="text-4xl mb-4">⚙️</div>
      <h3 className="text-white font-bold mb-2">Settings</h3>
      <p className="text-white/60 text-sm">Customize your StreakPet experience</p>
      <p className="text-white/40 text-xs mt-2">Coming soon...</p>
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return renderChatContent();
      case 'friends':
        return <FriendsContent />;
      case 'settings':
        return <SettingsContent />;
      default:
        return renderChatContent();
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 p-3 sm:p-4 h-[257px] sm:h-[322px] flex flex-col">
      <Navigation />
      {renderContent()}
      
      {/* Invite Friends Modal */}
      <InviteFriendsModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        petName={pet.name}
        userAddress={pet.petWalletAddress}
        onSendXMTPInvite={async (address: string, message: string) => {
          // Placeholder for XMTP integration
          console.log('Sending XMTP invite to:', address, 'Message:', message);
          return true;
        }}
        onCheckXMTPAvailability={async (address: string) => {
          // Placeholder for XMTP availability check
          console.log('Checking XMTP availability for:', address);
          return Math.random() > 0.5; // Random for demo
        }}
      />
    </div>
  );
}