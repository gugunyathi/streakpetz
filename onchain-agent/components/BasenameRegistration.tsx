'use client';

import React, { useState } from 'react';

interface BasenameRegistrationProps {
  petWalletAddress?: string;
  petWalletId?: string;
  petName: string;
  onBasenameRegistered?: (basename: string) => void;
}

export default function BasenameRegistration({ 
  petWalletAddress, 
  petWalletId, 
  petName,
  onBasenameRegistered 
}: BasenameRegistrationProps) {
  const [basename, setBasename] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegisterBasename = async () => {
    if (!basename.trim()) {
      setError('Please enter a basename');
      return;
    }

    if (!petWalletId) {
      setError('Pet wallet not found');
      return;
    }

    // Validate basename format
    const basenameRegex = /^[a-z0-9-]+$/;
    if (!basenameRegex.test(basename)) {
      setError('Basename can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    if (basename.length < 3 || basename.length > 20) {
      setError('Basename must be between 3 and 20 characters');
      return;
    }

    setIsRegistering(true);
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
          basename: basename.toLowerCase()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Successfully registered ${basename}.basetest.eth!`);
        setBasename('');
        if (onBasenameRegistered) {
          onBasenameRegistered(`${basename}.basetest.eth`);
        }
      } else {
        setError(data.error || 'Failed to register basename');
      }
    } catch (err) {
      console.error('Basename registration error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  if (!petWalletAddress) {
    return null;
  }

  return (
    <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-4 border border-white/10 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🏷️</span>
        <h3 className="text-white font-semibold text-sm">Register Basename</h3>
      </div>
      
      <p className="text-white/70 text-xs mb-3">
        Give your pet a memorable name on Base network
      </p>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={basename}
            onChange={(e) => setBasename(e.target.value.toLowerCase())}
            placeholder={`${petName.toLowerCase()}`}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/50 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-all"
            disabled={isRegistering}
            maxLength={20}
          />
          <span className="text-white/60 text-xs">.basetest.eth</span>
        </div>

        <button
          onClick={handleRegisterBasename}
          disabled={isRegistering || !basename.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isRegistering ? (
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

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2">
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-2">
            <p className="text-green-300 text-xs">{success}</p>
          </div>
        )}

        <div className="text-white/50 text-xs">
          <p>• Gas-free registration via Coinbase sponsorship</p>
          <p>• Only lowercase letters, numbers, and hyphens allowed</p>
          <p>• 3-20 characters required</p>
        </div>
      </div>
    </div>
  );
}