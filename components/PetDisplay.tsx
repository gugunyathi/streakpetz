'use client';

import React from 'react';
import { Pet, PetStage, PetMood } from '@/lib/pet';

interface PetDisplayProps {
  pet: Pet;
  onInteraction: (action: string) => void;
}

const PetDisplay: React.FC<PetDisplayProps> = ({ pet, onInteraction }) => {
  // Get pet visual based on stage
  const getPetVisual = (stage: PetStage, mood: PetMood) => {
    const baseSize = 200;
    const moodEmoji = {
      [PetMood.HAPPY]: '😊',
      [PetMood.CONTENT]: '😌',
      [PetMood.GRUMPY]: '😠',
      [PetMood.COLD]: '🥶',
      [PetMood.LONELY]: '😢',
      [PetMood.PERISHED]: '💀'
    };

    switch (stage) {
      case PetStage.EGG:
        return (
          <div className="relative">
            <div className="w-48 h-48 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full shadow-lg flex items-center justify-center">
              <div className="text-6xl">🥚</div>
            </div>
            <div className="absolute -top-2 -right-2 text-2xl">{moodEmoji[mood]}</div>
          </div>
        );
      
      case PetStage.HATCHLING:
        return (
          <div className="relative">
            <div className="w-48 h-48 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full shadow-lg flex items-center justify-center">
              <div className="text-6xl">🐣</div>
            </div>
            <div className="absolute -top-2 -right-2 text-2xl">{moodEmoji[mood]}</div>
          </div>
        );
      
      case PetStage.PRETEEN:
        return (
          <div className="relative">
            <div className="w-48 h-48 bg-gradient-to-br from-green-200 to-green-400 rounded-full shadow-lg flex items-center justify-center">
              <div className="text-6xl">🐤</div>
            </div>
            <div className="absolute -top-2 -right-2 text-2xl">{moodEmoji[mood]}</div>
          </div>
        );
      
      case PetStage.TEEN:
        return (
          <div className="relative">
            <div className="w-48 h-48 bg-gradient-to-br from-blue-200 to-blue-400 rounded-full shadow-lg flex items-center justify-center">
              <div className="text-6xl">🐦</div>
            </div>
            <div className="absolute -top-2 -right-2 text-2xl">{moodEmoji[mood]}</div>
          </div>
        );
      
      case PetStage.ADULT:
        return (
          <div className="relative">
            <div className="w-48 h-48 bg-gradient-to-br from-purple-200 to-purple-400 rounded-full shadow-lg flex items-center justify-center">
              <div className="text-6xl">🦅</div>
            </div>
            <div className="absolute -top-2 -right-2 text-2xl">{moodEmoji[mood]}</div>
          </div>
        );
      
      case PetStage.UNICORN:
        return (
          <div className="relative">
            <div className="w-48 h-48 bg-gradient-to-br from-pink-200 via-purple-300 to-indigo-400 rounded-full shadow-2xl flex items-center justify-center animate-pulse">
              <div className="text-6xl">🦄</div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-spin"></div>
            </div>
            <div className="absolute -top-2 -right-2 text-2xl">{moodEmoji[mood]}</div>
          </div>
        );
      
      default:
        return (
          <div className="w-48 h-48 bg-gray-200 rounded-full shadow-lg flex items-center justify-center">
            <div className="text-6xl">❓</div>
          </div>
        );
    }
  };

  // Get stage progress
  const getStageProgress = () => {
    const stageThresholds = [0, 100, 500, 1500, 3000, 5000];
    const currentStageIndex = Object.values(PetStage).indexOf(pet.stage);
    const currentThreshold = stageThresholds[currentStageIndex];
    const nextThreshold = stageThresholds[currentStageIndex + 1] || 5000;
    
    const progress = ((pet.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      {/* Pet Name */}
      <h2 className="text-2xl font-bold text-gray-800">{pet.name}</h2>
      
      {/* Pet Visual */}
      <div className="flex justify-center">
        {getPetVisual(pet.stage, pet.mood)}
      </div>
      
      {/* Pet Stage */}
      <div className="text-center">
        <p className="text-lg font-semibold capitalize text-gray-700">{pet.stage}</p>
        <p className="text-sm text-gray-500">Next: {pet.stage === PetStage.UNICORN ? 'Max Level!' : Object.values(PetStage)[Object.values(PetStage).indexOf(pet.stage) + 1]}</p>
      </div>
      
      {/* XP Progress Bar */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>XP: {pet.xp}</span>
          <span>Streak: {pet.streakDays} days</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${getStageProgress()}%` }}
          ></div>
        </div>
      </div>
      
      {/* Pet Stats */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <div className="bg-red-100 p-3 rounded-lg">
          <p className="text-sm font-medium text-red-800">Health</p>
          <div className="w-full bg-red-200 rounded-full h-2 mt-1">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${pet.stats.health}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-yellow-100 p-3 rounded-lg">
          <p className="text-sm font-medium text-yellow-800">Happiness</p>
          <div className="w-full bg-yellow-200 rounded-full h-2 mt-1">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${pet.stats.happiness}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-green-100 p-3 rounded-lg">
          <p className="text-sm font-medium text-green-800">Energy</p>
          <div className="w-full bg-green-200 rounded-full h-2 mt-1">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${pet.stats.energy}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-blue-100 p-3 rounded-lg">
          <p className="text-sm font-medium text-blue-800">Hunger</p>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${100 - pet.stats.hunger}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => onInteraction('feed')}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          🍎 Feed
        </button>
        
        <button
          onClick={() => onInteraction('play')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          🎾 Play
        </button>
        
        <button
          onClick={() => onInteraction('groom')}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          ✨ Groom
        </button>
        
        <button
          onClick={() => onInteraction('chat')}
          className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          💬 Chat
        </button>
      </div>
    </div>
  );
};

export default PetDisplay;