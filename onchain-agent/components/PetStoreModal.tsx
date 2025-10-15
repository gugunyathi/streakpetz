'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Star, Sparkles, Heart, Zap, Wallet } from 'lucide-react';
import BasePayButton from './BasePayButton';
import { Pet, PetMood } from '@/lib/pet';
import { getWalletUSDCBalance } from '@/lib/wallet';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number; // in USDC cents
  category: 'food' | 'clothing' | 'accessories' | 'toys' | 'furniture' | 'consumables';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image: string;
  effects?: {
    experienceBoost?: number;
    moodBoost?: string;
    levelRequirement?: number;
  };
  inStock: boolean;
  limitedEdition?: boolean;
  expiresAt?: Date;
  featured?: boolean;
}

interface PetStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet;
  userWalletAddress: string;
  onPurchaseComplete: (updatedPet: Pet) => void;
}

const PetStoreModal: React.FC<PetStoreModalProps> = ({
  isOpen,
  onClose,
  pet,
  userWalletAddress,
  onPurchaseComplete
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Fetch wallet balance when modal opens
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!isOpen || !userWalletAddress) return;
      
      setIsLoadingBalance(true);
      setBalanceError(null);
      
      try {
        const response = await fetch('/api/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'getBalance',
            walletAddress: userWalletAddress,
            asset: 'USDC'
          }),
        });
        
        const data = await response.json();
        if (data.success) {
          // Convert balance string to cents (multiply by 100)
          const balanceInDollars = parseFloat(data.balance || '0.00');
          const balanceInCents = Math.round(balanceInDollars * 100);
          setWalletBalance(balanceInCents);
        } else {
          console.warn('Failed to fetch USDC balance:', data.error);
          setBalanceError(data.error || 'Failed to load balance');
          setWalletBalance(0);
        }
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
        setBalanceError('Failed to load balance');
        setWalletBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchWalletBalance();
  }, [isOpen, userWalletAddress]);

  // Mock store items - in production, these would come from the PetStore class
  const storeItems: StoreItem[] = [
    {
      id: 'premium_food',
      name: 'Premium Pet Food',
      description: 'Delicious gourmet food that boosts your pet\'s happiness and experience',
      price: 50, // 50 cents
      category: 'food',
      rarity: 'common',
      image: '🥩',
      effects: {
        experienceBoost: 25,
        moodBoost: 'happy'
      },
      inStock: true,
      featured: true
    },
    {
      id: 'golden_collar',
      name: 'Golden Collar',
      description: 'A shiny golden collar that makes your pet look distinguished',
      price: 200,
      category: 'accessories',
      rarity: 'rare',
      image: '👑',
      effects: {
        experienceBoost: 10
      },
      inStock: true
    },
    {
      id: 'magic_toy',
      name: 'Magic Toy',
      description: 'A mystical toy that provides endless entertainment',
      price: 150,
      category: 'toys',
      rarity: 'epic',
      image: '🪄',
      effects: {
        experienceBoost: 30,
        moodBoost: 'playful'
      },
      inStock: true,
      featured: true
    },
    {
      id: 'cozy_bed',
      name: 'Cozy Pet Bed',
      description: 'A comfortable bed for your pet to rest and recover',
      price: 100,
      category: 'furniture',
      rarity: 'common',
      image: '🛏️',
      effects: {
        moodBoost: 'sleepy'
      },
      inStock: true
    },
    {
      id: 'energy_potion',
      name: 'Energy Potion',
      description: 'A magical potion that instantly boosts your pet\'s energy',
      price: 75,
      category: 'consumables',
      rarity: 'rare',
      image: '🧪',
      effects: {
        experienceBoost: 50
      },
      inStock: true,
      limitedEdition: true
    },
    {
      id: 'royal_outfit',
      name: 'Royal Outfit',
      description: 'Dress your pet like royalty with this elegant outfit',
      price: 300,
      category: 'clothing',
      rarity: 'legendary',
      image: '👗',
      effects: {
        experienceBoost: 40,
        moodBoost: 'excited',
        levelRequirement: 10
      },
      inStock: true,
      featured: true
    }
  ];

  const categories = [
    { id: 'all', name: 'All Items', icon: '🛍️' },
    { id: 'food', name: 'Food', icon: '🍖' },
    { id: 'clothing', name: 'Clothing', icon: '👕' },
    { id: 'accessories', name: 'Accessories', icon: '💎' },
    { id: 'toys', name: 'Toys', icon: '🎾' },
    { id: 'furniture', name: 'Furniture', icon: '🪑' },
    { id: 'consumables', name: 'Consumables', icon: '🧪' }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? storeItems 
    : storeItems.filter(item => item.category === selectedCategory);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'rare': return 'border-blue-300';
      case 'epic': return 'border-purple-300';
      case 'legendary': return 'border-yellow-300';
      default: return 'border-gray-300';
    }
  };

  const handlePurchase = async (item: StoreItem) => {
    setIsLoading(true);
    try {
      // Simulate purchase logic - in production, this would call the PetStore service
      console.log('Purchasing item:', item.name, 'for pet:', pet.name);
      
      // Apply item effects to pet
      const updatedPet = { ...pet };
      if (item.effects?.experienceBoost) {
        updatedPet.xp += item.effects.experienceBoost;
      }
      if (item.effects?.moodBoost) {
        updatedPet.mood = item.effects.moodBoost as PetMood;
      }
      
      // Call the completion handler with updated pet
      onPurchaseComplete(updatedPet);
      setSelectedItem(null);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-full">
                  <ShoppingCart className="w-4 h-4 sm:w-5 md:w-6 sm:h-5 md:h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Pet Store</h2>
                  <p className="text-xs sm:text-sm text-white/80 hidden sm:block">Spoil your StreakPet with amazing items!</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <Wallet className="w-3 h-3 text-white/80" />
                    <p className="text-xs text-white/80">USDC Balance</p>
                  </div>
                  {isLoadingBalance ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-4 bg-white/20 rounded animate-pulse"></div>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  ) : balanceError ? (
                    <div className="text-right">
                      <p className="text-sm sm:text-lg font-bold text-red-300">Error</p>
                      <p className="text-xs text-white/60 truncate max-w-[120px]" title={balanceError}>
                        {balanceError}
                      </p>
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="text-sm sm:text-lg font-bold">${(walletBalance / 100).toFixed(2)}</p>
                      <p className="text-xs text-white/60">
                        {walletBalance >= 100 ? '✅ Ready to shop' : '⚠️ Low balance'}
                      </p>
                    </div>
                  )}
                  {userWalletAddress && (
                    <p className="text-xs text-white/60 truncate max-w-[100px] mt-1">
                      {userWalletAddress.slice(0, 6)}...{userWalletAddress.slice(-4)}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 md:w-6 sm:h-5 md:h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="p-2 sm:p-3 border-b border-gray-200">
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full whitespace-nowrap transition-all text-xs flex-shrink-0 ${
                    selectedCategory === category.id
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xs">{category.icon}</span>
                  <span className="font-medium text-xs">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Store Items Grid */}
          <div className="p-3 sm:p-4 overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(95vh - 180px)' }}>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white border-2 ${getRarityBorder(item.rarity)} rounded-xl p-3 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden min-h-[200px] flex flex-col`}
                  onClick={() => setSelectedItem(item)}
                >
                  {item.featured && (
                    <div className="absolute top-2 right-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    </div>
                  )}
                  
                  {item.limitedEdition && (
                    <div className="absolute top-2 left-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                    </div>
                  )}

                  <div className="text-center mb-3 flex-shrink-0">
                    <div className="text-3xl mb-2">{item.image}</div>
                    <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="space-y-2 flex-grow">
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(item.rarity)}`}>
                      {item.rarity.toUpperCase()}
                    </div>
                    
                    {item.effects && (
                      <div className="flex flex-wrap gap-1">
                        {item.effects.experienceBoost && (
                          <div className="flex items-center space-x-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            <Zap className="w-3 h-3" />
                            <span>+{item.effects.experienceBoost} XP</span>
                          </div>
                        )}
                        {item.effects.moodBoost && (
                          <div className="flex items-center space-x-1 text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                            <Heart className="w-3 h-3" />
                            <span>{item.effects.moodBoost}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-100">
                    <span className="text-sm font-bold text-purple-600">
                      ${(item.price / 100).toFixed(2)}
                    </span>
                    {item.inStock ? (
                       <BasePayButton
                         amount={item.price}
                         walletAddress={userWalletAddress}
                         recipientAddress="0x226710d13E6c16f1c99F34649526bD3bF17cd010"
                         network="base-sepolia"
                         onPaymentSuccess={(paymentId: string) => {
                           console.log('Gas-free payment successful:', paymentId);
                           // Show success notification
                           alert(`Payment successful! Transaction ID: ${paymentId.substring(0, 10)}...`);
                           handlePurchase(item);
                         }}
                         onPaymentError={(error: string) => {
                           console.error('Gas-free payment failed:', error);
                           // Show detailed error message
                           alert(`Payment failed: ${error}`);
                         }}
                         className="px-2.5 py-1 text-xs font-medium rounded-md"
                       />
                     ) : (
                      <button
                        disabled
                        className="px-2.5 py-1 bg-gray-400 text-white rounded-md text-xs font-medium cursor-not-allowed"
                      >
                        Out
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Item Detail Modal */}
          <AnimatePresence>
            {selectedItem && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4"
                onClick={() => setSelectedItem(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-xl p-3 sm:p-4 md:p-6 max-w-[90vw] sm:max-w-md w-full max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-3 sm:mb-4">
                    <div className="text-4xl sm:text-5xl md:text-6xl mb-2 sm:mb-3">{selectedItem.image}</div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800">{selectedItem.name}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">{selectedItem.description}</p>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <div className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getRarityColor(selectedItem.rarity)}`}>
                      {selectedItem.rarity.toUpperCase()}
                    </div>

                    {selectedItem.effects && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-800 text-sm sm:text-base">Effects:</h4>
                        {selectedItem.effects.experienceBoost && (
                          <div className="flex items-center space-x-2 text-xs sm:text-sm">
                            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                            <span>+{selectedItem.effects.experienceBoost} Experience Points</span>
                          </div>
                        )}
                        {selectedItem.effects.moodBoost && (
                          <div className="flex items-center space-x-2 text-xs sm:text-sm">
                            <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500" />
                            <span>Mood: {selectedItem.effects.moodBoost}</span>
                          </div>
                        )}
                        {selectedItem.effects.levelRequirement && (
                          <div className="text-xs sm:text-sm text-orange-600">
                            Requires Level {selectedItem.effects.levelRequirement}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t">
                       <span className="text-xl sm:text-2xl font-bold text-purple-600">
                         ${(selectedItem.price / 100).toFixed(2)}
                       </span>
                       <div className="space-x-2">
                         <button
                           onClick={() => setSelectedItem(null)}
                           className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                         >
                           Cancel
                         </button>
                         {selectedItem.inStock ? (
                           <BasePayButton
                           amount={selectedItem.price}
                           walletAddress={userWalletAddress}
                           recipientAddress="0x226710d13E6c16f1c99F34649526bD3bF17cd010"
                           network="base-sepolia"
                           onPaymentSuccess={(paymentId: string) => {
                             console.log('Gas-free payment successful:', paymentId);
                             handlePurchase(selectedItem);
                           }}
                           onPaymentError={(error: string) => {
                             console.error('Gas-free payment failed:', error);
                             alert('Payment failed. Please try again.');
                           }}
                           className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-lg"
                         />
                         ) : (
                           <button
                             disabled
                             className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm"
                           >
                             Out of Stock
                           </button>
                         )}
                       </div>
                     </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PetStoreModal;