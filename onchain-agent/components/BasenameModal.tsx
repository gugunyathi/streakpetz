'use client';

import React, { useState } from 'react';
import { autoRegisterPetBasename, generatePetBasename } from '../lib/pet-wallet-auto';

interface BasenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  petWalletAddress: string;
  petWalletId?: string;
  petName: string;
  petId?: string;
  onBasenameRegistered: (basename: string) => void;
}

export default function BasenameModal({
  isOpen,
  onClose,
  petWalletAddress,
  petWalletId,
  petName,
  petId,
  onBasenameRegistered
}: BasenameModalProps) {
  const [basename, setBasename] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [useAutoMode, setUseAutoMode] = useState(true);

  const validateBasename = (name: string): boolean => {
    if (name.length < 3 || name.length > 20) return false;
    return /^[a-z0-9-]+$/.test(name);
  };

  const handleAutoRegistration = async () => {
    if (!petId) {
      setError('Pet ID not found. Cannot auto-register basename.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Auto-registering basename for pet:', petId, petName);
      
      // Generate automatic basename
      const autoBasename = generatePetBasename(petName, petId, 'base-sepolia');
      
      // Auto-register the basename
      const result = await autoRegisterPetBasename({
        petId,
        baseName: autoBasename,
        network: 'base-sepolia'
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to auto-register basename');
      }

      // Handle pending transactions
      if (result.pending) {
        setSuccess(`✨ Automatic registration submitted! ${result.message}`);
        if (result.transactionLink) {
          console.log('Transaction link:', result.transactionLink);
        }
      } else {
        setSuccess(`🎉 Successfully auto-registered ${result.baseName}!`);
      }
      
      onBasenameRegistered(result.baseName || autoBasename);
      
      // Close modal after success
      setTimeout(() => {
        onClose();
        setBasename('');
        setSuccess('');
      }, 3000);

    } catch (err) {
      console.error('Auto basename registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to auto-register basename');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('BasenameModal - Props received:', { petWalletId, petWalletAddress, petName });
    
    if (!petWalletId) {
      setError('Pet wallet ID not found. Please ensure your pet has a wallet.');
      return;
    }
    
    if (!validateBasename(basename)) {
      setError('Basename must be 3-20 characters, lowercase letters, numbers, and hyphens only');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Registering basename:', basename, 'for pet wallet:', petWalletId);
      
      // Create the full basename with .basetest.eth suffix for Base Sepolia
      const fullBasename = `${basename}.basetest.eth`;
      
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'registerBasename',
          walletId: petWalletId,
          baseName: fullBasename
        }),
      });

      const data = await response.json();
      console.log('Basename registration response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register basename');
      }

      // Handle pending transactions
      if (data.pending) {
        setSuccess(`Transaction submitted! ${data.message}`);
        if (data.transactionLink) {
          console.log('Transaction link:', data.transactionLink);
          // Optionally show transaction link to user
        }
      } else {
        setSuccess(`Successfully registered ${fullBasename}!`);
      }
      
      onBasenameRegistered(fullBasename);
      
      // Close modal after success
      setTimeout(() => {
        onClose();
        setBasename('');
        setSuccess('');
      }, 2000);

    } catch (err) {
      console.error('Basename registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register basename');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setBasename('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100001] p-2 sm:p-4 pt-2 sm:pt-4">
      <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl rounded-2xl border border-white/20 p-6 w-full max-w-md mx-auto shadow-2xl max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto mt-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏷️</span>
            <h2 className="text-white text-xl font-bold">Register Basename</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Description */}
        <p className="text-white/80 text-sm mb-4">
          Give your pet <span className="text-purple-300 font-medium">{petName}</span> a memorable name on Base network
        </p>

        {/* Pet Wallet Info */}
        <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
          <div className="text-xs text-white/60 mb-1">Pet Wallet Address:</div>
          <div className="text-white/80 text-xs font-mono break-all">
            {petWalletAddress || 'Not available'}
          </div>
          {petWalletId && (
            <>
              <div className="text-xs text-white/60 mb-1 mt-2">Pet Wallet ID:</div>
              <div className="text-white/80 text-xs font-mono break-all">
                {petWalletId}
              </div>
            </>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setUseAutoMode(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                useAutoMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              🤖 Auto Register
            </button>
            <button
              onClick={() => setUseAutoMode(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !useAutoMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              ✏️ Manual
            </button>
          </div>
        </div>

        {useAutoMode ? (
          /* Auto Registration Mode */
          <div className="space-y-4">
            <div className="bg-purple-500/20 border border-purple-400/30 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-200 mb-2">🚀 Automatic Registration</h3>
              <p className="text-purple-100 text-sm mb-3">
                Your pet will automatically get a unique basename without any manual signing required!
              </p>
              <p className="text-purple-200 text-xs">
                Generated basename: <strong>{petId ? generatePetBasename(petName, petId, 'base-sepolia') : 'Loading...'}</strong>
              </p>
            </div>

            <button
              onClick={handleAutoRegistration}
              disabled={isLoading || !petId}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Auto-registering...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Auto Register Basename
                </>
              )}
            </button>
          </div>
        ) : (
          /* Manual Registration Mode */
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={basename}
                onChange={(e) => setBasename(e.target.value.toLowerCase())}
                placeholder="buddy"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                disabled={isLoading}
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 text-sm">
                .basetest.eth
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !basename || !validateBasename(basename)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Registering...
                </>
              ) : (
                <>
                  <span>🏷️</span>
                  Register Basename
                </>
              )}
            </button>
          </form>
        )}

        {/* Info */}
        <div className="mt-4 space-y-1 text-xs text-white/60">
          <div className="flex items-center gap-1">
            <span>•</span>
            <span>Basename registration requires a small fee</span>
          </div>
          <div className="flex items-center gap-1">
            <span>•</span>
            <span>Only lowercase letters, numbers, and hyphens allowed</span>
          </div>
          <div className="flex items-center gap-1">
            <span>•</span>
            <span>3-20 characters required</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-green-300 text-sm">{success}</p>
          </div>
        )}

        {/* Wallet Info */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-white/60 text-xs mb-1">Pet Wallet Address:</p>
          <p className="text-white/80 text-xs font-mono break-all">{petWalletAddress}</p>
        </div>
      </div>
    </div>
  );
}