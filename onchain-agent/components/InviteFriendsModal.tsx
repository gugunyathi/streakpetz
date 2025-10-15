'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Share2, Copy, Check, UserPlus, Trash2, MessageCircle, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';
import { ApiService, Friend } from '@/lib/api';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  petName?: string;
  userAddress?: string;
  onSendXMTPInvite?: (address: string, message: string) => Promise<boolean>;
  onCheckXMTPAvailability?: (address: string) => Promise<boolean>;
}

const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({
  isOpen,
  onClose,
  petName = 'StreakPet',
  userAddress,
  onSendXMTPInvite,
  onCheckXMTPAvailability
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'share'>('direct');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newFriendAddress, setNewFriendAddress] = useState('');
  const [newFriendName, setNewFriendName] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const [sendingInvites, setSendingInvites] = useState<Set<string>>(new Set());
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendsError, setFriendsError] = useState('');

  const apiService = new ApiService();

  // Load friends from API on mount
  useEffect(() => {
    if (isOpen) {
      loadFriends();
      
      // Generate invite link
      const baseUrl = window.location.origin;
      const inviteCode = userAddress ? userAddress.slice(2, 12) : 'guest';
      const link = `${baseUrl}?invite=${inviteCode}&pet=${encodeURIComponent(petName)}`;
      setInviteLink(link);
      
      // Set default custom message
      setCustomMessage(`Let's chat and grow our pets together! You can see my pet's progress and we can share tips. 🌟\n\nJoin here: ${link}`);
    }
  }, [isOpen, userAddress, petName]);

  // Load friends from API
  const loadFriends = async () => {
    setIsLoadingFriends(true);
    setFriendsError('');
    
    try {
      const response = await apiService.friends.getAll();
      if (response.success && response.data) {
        setFriends(response.data);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriendsError('Failed to load friends');
      
      // Fallback to localStorage for backward compatibility
      try {
        const savedFriends = localStorage.getItem('streakpet-friends');
        if (savedFriends) {
          setFriends(JSON.parse(savedFriends));
        }
      } catch (localError) {
        console.error('Error loading friends from localStorage:', localError);
      }
    } finally {
      setIsLoadingFriends(false);
    }
  };

  // Validate Ethereum address
  const validateAddress = (address: string): boolean => {
    try {
      // For ethers v5, use utils.isAddress
      return ethers.utils.isAddress(address);
    } catch {
      return false;
    }
  };

  // Add new friend
  const addFriend = async () => {
    if (!newFriendAddress.trim()) {
      setAddressError('Please enter an Ethereum address');
      return;
    }

    if (!validateAddress(newFriendAddress)) {
      setAddressError('Please enter a valid Ethereum address');
      return;
    }

    // Check if friend already exists
    if (friends.some(f => f.address.toLowerCase() === newFriendAddress.toLowerCase())) {
      setAddressError('This friend is already in your list');
      return;
    }

    setIsAddingFriend(true);
    setAddressError('');

    try {
      // Check XMTP availability
      const xmtpAvailable = onCheckXMTPAvailability 
        ? await onCheckXMTPAvailability(newFriendAddress)
        : false;

      // Add friend via API
      const response = await apiService.friends.add({
        address: newFriendAddress,
        name: newFriendName.trim() || undefined,
        xmtpAvailable,
        inviteSent: false
      });

      if (response.success && response.data) {
        // Update local state
        const updatedFriends = [...friends, response.data];
        setFriends(updatedFriends);
        
        // Also save to localStorage for backward compatibility
        localStorage.setItem('streakpet-friends', JSON.stringify(updatedFriends));
        
        setNewFriendAddress('');
        setNewFriendName('');
      } else {
        setAddressError(response.error || 'Failed to add friend');
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      setAddressError('Error adding friend. Please try again.');
    } finally {
      setIsAddingFriend(false);
    }
  };

  // Remove friend
  const removeFriend = async (friendId: string) => {
    try {
      const response = await apiService.friends.remove(friendId);
      
      if (response.success) {
        const updatedFriends = friends.filter(f => f.id !== friendId);
        setFriends(updatedFriends);
        
        // Also update localStorage for backward compatibility
        localStorage.setItem('streakpet-friends', JSON.stringify(updatedFriends));
      } else {
        console.error('Failed to remove friend:', response.error);
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  // Send XMTP invitation
  const sendXMTPInvitation = async (friend: Friend) => {
    if (!onSendXMTPInvite) return;

    setSendingInvites(prev => new Set(prev).add(friend.id));

    try {
      const message = `Hey! I'd love to share my StreakPet journey with you. Join me at ${inviteLink} and let's grow our pets together! 🐾`;
      const success = await onSendXMTPInvite(friend.address, message);
      
      if (success) {
        // Update friend's invite status via API
        const response = await apiService.friends.update(friend.id, {
          ...friend,
          inviteSent: true
        });

        if (response.success && response.data) {
          const updatedFriends = friends.map(f => 
            f.id === friend.id ? response.data! : f
          );
          setFriends(updatedFriends);
          
          // Also update localStorage for backward compatibility
          localStorage.setItem('streakpet-friends', JSON.stringify(updatedFriends));
        }
      }
    } catch (error) {
      console.error('Error sending XMTP invitation:', error);
    } finally {
      setSendingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.id);
        return newSet;
      });
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Share invite
  const shareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on StreakPet!',
          text: customMessage,
          url: inviteLink,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to copying to clipboard
        copyToClipboard(customMessage);
      }
    } else {
      // Fallback to copying to clipboard
      copyToClipboard(customMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center space-x-3">
              <Users size={24} />
              <div>
                <h2 className="text-xl font-bold">Invite Friends</h2>
                <p className="text-white/80 text-sm">Share the StreakPet fun!</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === 'direct'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <UserPlus size={16} />
              <span>Direct Invite</span>
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                activeTab === 'share'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <Share2 size={16} />
              <span>Share Link</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'direct' && (
              <div className="space-y-6">
                {/* Add Friend Form */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <UserPlus size={18} className="text-purple-600" />
                    <h3 className="font-semibold text-gray-800">Add Friend</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Ethereum address (0x...)"
                        value={newFriendAddress}
                        onChange={(e) => setNewFriendAddress(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        placeholder="Friend's name (optional)"
                        value={newFriendName}
                        onChange={(e) => setNewFriendName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    {addressError && (
                      <p className="text-red-500 text-sm">{addressError}</p>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addFriend}
                      disabled={isAddingFriend}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isAddingFriend ? 'Adding...' : 'Add Friend'}
                    </motion.button>
                  </div>
                </div>

                {/* Friends List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Users size={18} className="text-purple-600" />
                      <h3 className="font-semibold text-gray-800">Your Friends</h3>
                    </div>
                    <span className="text-sm text-gray-500">{friends.length} friends</span>
                  </div>
                  
                  {friendsError && (
                    <div className="text-red-500 text-sm mb-3 p-3 bg-red-50 rounded-lg">
                      {friendsError}
                    </div>
                  )}
                  
                  {isLoadingFriends ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <span className="ml-2 text-gray-600">Loading friends...</span>
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No friends added yet</p>
                      <p className="text-sm">Add friends to start chatting!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friends.map((friend) => (
                        <motion.div
                          key={friend.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              friend.xmtpAvailable ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <div>
                              <p className="font-medium text-gray-800">
                                {friend.name || `${friend.address.slice(0, 6)}...${friend.address.slice(-4)}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {friend.xmtpAvailable ? 'XMTP Ready' : 'XMTP Not Available'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {friend.xmtpAvailable && !friend.inviteSent && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => sendXMTPInvitation(friend)}
                                disabled={sendingInvites.has(friend.id)}
                                className="p-2 text-purple-600 hover:bg-purple-100 rounded-full transition-colors disabled:opacity-50"
                              >
                                <MessageCircle size={16} />
                              </motion.button>
                            )}
                            
                            {friend.inviteSent && (
                              <div className="p-2 text-green-600">
                                <Check size={16} />
                              </div>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => removeFriend(friend.id)}
                              className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'share' && (
              <div className="space-y-6">
                {/* Customize Message */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <MessageCircle size={18} className="text-purple-600" />
                    <h3 className="font-semibold text-gray-800">Customize Invite Message</h3>
                  </div>
                  
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Share Options */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Share2 size={18} className="text-purple-600" />
                    <h3 className="font-semibold text-gray-800">Share Options</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={shareInvite}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      <Share2 size={16} />
                      <span>Share</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => copyToClipboard(inviteLink)}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
                    </motion.button>
                  </div>
                </div>

                {/* Invite Link Display */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Your invite link:</h3>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 break-all">{inviteLink}</p>
                  </div>
                </div>

                {/* Success Messages */}
                <AnimatePresence>
                  {shareSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg"
                    >
                      <Check size={16} />
                      <span className="text-sm">Invite shared successfully!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InviteFriendsModal;