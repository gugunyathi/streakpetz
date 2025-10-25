'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import SendModal from './SendModal';
import ReceiveModal from './ReceiveModal';

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
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
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
      
      setIsLoadingBalance(true);
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
        setIsLoadingBalance(false);
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

  const openSendModal = () => {
    setIsSendModalOpen(true);
    setIsOpen(false);
  };

  const openReceiveModal = () => {
    setIsReceiveModalOpen(true);
    setIsOpen(false);
  };

  const handleSendSuccess = () => {
    // Refresh balance after successful send
    if (isOpen) {
      setIsLoadingBalance(true);
      fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'getBalance',
          walletAddress,
          asset: 'USDC'
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUsdcBalance(data.balance || '0.00');
          }
        })
        .catch(err => console.error('Failed to refresh balance:', err))
        .finally(() => setIsLoadingBalance(false));
    }
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
                  {isLoadingBalance ? (
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
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={openReceiveModal}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500/30 hover:bg-green-500/40 text-green-200 font-semibold rounded-lg transition-colors border border-green-500/30 shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8l-8-8-8 8" />
                  </svg>
                  Receive
                </button>
                <button
                  onClick={openSendModal}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 font-semibold rounded-lg transition-colors border border-blue-500/30 shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20v-16m-8 8l8 8 8-8" />
                  </svg>
                  Send
                </button>
              </div>
              <button
                onClick={handleViewAllAssets}
                className="w-full px-4 py-2 bg-white/10 hover:bg-white/15 text-white/80 font-medium rounded-lg transition-colors border border-white/20"
              >
                View All Assets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      <SendModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        walletAddress={walletAddress}
        usdcBalance={usdcBalance}
        onSuccess={handleSendSuccess}
      />

      {/* Receive Modal */}
      <ReceiveModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        walletAddress={walletAddress}
      />
    </div>
  );
}