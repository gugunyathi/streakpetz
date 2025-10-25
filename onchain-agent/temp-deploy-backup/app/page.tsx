'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Pet, updatePetAfterInteraction } from '@/lib/pet';
import PetDisplay from '@/components/PetDisplay';
import LoginButton from '@/components/LoginButton';
import PetStoreModal from '@/components/PetStoreModal';
import { generateActionResponse } from '@/lib/openai';

export default function Home() {
  const { ready, authenticated, user, walletAddress, setUserWalletAddress } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  // Initialize user and pet when authenticated
  useEffect(() => {
    const initializeApp = async () => {
      if (!authenticated || !user) return;

      setIsLoading(true);
      setError('');

      try {
        // Step 1: Get or create user wallet
        let walletAddress = null;
        try {
          const response = await fetch('/api/wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'createUserWallet', userId: user.id }),
          });
          const data = await response.json();
          if (data.success) {
            walletAddress = data.address;
            setUserWalletAddress(data.address);
          } else {
            throw new Error(data.error);
          }
        } catch (walletError) {
          console.error('Wallet creation/retrieval failed:', walletError);
          setError('Failed to initialize wallet. Please try refreshing the page.');
          return;
        }

        // Step 2: First try to fetch existing pets
        let pet = null;
        try {
          console.log('Fetching existing pets for user:', user.id);
          const existingPetResponse = await fetch(`/api/pets?userId=${encodeURIComponent(user.id)}`);
          
          if (!existingPetResponse.ok) {
            throw new Error(`HTTP ${existingPetResponse.status}: ${existingPetResponse.statusText}`);
          }
          
          const existingPetData = await existingPetResponse.json();
          console.log('Existing pet data response:', existingPetData);
          
          if (existingPetData.success && existingPetData.pets && existingPetData.pets.length > 0) {
            // User has existing pets - use the first active one
            pet = existingPetData.pets[0];
            console.log('Found existing pet:', pet.name, 'with XP:', pet.xp, 'Pet ID:', pet.id);
            console.log('Pet wallet info - Address:', pet.petWalletAddress, 'ID:', pet.petWalletId);
          } else {
            // No existing pets found - create a new one
            console.log('No existing pets found, creating new pet...');
            const petResponse = await fetch('/api/pets', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'createPet',
                userId: user.id,
                name: 'Buddy',
                userWalletAddress: walletAddress
              }),
            });
            
            if (!petResponse.ok) {
              const errorText = await petResponse.text();
              console.error('Pet creation failed with status:', petResponse.status, 'Response:', errorText);
              throw new Error(`HTTP ${petResponse.status}: ${petResponse.statusText}`);
            }
            
            const petData = await petResponse.json();
            console.log('Pet creation response:', petData);
            if (petData.success) {
              pet = petData.pet;
              console.log('Pet from API response:', pet.name, 'Pet ID:', pet.id);
            } else {
              throw new Error(petData.error);
            }
          }
        } catch (petError) {
          console.error('Pet initialization failed:', petError);
          const errorMessage = petError instanceof Error ? petError.message : String(petError);
          if (errorMessage.includes('Failed to fetch')) {
            setError('Network error: Unable to connect to the server. Please check your internet connection and try refreshing the page.');
          } else {
            setError('Failed to initialize your pet. Please try refreshing the page.');
          }
          return;
        }

        // Create or get pet wallet via API using the actual pet ID - only if pet doesn't already have a wallet
        let petWallet;
        if (pet.petWalletAddress && pet.petWalletId) {
          // Pet already has a wallet, use existing wallet info
          petWallet = {
            id: pet.petWalletId,
            address: pet.petWalletAddress,
            network: 'base-sepolia' // Default network
          };
          console.log('Using existing pet wallet:', petWallet.address);
        } else {
          // Pet doesn't have a wallet, create one
          try {
            console.log('Pet has no wallet, creating new wallet for pet:', pet.id);
            const response = await fetch('/api/wallet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                action: 'createPetWallet', 
                petId: pet.id,
                userId: user.id
              }),
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (data.success) {
              // Handle both existing wallet (data.wallet) and new wallet (data.address) response structures
              petWallet = data.wallet || {
                id: data.walletId,
                address: data.address,
                network: data.network
              };
              console.log('Pet wallet created:', petWallet.address);
            } else {
              throw new Error(data.error);
            }
          } catch (petWalletError) {
            console.error('Pet wallet initialization failed:', petWalletError);
            const errorMessage = petWalletError instanceof Error ? petWalletError.message : String(petWalletError);
            if (errorMessage.includes('Failed to fetch')) {
              setError('Network error: Unable to connect to the wallet service. Please check your internet connection and try refreshing the page.');
            } else {
              setError('Failed to initialize pet wallet. Please try refreshing the page.');
            }
            return;
          }
        }

        // Update pet with wallet information if needed
        if (pet && petWallet && petWallet.address && !pet.petWalletAddress) {
          try {
            const updateResponse = await fetch('/api/pets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'updatePet',
                petId: pet.id,
                updates: {
                  petWalletAddress: petWallet.address,
                  petWalletId: petWallet.id
                }
              }),
            });
            
            if (!updateResponse.ok) {
              throw new Error(`HTTP ${updateResponse.status}: ${updateResponse.statusText}`);
            }
            
            const updateData = await updateResponse.json();
            if (updateData.success) {
              // Update local pet object with wallet info
              pet = { ...pet, petWalletAddress: petWallet.address, petWalletId: petWallet.id };
              console.log('Pet updated with wallet information');
            }
          } catch (updateError) {
            console.error('Failed to update pet with wallet info:', updateError);
            const errorMessage = updateError instanceof Error ? updateError.message : String(updateError);
            if (errorMessage.includes('Failed to fetch')) {
              console.warn('Network error updating pet wallet info, but continuing...');
            }
            // Continue anyway - pet exists, just wallet link might be missing
          }
        }

        // Set the pet state to trigger UI rendering
        setPet(pet);
        setIsLoading(false);

      } catch (error) {
        console.error('App initialization failed:', error);
        setError('Failed to initialize app. Please try refreshing the page.');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [authenticated, user?.id]); // Only depend on user.id to avoid infinite loops

  const handleFeedPet = async () => {
    if (!pet) return;

    try {
      // Update pet via API
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'interactWithPet',
          petId: pet.id,
          interactionType: 'feed'
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPet(data.pet);
      } else {
        throw new Error(data.error);
      }

      // Generate AI response for feeding
      try {
        const response = await generateActionResponse('feed', data.pet || pet);
        console.log('Pet response:', response);
      } catch (aiError) {
        console.error('AI response failed:', aiError);
      }
    } catch (error) {
      console.error('Failed to feed pet:', error);
      // Fallback to local update
      const updatedPet = updatePetAfterInteraction(pet, 'feed');
      setPet(updatedPet);
    }
  };

  const handlePlayWithPet = async () => {
    if (!pet) return;

    try {
      // Update pet via API
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'interactWithPet',
          petId: pet.id,
          interactionType: 'play'
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPet(data.pet);
      } else {
        throw new Error(data.error);
      }

      // Generate AI response for playing
      try {
        const response = await generateActionResponse('play', data.pet || pet);
        console.log('Pet response:', response);
      } catch (aiError) {
        console.error('AI response failed:', aiError);
      }
    } catch (error) {
      console.error('Failed to play with pet:', error);
      // Fallback to local update
      const updatedPet = updatePetAfterInteraction(pet, 'play');
      setPet(updatedPet);
    }
  };

  const handleRestPet = async () => {
    if (!pet) return;

    try {
      // Update pet via API
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'interactWithPet',
          petId: pet.id,
          interactionType: 'groom'
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPet(data.pet);
      } else {
        throw new Error(data.error);
      }

      // Generate AI response for resting
      try {
        const response = await generateActionResponse('rest', data.pet || pet);
        console.log('Pet response:', response);
      } catch (aiError) {
        console.error('AI response failed:', aiError);
      }
    } catch (error) {
      console.error('Failed to rest pet:', error);
      // Fallback to local update
      const updatedPet = updatePetAfterInteraction(pet, 'chat');
      setPet(updatedPet);
    }
  };

  const handlePetStore = async () => {
    if (!pet) return;

    try {
      // Open the Pet Store Modal
      console.log('Opening pet store...');
      setIsStoreModalOpen(true);
      
    } catch (error) {
      console.error('Failed to open pet store:', error);
    }
  };

  // Loading screen
  if (!ready || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading StreakPets...</p>
        </div>
      </div>
    );
  }

  // Authentication screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 p-8 max-w-lg w-full text-center">
          <div className="text-6xl mb-6">🐾</div>
          <h1 className="text-3xl font-bold text-white mb-4">StreakPets</h1>
          <p className="text-white/80 mb-8">Your AI-powered digital companion for building lasting habits</p>
          
          {/* Features Section */}
          <div className="mb-8 space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🤝</span>
              <div>
                <h3 className="text-white font-semibold">Co-raise Pets</h3>
                <p className="text-white/70 text-sm">Raise digital pets together through chat</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-2xl">💬</span>
              <div>
                <h3 className="text-white font-semibold">XMTP Chat</h3>
                <p className="text-white/70 text-sm">Secure wallet-to-wallet messaging</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="text-white font-semibold">AI Companions</h3>
                <p className="text-white/70 text-sm">Pets that grow and learn with you</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-2xl">❤️</span>
              <div>
                <h3 className="text-white font-semibold">Share the Joy</h3>
                <p className="text-white/70 text-sm">Share the joy of raising digital companions</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-white/70 text-sm">Sign in to create your pet and start your journey</p>
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-400 hover:to-blue-400 transition-all duration-200 shadow-lg"
            >
              Sign In to Get Started
            </button>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/60 text-xs">
              Sign in with Google or your phone number to create your digital pet companion
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-2 sm:p-4">
      <div className="mx-auto w-full" style={{ maxWidth: '485px' }}>
        {/* Error Display */}
        {error && (
          <div className="mb-2 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200 text-sm">{error}</p>
          </div>
        )}

        {pet && (
          <div className="grid grid-cols-1">
            {/* Combined Login and Pet Display - No spacing */}
            <div className="flex flex-col">
              <LoginButton />
              <PetDisplay 
                pet={pet} 
                walletAddress={walletAddress || undefined}
                onAction={(action) => {
                switch(action) {
                  case 'feed':
                    handleFeedPet();
                    break;
                  case 'play':
                    handlePlayWithPet();
                    break;
                  case 'groom':
                    handleRestPet();
                    break;
                  case 'store':
                    handlePetStore();
                    break;
                }
              }}
                onPetUpdate={(updatedPet) => {
                  setPet(updatedPet);
                }} />
            </div>
          </div>
        )}

        {/* Pet Store Modal */}
        {pet && (
          <PetStoreModal
            isOpen={isStoreModalOpen}
            onClose={() => setIsStoreModalOpen(false)}
            pet={pet}
            userWalletAddress={walletAddress || ''}
            onPurchaseComplete={(updatedPet) => {
              setPet(updatedPet);
              setIsStoreModalOpen(false);
            }}
          />
        )}
      </div>
    </main>
  );
}
