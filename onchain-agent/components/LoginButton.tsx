'use client';

import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import WalletDropdown from './WalletDropdown';
import WalletModal from './WalletModal';

export default function LoginButton() {
  const { ready, authenticated, user, login, logout, walletAddress } = useAuth();
  const [walletStatus, setWalletStatus] = useState<'loading' | 'connected' | 'error' | 'none'>('none');
  const [walletInfo, setWalletInfo] = useState<{
    address: string;
    walletId: string;
    network: string;
  } | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
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

  // Fetch wallet information when user is authenticated
  useEffect(() => {
    const fetchWalletInfo = async () => {
      if (!authenticated || !user) return;
      
      setWalletStatus('loading');
      
      try {
        // Check if user has wallet address from auth context
        if (walletAddress && walletAddress !== 'pending-wallet-creation') {
          setWalletInfo({
            address: walletAddress,
            walletId: 'server-wallet',
            network: 'base-sepolia'
          });
          setWalletStatus('connected');
          return;
        }

        // If no wallet address in context, try to fetch from API
        const response = await fetch('/api/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'createUserWallet',
            userId: user.id,
            userEmail: user.email,
            userPhone: user.phone
          }),
        });
        
        const data = await response.json();
        if (data.success) {
          setWalletInfo({
            address: data.address,
            walletId: data.walletId,
            network: data.network || 'base-sepolia'
          });
          setWalletStatus('connected');
        } else {
          setWalletStatus('error');
        }
      } catch (error) {
        console.error('Failed to fetch wallet info:', error);
        setWalletStatus('error');
      }
    };

    fetchWalletInfo();
  }, [authenticated, user, walletAddress]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
        <h2 className="text-xl font-bold text-white">Welcome to StreakPet!</h2>
        <p className="text-white/80 text-center">
          Sign in with your Google account or phone number
        </p>
        <button
          onClick={login}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
        >
          Sign In
        </button>
      </div>
    );
  }

  const getWalletStatusDisplay = () => {
    switch (walletStatus) {
      case 'loading':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-200 text-xs">Setting up wallet...</span>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-200 text-xs">CDP Server Wallet</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-200 text-xs">Wallet Error</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="text-gray-300 text-xs">No Wallet</span>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-white/10 backdrop-blur-sm rounded-t-xl border border-white/10 border-b-0 relative z-[100000]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">
            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </span>
        </div>
        <div>
          <p className="text-white font-medium text-xs">
            {user?.name || user?.email || user?.phone || 'User'}
          </p>
          {getWalletStatusDisplay()}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Wallet Dropdown - show when wallet info is available */}
        {walletInfo && walletInfo.address && walletInfo.address !== 'pending-wallet-creation' && (
          <WalletDropdown 
            walletAddress={walletInfo.address}
            onOpenModal={() => setIsWalletModalOpen(true)}
          />
        )}
        
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`px-4 py-2 text-white text-sm rounded-lg transition-all duration-200 touch-manipulation active:scale-95 ${
            isLoggingOut
              ? 'bg-gray-500/20 cursor-wait opacity-70'
              : 'bg-white/10 hover:bg-white/20 active:bg-white/30'
          }`}
          title={isLoggingOut ? "Signing out..." : "Sign Out"}
        >
          {isLoggingOut ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              <span>Signing out...</span>
            </span>
          ) : (
            'Sign Out'
          )}
        </button>
      </div>

      {/* Wallet Modal */}
      {walletInfo && (
        <WalletModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          walletAddress={walletInfo.address}
        />
      )}
    </div>
  );
}