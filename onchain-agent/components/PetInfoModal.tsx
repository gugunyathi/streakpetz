'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, TrendingUp, Star, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import { Pet, PetStage } from '@/lib/pet';
import { PetStore } from '@/lib/pet-store';

interface PetInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet;
  userWalletAddress: string;
}

interface InventoryItem {
  storeItemId: string;
  quantity: number;
  purchaseDate: string;
  purchasePrice: number;
  used: boolean;
  transactionHash?: string;
}

interface InventoryData {
  items: InventoryItem[];
  totalValue: number;
  lastUpdated: string;
}

interface EvolutionStatusData {
  canEvolve: boolean;
  currentStage: string;
  currentXP: number;
  requiredXP: number;
  hasEnoughXP: boolean;
  itemStatus: {
    itemId: string;
    itemName: string;
    required: boolean;
    owned: boolean;
  }[];
  hasAllItems: boolean;
}

const PetInfoModal: React.FC<PetInfoModalProps> = ({
  isOpen,
  onClose,
  pet,
  userWalletAddress
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'evolution' | 'stats'>('inventory');
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [evolutionStatus, setEvolutionStatus] = useState<EvolutionStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const petStore = new PetStore();

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, pet.id]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch inventory
      const inventoryResponse = await fetch(
        `/api/pets/inventory?userId=${userWalletAddress}&petId=${pet.id}`
      );
      const inventoryResult = await inventoryResponse.json();
      
      if (inventoryResult.success) {
        setInventory(inventoryResult.inventory);
      } else {
        console.error('Failed to fetch inventory:', inventoryResult.error);
      }

      // Fetch evolution status
      const evolutionResponse = await fetch(
        `/api/pets/evolve?userId=${userWalletAddress}&petId=${pet.id}`
      );
      const evolutionResult = await evolutionResponse.json();
      
      if (evolutionResult.success) {
        setEvolutionStatus(evolutionResult);
      } else {
        console.error('Failed to fetch evolution status:', evolutionResult.error);
      }
    } catch (error) {
      console.error('Failed to fetch pet data:', error);
      setError('Failed to load pet information');
    } finally {
      setIsLoading(false);
    }
  };

  const getStageEmoji = (stage: string) => {
    const emojis: { [key: string]: string } = {
      egg: '🥚',
      hatchling: '🐣',
      teen: '🐤',
      adult: '🐦',
      unicorn: '🦄'
    };
    return emojis[stage.toLowerCase()] || '🐾';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100001] flex items-start justify-center p-2 sm:p-4 pt-2 sm:pt-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-hidden mt-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">{getStageEmoji(pet.stage)}</div>
                <div>
                  <h2 className="text-2xl font-bold">{pet.name}</h2>
                  <p className="text-sm text-white/80 capitalize">{pet.stage} • Level {pet.stats.level}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'inventory'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('evolution')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'evolution'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Evolution
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Star className="w-4 h-4 inline mr-2" />
              Stats
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">
                <XCircle className="w-12 h-12 mx-auto mb-4" />
                <p>{error}</p>
              </div>
            ) : (
              <>
                {/* Inventory Tab */}
                {activeTab === 'inventory' && (
                  <div className="space-y-4">
                    {inventory && inventory.items.length > 0 ? (
                      <>
                        <div className="bg-purple-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Items</span>
                            <span className="text-lg font-bold text-purple-600">
                              {inventory.items.reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600">Total Value</span>
                            <span className="text-lg font-bold text-purple-600">
                              ${(inventory.totalValue / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {inventory.items.map((item, index) => {
                          const storeItem = petStore.getItemById(item.storeItemId);
                          return (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <div className="text-3xl">{storeItem?.image || '📦'}</div>
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">
                                      {storeItem?.name || item.storeItemId}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {storeItem?.description || 'Item from pet store'}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-2">
                                      <span className="text-xs text-gray-600">
                                        Qty: <span className="font-semibold">{item.quantity}</span>
                                      </span>
                                      <span className="text-xs text-gray-600">
                                        ${(item.purchasePrice / 100).toFixed(2)}
                                      </span>
                                      {item.used && (
                                        <span className="text-xs text-green-600 font-medium">
                                          ✓ Used
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                                      <Clock className="w-3 h-3" />
                                      <span>{formatDate(item.purchaseDate)}</span>
                                    </div>
                                    {item.transactionHash && item.transactionHash !== 'pending' && (
                                      <a
                                        href={`https://sepolia.basescan.org/tx/${item.transactionHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-purple-600 hover:underline mt-1 inline-block"
                                      >
                                        View Transaction →
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No items yet</p>
                        <p className="text-sm mt-2">Purchase items from the Pet Store!</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Evolution Tab */}
                {activeTab === 'evolution' && evolutionStatus && (
                  <div className="space-y-4">
                    {/* Current Status */}
                    <div className={`rounded-lg p-4 ${evolutionStatus.canEvolve ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">Evolution Status</h3>
                        {evolutionStatus.canEvolve ? (
                          <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Ready to Evolve!
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-400 text-white rounded-full text-xs font-medium">
                            Not Ready
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Current Stage</span>
                          <span className="font-semibold capitalize">{evolutionStatus.currentStage}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Experience Points</span>
                          <span className={`font-semibold ${evolutionStatus.hasEnoughXP ? 'text-green-600' : 'text-gray-800'}`}>
                            {evolutionStatus.currentXP} / {evolutionStatus.requiredXP} XP
                            {evolutionStatus.hasEnoughXP && <CheckCircle className="w-4 h-4 inline ml-1" />}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Required Items */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Required Evolution Items</h3>
                      <div className="space-y-2">
                        {evolutionStatus.itemStatus.map((item, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              item.owned
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {item.owned ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-gray-400" />
                              )}
                              <span className={`text-sm ${item.owned ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                {item.itemName}
                              </span>
                            </div>
                            {item.owned ? (
                              <span className="text-xs text-green-600 font-medium">Owned</span>
                            ) : (
                              <span className="text-xs text-gray-400">Not Owned</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {!evolutionStatus.canEvolve && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <p className="text-sm text-blue-800">
                          <strong>Tip:</strong> Purchase evolution items from the Pet Store to unlock the next stage!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Stats Tab */}
                {activeTab === 'stats' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">❤️</span>
                          <span className="text-sm text-gray-600">Happiness</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600">{pet.stats.happiness}%</div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">💚</span>
                          <span className="text-sm text-gray-600">Health</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">{pet.stats.health}%</div>
                      </div>

                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">⚡</span>
                          <span className="text-sm text-gray-600">Energy</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">{pet.stats.energy}%</div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">⭐</span>
                          <span className="text-sm text-gray-600">Level</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{pet.stats.level}</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-3">Additional Info</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Experience Points</span>
                          <span className="font-semibold">{pet.xp} XP</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Current Mood</span>
                          <span className="font-semibold capitalize">{pet.mood}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Streak</span>
                          <span className="font-semibold">{pet.streak} days</span>
                        </div>
                        {pet.petWalletAddress && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Pet Wallet</span>
                            <a
                              href={`https://sepolia.basescan.org/address/${pet.petWalletAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-purple-600 hover:underline"
                            >
                              {pet.petWalletAddress.slice(0, 6)}...{pet.petWalletAddress.slice(-4)}
                            </a>
                          </div>
                        )}
                        {pet.basename && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Basename</span>
                            <span className="font-semibold text-purple-600">🏷️ {pet.basename}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PetInfoModal;
