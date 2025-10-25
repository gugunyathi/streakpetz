'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  usdcBalance: string;
  onSuccess?: () => void;
}

export default function SendModal({ isOpen, onClose, walletAddress, usdcBalance, onSuccess }: SendModalProps) {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');

  const validateAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleSend = async () => {
    setError('');
    setSuccess(false);

    // Validation
    if (!recipientAddress.trim()) {
      setError('Please enter a recipient address');
      return;
    }

    if (!validateAddress(recipientAddress)) {
      setError('Invalid Ethereum address format');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const sendAmount = parseFloat(amount);
    const balance = parseFloat(usdcBalance);

    if (sendAmount > balance) {
      setError(`Insufficient balance. You have ${usdcBalance} USDC`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAddress: walletAddress,
          toAddress: recipientAddress,
          amount: sendAmount, // Send USDC amount directly (e.g., 2.00)
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTxHash(data.transactionHash || 'N/A');
        setRecipientAddress('');
        setAmount('');
        
        // Call success callback after 2 seconds
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Transaction failed. Please try again.');
      }
    } catch (error) {
      console.error('Send transaction error:', error);
      setError('Failed to send transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    setAmount(usdcBalance);
  };

  const handleClose = () => {
    if (!isLoading) {
      setRecipientAddress('');
      setAmount('');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100001] p-2 sm:p-4 pt-2 sm:pt-4">
      <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl w-full max-w-md overflow-hidden max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto mt-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">Send USDC</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-white/60 hover:text-white/80 transition-colors p-1 hover:bg-white/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-300 font-semibold">Transaction Sent!</p>
              </div>
              <p className="text-green-200/80 text-sm">
                Your USDC transfer has been submitted successfully.
              </p>
              {txHash && txHash !== 'N/A' && (
                <a
                  href={`https://sepolia.basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-300 text-sm underline hover:text-green-200 mt-2 inline-block"
                >
                  View on BaseScan →
                </a>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Balance Display */}
          <div className="p-4 bg-white/10 border border-white/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Available Balance</span>
              <span className="text-white font-bold text-lg">{usdcBalance} USDC</span>
            </div>
          </div>

          {/* Recipient Address */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0x..."
              disabled={isLoading || success}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
            />
            <p className="text-white/50 text-xs mt-1">
              Enter the recipient's wallet address
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Amount (USDC)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max={usdcBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={isLoading || success}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed pr-16"
              />
              <button
                onClick={handleMaxClick}
                disabled={isLoading || success}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 text-xs font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                MAX
              </button>
            </div>
            <p className="text-white/50 text-xs mt-1">
              Minimum: $1.00 USDC
            </p>
          </div>

          {/* Network Info */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-300 text-sm font-medium">Network: Base Sepolia</span>
            </div>
            <p className="text-blue-200/70 text-xs">
              Gas fees are covered by our paymaster - you pay $0 in gas! 🎉
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/15 text-white/80 font-semibold rounded-lg transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading || success || !recipientAddress || !amount}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : success ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sent!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send USDC
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
