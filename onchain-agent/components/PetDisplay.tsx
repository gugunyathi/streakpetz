'use client';

import React, { useState } from 'react';
import { Pet, PetStage, PetMood, XP_THRESHOLDS } from '@/lib/pet';
import ChatInterface from './ChatInterface';
import BasenameModal from './BasenameModal';
import PetInfoModal from './PetInfoModal';
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
  // Debug logging moved outside JSX
  console.log('PetDisplay - Pet object:', pet);
  console.log('PetDisplay - petWalletId:', pet.petWalletId);
  console.log('PetDisplay - petWalletAddress:', pet.petWalletAddress);

  const { logout } = useAuth();
  const [animationParticles, setAnimationParticles] = useState<AnimationParticle[]>([]);
  const [animationKey, setAnimationKey] = useState(0);
  const [isBasenameModalOpen, setIsBasenameModalOpen] = useState(false);
  const [isPetInfoModalOpen, setIsPetInfoModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle logout with immediate feedback
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Force reload as fallback
      window.location.href = '/';
    }
  };

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
    <div className="h-full flex flex-col touch-manipulation">
      {/* Pet Visual Card */}
      <div className="relative bg-black/20 backdrop-blur-xl rounded-b-2xl sm:rounded-b-3xl p-3 sm:p-8 border border-white/10 border-t-0 h-[820px] sm:h-[920px] flex flex-col items-center justify-start overflow-hidden gpu-accelerated">
        {/* Floating Wallet Status Card */}
        {walletAddress && (
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 flex items-center gap-1 sm:gap-1.5 px-1.5 py-1 bg-black/30 backdrop-blur-xl rounded-lg sm:rounded-xl border border-white/20 shadow-lg touch-manipulation">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-white text-[9px] sm:text-[10px] font-semibold">Connected</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-white/90 text-[9px] sm:text-[10px] font-medium">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-3)}
              </span>
              <button 
                onClick={() => {
                  if (walletAddress) {
                    navigator.clipboard.writeText(walletAddress);
                  }
                }}
                className="text-white/60 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all duration-200 p-0.5 rounded text-[9px] sm:text-[10px] touch-manipulation"
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
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-xl rounded-xl border shadow-lg group transition-all duration-200 touch-manipulation active:scale-95 ${
              isLoggingOut 
                ? 'bg-gray-500/20 border-gray-500/30 cursor-wait opacity-70' 
                : 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30 active:bg-red-500/40'
            }`}
            title={isLoggingOut ? "Signing out..." : "Sign Out"}
          >
            <span className={`text-[10px] font-semibold transition-colors ${
              isLoggingOut ? 'text-gray-300' : 'text-red-300 group-hover:text-red-200'
            }`}>
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </span>
            <span className={`text-[10px] transition-all ${
              isLoggingOut ? 'text-gray-300 animate-spin' : 'text-red-300 group-hover:text-red-200'
            }`}>
              {isLoggingOut ? '⏳' : '🚪'}
            </span>
          </button>
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex flex-col gap-1.5 sm:gap-2 z-10">
          <button
            onClick={() => handleAction('feed')}
            className="w-9 h-9 sm:w-12 sm:h-12 bg-black/30 backdrop-blur-xl rounded-full border border-white/20 hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-200 group flex items-center justify-center touch-manipulation"
            title="Feed"
          >
            <span className="text-base sm:text-xl group-hover:scale-110 group-active:scale-95 transition-transform">🍎</span>
          </button>

          <button
            onClick={() => handleAction('play')}
            className="w-9 h-9 sm:w-12 sm:h-12 bg-black/30 backdrop-blur-xl rounded-full border border-white/20 hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-200 group flex items-center justify-center touch-manipulation"
            title="Play"
          >
            <span className="text-base sm:text-xl group-hover:scale-110 group-active:scale-95 transition-transform">🎾</span>
          </button>

          <button
            onClick={() => handleAction('groom')}
            className="w-9 h-9 sm:w-12 sm:h-12 bg-black/30 backdrop-blur-xl rounded-full border border-white/20 hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-200 group flex items-center justify-center touch-manipulation"
            title="Groom"
          >
            <span className="text-base sm:text-xl group-hover:scale-110 group-active:scale-95 transition-transform">🧼</span>
          </button>

          <button
            onClick={() => handleAction('store')}
            className="w-9 h-9 sm:w-12 sm:h-12 bg-black/30 backdrop-blur-xl rounded-full border border-white/20 hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-200 group flex items-center justify-center touch-manipulation"
            title="Pet Store"
          >
            <span className="text-base sm:text-xl group-hover:scale-110 group-active:scale-95 transition-transform">🏪</span>
          </button>
        </div>

        {/* Pet Name - Above Pet */}
        <div className="text-center mb-3 sm:mb-4 mt-6 sm:mt-10 px-2">
          <h2 
            className="text-white text-sm sm:text-lg font-bold mb-1 cursor-pointer hover:text-purple-300 active:text-purple-400 transition-colors duration-200 hover:scale-105 active:scale-95 transform inline-block touch-manipulation"
            onClick={() => setIsPetInfoModalOpen(true)}
            title="Click to view pet details"
          >
            {pet.name} ℹ️
          </h2>
          {pet.petWalletAddress && (
            <>
              <div className="text-white/60 text-[10px] sm:text-xs font-mono">
                {pet.petWalletAddress.slice(0, 6)}...{pet.petWalletAddress.slice(-4)}
              </div>
              
              {/* Basename - Always Show */}
              <div 
                className={`text-[10px] sm:text-xs font-medium mt-1 ${pet.basename ? 'text-purple-300' : 'text-white/40 cursor-pointer hover:text-purple-300 active:text-purple-400 hover:bg-white/10 active:bg-white/20 rounded px-2 py-1 transition-all duration-200 touch-manipulation'}`}
                onClick={!pet.basename ? handleWalletAddressClick : undefined}
                title={!pet.basename ? 'Click to register basename' : undefined}
              >
                🏷️ {pet.basename || 'Not Registered'}
              </div>
            </>
          )}
        </div>

        {/* Pet Circle with Status on Left */}
        <div className="relative mb-3 sm:mb-6 -mt-1 sm:-mt-2 flex items-center justify-center">
          {/* Vertical Status Box - Left Side */}
          <div className="absolute left-[-60px] sm:left-[-80px] top-1/2 transform -translate-y-1/2 flex flex-col gap-2 sm:gap-3 z-10">
            {/* Health Card */}
            <div className="bg-black/30 backdrop-blur-xl rounded-lg border border-white/20 px-2 sm:px-2.5 py-1.5 sm:py-2 flex flex-col items-center gap-0.5 sm:gap-1 scale-90 sm:scale-95 touch-manipulation">
              <span className="text-red-400" style={{ fontSize: '0.8rem' }}>❤️</span>
              <div className="text-white text-center" style={{ fontSize: '0.6rem' }}>
                <div className="font-medium text-[9px] sm:text-[11px]">Health</div>
                <div className="text-white/80 text-[8px] sm:text-[10px]">{pet.stats.health}/100</div>
              </div>
            </div>
            
            {/* Energy Card */}
            <div className="bg-black/30 backdrop-blur-xl rounded-lg border border-white/20 px-2 sm:px-2.5 py-1.5 sm:py-2 flex flex-col items-center gap-0.5 sm:gap-1 scale-90 sm:scale-95 touch-manipulation">
              <span className="text-yellow-400" style={{ fontSize: '0.8rem' }}>⚡</span>
              <div className="text-white text-center" style={{ fontSize: '0.6rem' }}>
                <div className="font-medium text-[9px] sm:text-[11px]">Energy</div>
                <div className="text-white/80 text-[8px] sm:text-[10px]">{pet.stats.energy}/100</div>
              </div>
            </div>
          </div>

          <div className="w-32 h-32 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl gpu-accelerated">
            <span className="animate-bounce" style={{ fontSize: 'clamp(4rem, 12vw, 20rem)', lineHeight: '1' }}>{getPetVisual()}</span>
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
          <div className="absolute inset-0 w-32 h-32 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-purple-400/30 to-blue-400/30 blur-xl -z-10"></div>
        </div>

        {/* Horizontal Evolution Progress Bar - Below Pet Circle */}
        <div className="w-full max-w-xs sm:max-w-md mx-auto mb-4 sm:mb-5 px-4">
          {/* Stage & Level Info */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-white/90 text-[10px] sm:text-xs font-semibold">Level {pet.stats.level}</span>
              <span className="text-white/60 text-[10px] sm:text-xs">•</span>
              <span className="text-white/80 text-[10px] sm:text-xs capitalize">{pet.stage.toLowerCase()}</span>
            </div>
            <div className="text-white/70 text-[10px] sm:text-xs font-medium capitalize">{pet.mood.toLowerCase()}</div>
          </div>

          {/* Progress Bar Container */}
          <div className="relative">
            {/* Background Track */}
            <div className="h-3 sm:h-4 bg-black/30 backdrop-blur-sm rounded-full border border-white/20 overflow-hidden">
              {/* Progress Fill with Gradient */}
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-purple-400 to-blue-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                style={{ width: `${progressPercentage}%` }}
              >
                {/* Animated Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>

            {/* XP Text */}
            <div className="flex items-center justify-between mt-1.5">
              <div className="text-white/90 text-[9px] sm:text-[10px] font-medium">
                XP: {pet.xp}
                {pet.stage !== PetStage.UNICORN && (
                  <span className="text-white/60"> / {nextStageThreshold}</span>
                )}
              </div>
              {pet.stage !== PetStage.UNICORN ? (
                <div className="text-purple-300 text-[9px] sm:text-[10px] font-semibold">
                  Next: {Object.values(PetStage)[Object.values(PetStage).indexOf(pet.stage) + 1]}
                </div>
              ) : (
                <div className="text-purple-300 text-[9px] sm:text-[10px] font-bold flex items-center gap-1">
                  <span>✨</span>
                  <span>MAX LEVEL</span>
                  <span>✨</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Interface - Below Evolution Bar */}
        <div className="relative w-full max-w-md mx-auto smooth-scroll" style={{ height: '92%' }}>
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
            petId={pet.id}
            onBasenameRegistered={handleBasenameRegistered}
          />
        )}

        {/* Pet Info Modal */}
        {walletAddress && (
          <PetInfoModal
            isOpen={isPetInfoModalOpen}
            onClose={() => setIsPetInfoModalOpen(false)}
            pet={pet}
            userWalletAddress={walletAddress}
          />
        )}
      </div>
    </div>
  );
}