'use client';

import { useState } from 'react';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
}

export default function ReceiveModal({ isOpen, onClose, walletAddress }: ReceiveModalProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate QR code URL using a free QR code API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${walletAddress}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100001] p-2 sm:p-4 pt-2 sm:pt-4">
      <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl w-full max-w-md overflow-hidden max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] overflow-y-auto mt-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-white">Receive USDC</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/80 transition-colors p-1 hover:bg-white/10 rounded"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Message */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-blue-300 text-sm font-medium mb-1">Send only USDC to this address</p>
                <p className="text-blue-200/70 text-xs">
                  This wallet is on <strong>Base Sepolia Testnet</strong>. Make sure the sender uses the same network.
                </p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white rounded-xl shadow-lg">
              <img
                src={qrCodeUrl}
                alt="Wallet Address QR Code"
                className="w-48 h-48"
              />
            </div>
            <p className="text-white/60 text-sm mt-3">Scan with any wallet app</p>
          </div>

          {/* Wallet Address */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Your Wallet Address
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg">
                <p className="text-white font-mono text-sm break-all">
                  {walletAddress}
                </p>
              </div>
              <button
                onClick={copyAddress}
                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all shadow-lg flex items-center gap-2"
                title="Copy address"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Network Info */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Network:</span>
                <span className="text-white font-semibold">Base Sepolia</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Chain ID:</span>
                <span className="text-white font-semibold">84532</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Token:</span>
                <span className="text-white font-semibold">USDC</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-yellow-200/80 text-xs">
                <strong>Important:</strong> Double-check the network before sending. Sending USDC on the wrong network may result in permanent loss of funds.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg transition-colors border border-white/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
