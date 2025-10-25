'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Star, Sparkles, Heart, Zap, Wallet, Lock, CheckCircle } from 'lucide-react';
import BasePayButton from './BasePayButton';
import { Pet, PetMood, PetStage } from '@/lib/pet';
import { getWalletUSDCBalance } from '@/lib/wallet';
import { PetStore, StoreItem, UserInventory } from '@/lib/pet-store';

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
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [userInventory, setUserInventory] = useState<UserInventory | null>(null);
  const [evolutionRequirements, setEvolutionRequirements] = useState<any>(null);
  const [showEvolutionTab, setShowEvolutionTab] = useState(false);

  // Initialize PetStore instance
  const petStore = new PetStore();

  // Fetch wallet balance and store data when modal opens
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!userWalletAddress) {
        setBalanceError('No wallet address provided');
        return;
      }

      setIsLoadingBalance(true);
      setBalanceError(null);

      try {
        const result = await getWalletUSDCBalance(userWalletAddress);
        setWalletBalance(result.balance);
        if (result.error) {
          setBalanceError(result.error);
        }
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
        setBalanceError('Failed to fetch balance');
        setWalletBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    const fetchStoreData = async () => {
      try {
        // Get all store items
        const items = petStore.getStoreItems();
        setStoreItems(items);

        // Get user inventory
        const inventory = await petStore.getUserInventory(userWalletAddress);
        setUserInventory(inventory);

        // Get evolution requirements for current stage
        const requirements = petStore.getEvolutionRequirements();
        setEvolutionRequirements(requirements);

        // Check if pet can evolve to show evolution tab
        const canEvolve = petStore.canEvolveFromStage(userWalletAddress, pet.stage);
        setShowEvolutionTab(canEvolve || pet.stage !== PetStage.UNICORN);
      } catch (error) {
        console.error('Failed to fetch store data:', error);
      }
    };

    if (isOpen && userWalletAddress) {
      fetchWalletBalance();
      fetchStoreData();
    }
  }, [isOpen, userWalletAddress, pet.stage]);

  const categories = [
    { id: 'all', name: 'All Items', icon: '🛍️' },
    { id: 'evolution', name: 'Evolution', icon: '⭐' },
    { id: 'food', name: 'Food', icon: '🍖' },
    { id: 'clothing', name: 'Clothing', icon: '👕' },
    { id: 'accessories', name: 'Accessories', icon: '💎' },
    { id: 'toys', name: 'Toys', icon: '🎾' },
    { id: 'furniture', name: 'Furniture', icon: '🪑' },
    { id: 'consumables', name: 'Consumables', icon: '🧪' }
  ];

  const getFilteredItems = () => {
    if (selectedCategory === 'all') {
      return storeItems;
    } else if (selectedCategory === 'evolution') {
      return petStore.getEvolutionItemsForStage(pet.stage);
    } else {
      return storeItems.filter(item => item.category === selectedCategory);
    }
  };

  const filteredItems = getFilteredItems();

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
      console.log('Purchasing item:', item.name, 'for pet:', pet.name);
      
      // Use PetStore to handle the purchase
      const purchaseResult = await petStore.purchaseItem({
        userId: userWalletAddress,
        petId: pet.id,
        itemId: item.id,
        quantity: 1,
        paymentMethod: 'usdc',
        walletAddress: userWalletAddress
      });
      
      if (purchaseResult.success) {
        // Apply item effects to pet
        const updatedPet = { ...pet };
        if (item.effects?.experienceBoost) {
          updatedPet.xp += item.effects.experienceBoost;
        }
        if (item.effects?.moodBoost) {
          updatedPet.mood = item.effects.moodBoost as PetMood;
        }

        // Check if this was an evolution item purchase and if pet can now evolve
        if (item.evolutionItem) {
          const canEvolve = petStore.canEvolveFromStage(userWalletAddress, pet.stage);
          if (canEvolve) {
            // Calculate new stage based on XP and evolution requirements
            const currentXP = updatedPet.xp;
            let newStage = pet.stage;
            
            // Determine next stage based on current stage
            if (pet.stage === PetStage.EGG && currentXP >= 50) {
              newStage = PetStage.HATCHLING;
            } else if (pet.stage === PetStage.HATCHLING && currentXP >= 200) {
              newStage = PetStage.TEEN;
            } else if (pet.stage === PetStage.TEEN && currentXP >= 500) {
              newStage = PetStage.ADULT;
            } else if (pet.stage === PetStage.ADULT && currentXP >= 1000) {
              newStage = PetStage.UNICORN;
            }
            
            if (newStage !== pet.stage) {
              // Update pet stage
              updatedPet.stage = newStage;
              
              // Consume evolution items
              await petStore.consumeEvolutionItems(userWalletAddress, pet.stage);
              alert(`🎉 Congratulations! ${pet.name} evolved to ${newStage}!`);
            }
          }
        }
        
        // Update inventory state
        const newInventory = await petStore.getUserInventory(userWalletAddress);
        setUserInventory(newInventory);
        
        // Call the completion handler with updated pet
        onPurchaseComplete(updatedPet);
        setSelectedItem(null);
        
        alert(`Successfully purchased ${item.name}!`);
      } else {
        alert(`Purchase failed: ${purchaseResult.error}`);
      }
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
            <div className="relative">
              <div className="flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100 pb-2 scroll-smooth">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-full whitespace-nowrap transition-all text-sm flex-shrink-0 min-w-fit ${
                      selectedCategory === category.id
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-300 shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-sm">{category.icon}</span>
                    <span className="font-medium text-sm">{category.name}</span>
                  </button>
                ))}
              </div>
              {/* Gradient fade indicators for scrollable content */}
              <div className="absolute left-0 top-0 bottom-2 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-2 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
            </div>
          </div>

          {/* Store Items Grid */}
          <div className="p-3 sm:p-4 overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(95vh - 180px)' }}>
            {/* Evolution Requirements Section */}
            {selectedCategory === 'evolution' && (
              <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <h3 className="font-bold text-purple-800 mb-2 flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Evolution Requirements for {pet.stage}
                </h3>
                <p className="text-sm text-purple-700 mb-2">
                  {pet.stage === PetStage.UNICORN 
                    ? "Your pet has reached the final stage! Purchase items to maintain its magical powers."
                    : `Purchase all required items to evolve your pet to the next stage.`
                  }
                </p>
                {evolutionRequirements && evolutionRequirements[pet.stage] && (
                  <div className="text-xs text-purple-600">
                    Required items: {evolutionRequirements[pet.stage].length}
                    {petStore.canEvolveFromStage(userWalletAddress, pet.stage) && (
                      <span className="ml-2 text-green-600 font-medium">✓ Ready to evolve!</span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {filteredItems.map((item) => {
                const isOwned = userInventory?.items.some(invItem => invItem.storeItemId === item.id) || false;
                const isEvolutionItem = item.evolutionItem;
                
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white border-2 ${getRarityBorder(item.rarity)} rounded-xl p-3 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden min-h-[200px] flex flex-col ${isOwned ? 'opacity-75' : ''}`}
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

                    {isEvolutionItem && (
                      <div className="absolute top-2 left-2">
                        <Star className="w-4 h-4 text-orange-500" />
                      </div>
                    )}

                    {isOwned && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
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
                      
                      {isEvolutionItem && (
                        <div className="flex items-center space-x-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          <Star className="w-3 h-3" />
                          <span>Evolution Item</span>
                        </div>
                      )}
                      
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
                      {isOwned ? (
                        <button
                          disabled
                          className="px-2.5 py-1 bg-green-500 text-white rounded-md text-xs font-medium cursor-not-allowed"
                        >
                          Owned
                        </button>
                      ) : item.inStock ? (
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
                );
              })}
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

                    {selectedItem.evolutionItem && (
                      <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center space-x-2 text-sm text-orange-700">
                          <Star className="w-4 h-4" />
                          <span className="font-medium">Evolution Item</span>
                        </div>
                        <p className="text-xs text-orange-600 mt-1">
                          Required for pet evolution to the next stage
                        </p>
                      </div>
                    )}

                    {userInventory?.items.some(invItem => invItem.storeItemId === selectedItem.id) && (
                      <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2 text-sm text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">Already Owned</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          This item is already in your inventory
                        </p>
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
                         {userInventory?.items.some(invItem => invItem.storeItemId === selectedItem.id) ? (
                           <button
                             disabled
                             className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg cursor-not-allowed text-sm"
                           >
                             Owned
                           </button>
                         ) : selectedItem.inStock ? (
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