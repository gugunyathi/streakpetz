'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Plus, Loader2 } from 'lucide-react';

interface PetSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userWalletAddress: string;
  currentPetId: string;
  onPetSelected: (pet: any) => void;
  onCreateNewPet: () => void;
}

const PetSwitcher: React.FC<PetSwitcherProps> = ({
  isOpen,
  onClose,
  userId,
  userWalletAddress,
  currentPetId,
  onPetSelected,
  onCreateNewPet
}) => {
  const [pets, setPets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPets();
    }
  }, [isOpen, userId]);

  const fetchPets = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/pets/list?userId=${userId}&userWalletAddress=${userWalletAddress}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch pets');
      }

      setPets(result.pets || []);
    } catch (err: any) {
      console.error('❌ Failed to fetch pets:', err);
      setError(err.message || 'Failed to load pets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPet = (pet: any) => {
    onPetSelected(pet);
    onClose();
  };

  const getPetEmoji = (stage: string) => {
    switch (stage) {
      case 'egg': return '🥚';
      case 'hatchling': return '🐣';
      case 'teen': return '🐥';
      case 'adult': return '🦅';
      case 'unicorn': return '🦄';
      default: return '🥚';
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'content': return '😌';
      case 'grumpy': return '😠';
      case 'cold': return '🥶';
      case 'lonely': return '😔';
      default: return '😐';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100004] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Your Pets</h2>
                <p className="text-purple-100 text-sm">Select a pet to switch</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            ) : pets.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 mb-4">You don't have any pets yet!</p>
                <button
                  onClick={() => {
                    onClose();
                    onCreateNewPet();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Create Your First Pet
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pets.map((pet) => (
                  <motion.button
                    key={pet.id}
                    onClick={() => handleSelectPet(pet)}
                    disabled={pet.id === currentPetId}
                    className={`w-full p-4 flex items-center justify-between hover:bg-purple-50 transition-colors ${
                      pet.id === currentPetId ? 'bg-purple-100' : ''
                    }`}
                    whileHover={{ x: pet.id === currentPetId ? 0 : 4 }}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Pet Avatar */}
                      <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center overflow-hidden">
                        {pet.imageUrl ? (
                          <img
                            src={pet.imageUrl}
                            alt={pet.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">{getPetEmoji(pet.stage)}</span>
                        )}
                        
                        {/* Mood Badge */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-sm">{getMoodEmoji(pet.mood)}</span>
                        </div>
                      </div>

                      {/* Pet Info */}
                      <div className="text-left">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-gray-900">{pet.name}</h3>
                          {pet.id === currentPetId && (
                            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 capitalize">
                          {pet.stage} • Level {pet.stats?.level || 1}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">⚡</span>
                            <span className="text-xs text-gray-500">{pet.xp} XP</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">🔥</span>
                            <span className="text-xs text-gray-500">{pet.streak} day streak</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {pet.id !== currentPetId && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Create New Pet Button */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => {
                onClose();
                onCreateNewPet();
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Pet</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PetSwitcher;
