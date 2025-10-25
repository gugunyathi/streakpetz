'use client';

import React, { useState } from 'react';
import { Pet, PetStage, PetMood, XP_THRESHOLDS } from '@/lib/pet';
import ChatInterface from './ChatInterface';
import BasenameModal from './BasenameModal';
import { useAuth } from '@/lib/auth';

interface PetDisplayProps {
  pet: Pet;
  walletAddress?: string;
  onAction: (action: 'feed' | 'play' | 'groom' | 'store') => void;
  onPetUpdate?: (updatedPet: Pet) => void;
}

interface AnimationParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  delay: number;
}

export default function PetDisplay({ pet, walletAddress, onAction, onPetUpdate }: PetDisplayProps) {
  const { logout } = useAuth();
  const [animationParticles, setAnimationParticles] = useState<AnimationParticle[]>([]);
  const [animationKey, setAnimationKey] = useState(0);
  const [isBasenameModalOpen, setIsBasenameModalOpen] = useState(false);

  // Handle basename registration
  const handleBasenameRegistered = (basename: string) => {
    if (onPetUpdate) {
      const updatedPet = { ...pet, basename };
      onPetUpdate(updatedPet);
    }
  };

  // Handle wallet address click
  const handleWalletAddressClick = () => {
    if (pet.petWalletAddress && !pet.basename) {
      setIsBasenameModalOpen(true);
    }
  };

  // Calculate XP progress for current stage (fixed calculation)
  const getCurrentStageThreshold = (stage: PetStage): number => {
    return XP_THRESHOLDS[stage];
  };

  const getNextStageThreshold = (stage: PetStage): number => {
    const stages = Object.values(PetStage);
    const currentIndex = stages.indexOf(stage);
    const nextStage = stages[currentIndex + 1];
    return nextStage ? XP_THRESHOLDS[nextStage] : XP_THRESHOLDS[PetStage.UNICORN];
  };

  const currentStageThreshold = getCurrentStageThreshold(pet.stage);
  const nextStageThreshold = getNextStageThreshold(pet.stage);
  const xpProgress = pet.xp - currentStageThreshold;
  const xpNeeded = nextStageThreshold - currentStageThreshold;
  const progressPercentage = pet.stage === PetStage.UNICORN ? 100 : Math.min((xpProgress / xpNeeded) * 100, 100);

  // Trigger animation based on action
  const triggerAnimation = (action: 'feed' | 'play' | 'groom' | 'store') => {
    const animationEmojis = {
      feed: ['❤️', '💖', '💕', '💗'],
      play: ['⭐', '✨', '🌟', '💫'],
      groom: ['💎', '✨', '🌸', '💐'],
      store: ['💰', '🪙', '💎', '🎁']
    };

    const emojis = animationEmojis[action];
    const particles: AnimationParticle[] = [];

    // Create 6-8 particles for the animation
    for (let i = 0; i < 7; i++) {
      particles.push({
        id: Date.now() + i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: Math.random() * 60 - 30, // Random x offset from -30px to +30px
        y: 0,
        delay: i * 150 // Stagger the animations
      });
    }

    setAnimationParticles(particles);
    setAnimationKey(prev => prev + 1);

    // Clear particles after animation completes
    setTimeout(() => {
      setAnimationParticles([]);
    }, 2500);
  };

  // Enhanced onAction handler with animation
  const handleAction = (action: 'feed' | 'play' | 'groom' | 'store') => {
    triggerAnimation(action);
    onAction(action);
  };

  // Get pet visual based on stage and mood
  const getPetVisual = () => {
    const moodEmojis = {
      [PetMood.HAPPY]: '😊',
      [PetMood.CONTENT]: '😐',
      [PetMood.GRUMPY]: '😢',
      [PetMood.COLD]: '🤩',
      [PetMood.LONELY]: '😴'
    };
    
    const stageEmojis = {
      [PetStage.EGG]: '🥚',
      [PetStage.HATCHLING]: '🐣',
      [PetStage.TEEN]: '🐤',
      [PetStage.ADULT]: '🐦',
      [PetStage.UNICORN]: '🦄'
    };
    
    return pet.stage === PetStage.EGG ? stageEmojis[pet.stage] : moodEmojis[pet.mood];
  };

  return (
    <div className="h-full flex flex-col">
      {/* Pet Visual Card */}
      <div className="relative bg-black/20 backdrop-blur-xl rounded-b-3xl p-4 sm:p-8 border border-white/10 border-t-0 h-[758px] sm:h-[859px] flex flex-col items-center justify-start overflow-hidden">
        {/* Floating Wallet Status Card */}
        {walletAddress && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-1.5 py-1 bg-black/30 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-white text-[10px] font-semibold">Connected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white/90 text-[10px] font-medium">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <button 
                onClick={() => {
                  if (walletAddress) {
                    navigator.clipboard.writeText(walletAddress);
                  }
                }}
                className="text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 p-0.5 rounded text-[10px]"
                title="Copy full address"
              >
                📋
              </button>
            </div>
          </div>
        )}

        {/* Logout Button - Top Middle */}
        <div className="hidden absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 backdrop-blur-xl rounded-xl border border-red-500/30 hover:bg-red-500/30 transition-all duration-200 shadow-lg group"
            title="Sign Out"
          >
            <span className="text-red-300 text-[10px] font-semibold group-hover:text-red-200">Sign Out</span>
            <span className="text-red-300 text-[10px] group-hover:text-red-200">🚪</span>
          </button>
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button
            onClick={() => handleAction('feed')}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-black/30 backdrop-blur-xl rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300 group flex items-center justify-center"
            title="Feed"
          >
            <span className="text-lg sm:text-xl group-hover:scale-110 transition-transform">🍎</span>
          </button>

          <button
            onClick={() => handleAction('play')}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-black/30 backdrop-blur-xl rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300 group flex items-center justify-center"
            title="Play"
          >
            <span className="text-lg sm:text-xl group-hover:scale-110 transition-transform">🎾</span>
          </button>

          <button
            onClick={() => handleAction('groom')}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-black/30 backdrop-blur-xl rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300 group flex items-center justify-center"
            title="Groom"
          >
            <span className="text-lg sm:text-xl group-hover:scale-110 transition-transform">🧼</span>
          </button>

          <button
            onClick={() => handleAction('store')}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-black/30 backdrop-blur-xl rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300 group flex items-center justify-center"
            title="Pet Store"
          >
            <span className="text-lg sm:text-xl group-hover:scale-110 transition-transform">🏪</span>
          </button>

          {/* Vertical XP Progress Bar */}
          <div className="mt-4 flex flex-col items-center">
            <div className="w-2 h-24 sm:h-32 bg-white/20 rounded-full overflow-hidden relative">
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-purple-400 to-blue-400 rounded-full transition-all duration-500"
                style={{ height: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="mt-1 text-white/80 text-xs text-center">
              <div>XP {pet.xp}</div>
              {pet.stage !== PetStage.UNICORN && (
                <div className="text-white/60 text-[10px]">
                  {xpProgress}/{xpNeeded}
                </div>
              )}
              {pet.stage !== PetStage.UNICORN && (
                <div className="text-white/50 text-[9px]">
                  Next: {Object.values(PetStage)[Object.values(PetStage).indexOf(pet.stage) + 1]}
                </div>
              )}
              {pet.stage === PetStage.UNICORN && (
                <div className="text-purple-300 text-[10px]">
                  MAX LEVEL!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pet Name - Above Pet */}
        <div className="text-center mb-4 mt-8">
          <h2 className="text-white text-base sm:text-lg font-bold mb-1">{pet.name}</h2>
          {pet.petWalletAddress && (
            <div 
              className={`text-white/60 text-xs font-mono ${!pet.basename ? 'cursor-pointer hover:text-purple-300 hover:bg-white/10 rounded px-2 py-1 transition-all duration-200' : ''}`}
              onClick={handleWalletAddressClick}
              title={!pet.basename ? 'Click to register basename' : undefined}
            >
              {pet.petWalletAddress.slice(0, 6)}...{pet.petWalletAddress.slice(-4)}
              {!pet.basename && (
                <span className="ml-1 text-purple-400">🏷️</span>
              )}
            </div>
          )}
          {pet.basename && (
            <div className="text-purple-300 text-xs font-medium mt-1">
              🏷️ {pet.basename}
            </div>
          )}
        </div>

        {/* Pet Circle with Status on Left */}
        <div className="relative mb-4 sm:mb-6 -mt-2 flex items-center justify-center">
          {/* Vertical Status Box - Left Side */}
          <div className="absolute left-[-80px] top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-10">
            {/* Health Card */}
            <div className="bg-black/30 backdrop-blur-xl rounded-lg border border-white/20 px-2.5 py-2 flex flex-col items-center gap-1 scale-95">
              <span className="text-red-400" style={{ fontSize: '0.9rem' }}>❤️</span>
              <div className="text-white text-center" style={{ fontSize: '0.7rem' }}>
                <div className="font-medium">Health</div>
                <div className="text-white/80">{pet.stats.health}/100</div>
              </div>
            </div>
            
            {/* Energy Card */}
            <div className="bg-black/30 backdrop-blur-xl rounded-lg border border-white/20 px-2.5 py-2 flex flex-col items-center gap-1 scale-95">
              <span className="text-yellow-400" style={{ fontSize: '0.9rem' }}>⚡</span>
              <div className="text-white text-center" style={{ fontSize: '0.7rem' }}>
                <div className="font-medium">Energy</div>
                <div className="text-white/80">{pet.stats.energy}/100</div>
              </div>
            </div>
          </div>

          <div className="w-40 h-40 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
            <span className="animate-bounce" style={{ fontSize: 'clamp(6rem, 15vw, 20rem)', lineHeight: '1' }}>{getPetVisual()}</span>
          </div>

          {/* Animation Particles Overlay */}
          {animationParticles.length > 0 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {animationParticles.map((particle) => (
                <div
                  key={`${animationKey}-${particle.id}`}
                  className="absolute text-2xl animate-float-up"
                  style={{
                    left: `calc(50% + ${particle.x}px)`,
                    top: '50%',
                    animationDelay: `${particle.delay}ms`,
                    animationDuration: '2s',
                    animationFillMode: 'forwards'
                  }}
                >
                  {particle.emoji}
                </div>
              ))}
            </div>
          )}

          {/* Glow effect */}
          <div className="absolute inset-0 w-40 h-40 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-purple-400/30 to-blue-400/30 blur-xl -z-10"></div>
        </div>

        {/* Pet Level/Stage/Mood Info - Between Pet and Chat */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 text-white/80 text-xs">
            <span>Level {pet.stats.level}</span>
            <span className="text-white/60">•</span>
            <span className="capitalize">{pet.stage.toLowerCase()}</span>
            <span className="text-white/60">•</span>
            <span className="capitalize">{pet.mood.toLowerCase()}</span>
          </div>
        </div>

        {/* Chat Interface - Below Pet */}
        <div className="relative w-full max-w-md mx-auto" style={{ height: '97%' }}>
          <ChatInterface pet={pet} />
        </div>

        {/* Basename Registration Modal */}
        {pet.petWalletAddress && (
          <BasenameModal
            isOpen={isBasenameModalOpen}
            onClose={() => setIsBasenameModalOpen(false)}
            petWalletAddress={pet.petWalletAddress}
            petWalletId={pet.petWalletId}
            petName={pet.name}
            onBasenameRegistered={handleBasenameRegistered}
          />
        )}
      </div>
    </div>
  );
}