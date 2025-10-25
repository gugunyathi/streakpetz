'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';

interface WalletBalance {
  symbol: string;
  amount: string;
  usdValue?: string;
}

interface WalletDropdownProps {
  walletAddress: string;
  onOpenModal: () => void;
}

export default function WalletDropdown({ walletAddress, onOpenModal }: WalletDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch USDC balance when dropdown opens
  useEffect(() => {
    const fetchUsdcBalance = async () => {
      if (!isOpen || !walletAddress) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'getBalance',
            walletAddress,
            asset: 'USDC'
          }),
        });
        
        const data = await response.json();
        if (data.success) {
          setUsdcBalance(data.balance || '0.00');
        } else {
          console.warn('Failed to fetch USDC balance:', data.error);
          setUsdcBalance('0.00');
        }
      } catch (error) {
        console.error('Failed to fetch USDC balance:', error);
        setUsdcBalance('0.00');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsdcBalance();
  }, [isOpen, walletAddress]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleViewAllAssets = () => {
    setIsOpen(false);
    onOpenModal();
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    // You could add a toast notification here
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Wallet Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
      >
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span className="font-medium">
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-black/80 backdrop-blur-xl rounded-xl border border-white/30 shadow-2xl z-[99999]">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Wallet</h3>
              <button
                onClick={copyAddress}
                className="text-white/60 hover:text-white/80 transition-colors"
                title="Copy wallet address"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            {/* Address */}
            <div className="mb-4">
              <p className="text-white/80 text-xs mb-1 font-medium">Address</p>
              <p className="text-white text-sm font-mono break-all bg-white/10 p-2 rounded-lg">
                {walletAddress}
              </p>
            </div>

            {/* USDC Balance */}
            <div className="mb-4">
              <div className="flex items-center justify-between p-3 bg-white/15 rounded-lg border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">$</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">USDC</p>
                    <p className="text-white/80 text-xs">USD Coin</p>
                  </div>
                </div>
                <div className="text-right">
                  {isLoading ? (
                    <div className="w-16 h-4 bg-white/20 rounded animate-pulse"></div>
                  ) : (
                    <>
                      <p className="text-white font-bold text-lg">{usdcBalance}</p>
                      <p className="text-white/80 text-xs">≈ ${usdcBalance} USD</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleViewAllAssets}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg"
              >
                View All Assets
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors border border-white/30"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}