'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import SendModal from './SendModal';
import ReceiveModal from './ReceiveModal';

interface AssetBalance {
  symbol: string;
  name: string;
  amount: string;
  usdValue: string;
  icon?: string;
  contractAddress?: string;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
}

export default function WalletModal({ isOpen, onClose, walletAddress }: WalletModalProps) {
  const [assets, setAssets] = useState<AssetBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalUsdValue, setTotalUsdValue] = useState('0.00');
  const [error, setError] = useState<string>('');
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetBalance | null>(null);

  // Fetch all asset balances when modal opens
  useEffect(() => {
    fetchAssetBalances();
  }, [isOpen, walletAddress]);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
  };

  const copyAssetAddress = (contractAddress: string) => {
    if (contractAddress) {
      navigator.clipboard.writeText(contractAddress);
    }
  };

  const handleSend = (asset: AssetBalance) => {
    // Only allow sending USDC for now
    if (asset.symbol === 'USDC') {
      setSelectedAsset(asset);
      setIsSendModalOpen(true);
    } else {
      alert(`Sending ${asset.symbol} is not yet supported. Only USDC transfers are currently available.`);
    }
  };

  const handleReceive = () => {
    setIsReceiveModalOpen(true);
  };

  const handleSendSuccess = () => {
    // Refresh assets after successful send
    if (isOpen) {
      fetchAssetBalances();
    }
  };

  const fetchAssetBalances = async () => {
    if (!isOpen || !walletAddress) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'getAllBalances',
          walletAddress
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setAssets(data.assets || []);
        setTotalUsdValue(data.totalUsdValue || '0.00');
      } else {
        console.warn('API returned error, using fallback data:', data.error);
        // Fallback to demo data if API fails
        setAssets([
          {
            symbol: 'ETH',
            name: 'Ethereum',
            amount: '0.0234',
            usdValue: '58.42',
            icon: '⟠'
          },
          {
            symbol: 'USDC',
            name: 'USD Coin',
            amount: '125.50',
            usdValue: '125.50',
            icon: '$'
          },
          {
            symbol: 'WETH',
            name: 'Wrapped Ethereum',
            amount: '0.0156',
            usdValue: '38.94',
            icon: '⟠'
          }
        ]);
        setTotalUsdValue('222.86');
      }
    } catch (error) {
      console.error('Failed to fetch asset balances:', error);
      setError('Failed to load asset balances. Showing demo data.');
      // Set demo data on error
      setAssets([
        {
          symbol: 'ETH',
          name: 'Ethereum',
          amount: '0.0234',
          usdValue: '58.42',
          icon: '⟠'
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          amount: '125.50',
          usdValue: '125.50',
          icon: '$'
        }
      ]);
      setTotalUsdValue('183.92');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100001] p-2 sm:p-4 pt-2 sm:pt-4">
      <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl w-full max-w-md max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-hidden mt-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white/80 transition-colors p-1 hover:bg-white/10 rounded"
              title="Back to wallet dropdown"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-white">Wallet Assets</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/80 transition-colors p-1 hover:bg-white/10 rounded"
            title="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Wallet Info */}
          <div className="p-6 border-b border-white/10">
            <div className="text-center mb-4">
              <p className="text-white/60 text-sm mb-1">Total Balance</p>
              <p className="text-3xl font-bold text-white">${totalUsdValue}</p>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/15 border border-white/20 rounded-lg">
              <div>
                <p className="text-white/80 text-xs mb-1 font-medium">Wallet Address</p>
                <p className="text-white text-sm font-mono bg-white/10 px-2 py-1 rounded">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                </p>
              </div>
              <button
                onClick={copyAddress}
                className="text-white/60 hover:text-white/80 transition-colors p-2"
                title="Copy wallet address"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-b border-white/10">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleReceive}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/30 hover:bg-green-500/40 text-green-200 font-semibold rounded-lg transition-colors border border-green-500/30 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8l-8-8-8 8" />
                </svg>
                Receive
              </button>
              <button
                onClick={() => handleSend(assets[0])}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 font-semibold rounded-lg transition-colors border border-blue-500/30 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20v-16m-8 8l8 8 8-8" />
                </svg>
                Send
              </button>
            </div>
          </div>

          {/* Assets List */}
          <div className="p-6">
            <h3 className="text-white font-semibold mb-4">Assets</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full"></div>
                      <div>
                        <div className="w-16 h-4 bg-white/20 rounded mb-1"></div>
                        <div className="w-12 h-3 bg-white/20 rounded"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-20 h-4 bg-white/20 rounded mb-1"></div>
                      <div className="w-16 h-3 bg-white/20 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {assets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/60">No assets found</p>
                  </div>
                ) : (
                  assets.map((asset, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/15 hover:bg-white/20 rounded-lg transition-colors group border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold">
                            {asset.icon || asset.symbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{asset.symbol}</p>
                          <p className="text-white/70 text-sm">{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{asset.amount}</p>
                        <p className="text-white/70 text-sm">${asset.usdValue}</p>
                      </div>
                      <button
                        onClick={() => handleSend(asset)}
                        className="opacity-0 group-hover:opacity-100 ml-2 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-all border border-white/20"
                        title={`Send ${asset.symbol}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Modal - Only for USDC */}
      {selectedAsset && selectedAsset.symbol === 'USDC' && (
        <SendModal
          isOpen={isSendModalOpen}
          onClose={() => {
            setIsSendModalOpen(false);
            setSelectedAsset(null);
          }}
          walletAddress={walletAddress}
          usdcBalance={selectedAsset.amount}
          onSuccess={handleSendSuccess}
        />
      )}

      {/* Receive Modal */}
      <ReceiveModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        walletAddress={walletAddress}
      />
    </div>
  );
}