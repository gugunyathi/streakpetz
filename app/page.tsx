'use client';

import React, { useState, useEffect } from 'react';
import PetDisplay from '@/components/PetDisplay';
import { Pet, PetStage, createPet, updatePetAfterInteraction } from '@/lib/pet';

export default function Home() {
  const [pet, setPet] = useState<Pet | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');

  // Initialize pet on component mount
  useEffect(() => {
    // For demo purposes, create a default pet
    // In production, this would check if user has an existing pet
    const defaultPet = createPet('StreakPet', 'pet_wallet_123', 'user_wallet_456');
    setPet(defaultPet);
    setWalletAddress('0x60Dd...363C');
    setIsConnected(true);
  }, []);

  const handlePetInteraction = (action: string) => {
    if (!pet) return;
    
    const updatedPet = updatePetAfterInteraction(pet, action);
    setPet(updatedPet);
    
    // Here you would also:
    // 1. Send XMTP message to pet wallet
    // 2. Update pet state in backend
    // 3. Trigger AI response
    console.log(`Pet interaction: ${action}, XP gained!`);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress('');
  };

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-200 via-pink-200 to-purple-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading your StreakPet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-200 via-pink-200 to-purple-300">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-white/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🐣</div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">StreakPet Chat</h1>
            <p className="text-sm text-gray-600">Your digital companion</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isConnected && (
            <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-800">{walletAddress}</span>
              <button
                onClick={handleDisconnect}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Disconnect
              </button>
            </div>
          )}
          
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full text-sm transition-colors">
            Solo Mode
          </button>
          
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-colors">
            👥 Invite Friends
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Pet Display */}
          <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-6 mb-6">
            <PetDisplay pet={pet} onInteraction={handlePetInteraction} />
          </div>

          {/* Chat Interface */}
          <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="text-pink-600">💕</div>
              <span className="mx-2 text-gray-600">0 messages</span>
            </div>
            
            <div className="bg-white/50 rounded-2xl p-4 mb-4 min-h-[200px] flex items-center justify-center">
              <p className="text-gray-500 text-center">
                Start chatting with your {pet.name}!<br />
                <span className="text-sm">Your pet will respond with AI-powered messages</span>
              </p>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Chat with your StreakPet..."
                className="flex-1 bg-white/70 rounded-full px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full transition-colors">
                ✈️
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <button
              onClick={() => handlePetInteraction('play')}
              className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/40 transition-colors"
            >
              <div className="text-2xl mb-2">🎾</div>
              <div className="text-sm font-medium text-gray-700">Play</div>
            </button>
            
            <button
              onClick={() => handlePetInteraction('groom')}
              className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/40 transition-colors"
            >
              <div className="text-2xl mb-2">✨</div>
              <div className="text-sm font-medium text-gray-700">Groom</div>
            </button>
            
            <button
              onClick={() => handlePetInteraction('feed')}
              className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/40 transition-colors"
            >
              <div className="text-2xl mb-2">📚</div>
              <div className="text-sm font-medium text-gray-700">Read</div>
            </button>
            
            <button className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 text-center hover:bg-white/40 transition-colors">
              <div className="text-2xl mb-2">🏪</div>
              <div className="text-sm font-medium text-gray-700">Store</div>
            </button>
          </div>

          {/* Bottom Stats */}
          <div className="mt-6 text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 inline-block">
              <span className="text-sm text-gray-700">XP: {pet.xp}/100</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
