'use client';

import React, { useState } from 'react';

interface BasenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  petWalletAddress: string;
  petWalletId?: string;
  petName: string;
  onBasenameRegistered: (basename: string) => void;
}

export default function BasenameModal({
  isOpen,
  onClose,
  petWalletAddress,
  petWalletId,
  petName,
  onBasenameRegistered
}: BasenameModalProps) {
  const [basename, setBasename] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateBasename = (name: string): boolean => {
    if (name.length < 3 || name.length > 20) return false;
    return /^[a-z0-9-]+$/.test(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateBasename(basename)) {
      setError('Basename must be 3-20 characters, lowercase letters, numbers, and hyphens only');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'registerBasename',
          walletId: petWalletId,
          basename: basename
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register basename');
      }

      const fullBasename = `${basename}.basetest.eth`;
      setSuccess(`Successfully registered ${fullBasename}!`);
      onBasenameRegistered(fullBasename);
      
      // Close modal after success
      setTimeout(() => {
        onClose();
        setBasename('');
        setSuccess('');
      }, 2000);

    } catch (err) {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl rounded-2xl border border-white/20 p-6 w-full max-w-md mx-auto shadow-2xl">
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
        <p className="text-white/80 text-sm mb-6">
          Give your pet <span className="text-purple-300 font-medium">{petName}</span> a memorable name on Base network
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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