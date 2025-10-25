'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { executeGasFreePayment, getWalletUSDCBalance } from '@/lib/wallet';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// IMPORTANT: This application is configured to use Base Sepolia (Chain ID: 84532) ONLY
// All payment operations are locked to testnet for safety

interface BasePayButtonProps {
  amount: number; // Amount in USDC cents
  walletAddress: string; // User wallet address for payment
  recipientAddress?: string; // Recipient wallet address (defaults to store wallet)
  network?: 'base-mainnet' | 'base-sepolia'; // Network parameter (ignored - always uses base-sepolia)
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

// Chain ID validation constants
// Default Chain: Base Sepolia Testnet (84532)
const CHAIN_IDS = {
  'base-mainnet': 8453,
  'base-sepolia': 84532 // ✅ DEFAULT - All payments use this chain
} as const;

// Validate network and force Base Sepolia for all payments
function validatePaymentNetwork(network: 'base-mainnet' | 'base-sepolia'): 'base-sepolia' {
  // ALWAYS return base-sepolia regardless of input - safety measure
  if (network === 'base-mainnet') {
    console.warn('⚠️  Mainnet payment attempted but blocked. Forcing Base Sepolia testnet (Chain ID: 84532)');
  }
  console.log('✅ Using Base Sepolia testnet (Chain ID: 84532) for payment');
  return 'base-sepolia';
}

const BasePayButton: React.FC<BasePayButtonProps> = ({
  amount,
  walletAddress,
  recipientAddress = '0x226710d13E6c16f1c99F34649526bD3bF17cd010', // Store wallet address
  network: _network = 'base-sepolia', // This parameter is now ignored
  onPaymentSuccess,
  onPaymentError,
  className = '',
  disabled = false,
  children
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handlePayment = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // FORCE Base Sepolia (Chain ID: 84532) for all payments
      const network = validatePaymentNetwork(_network);
      
      // Log network and chain ID for debugging
      const expectedChainId = CHAIN_IDS[network];
      console.log(`🔗 Payment locked to Base Sepolia testnet (Chain ID: ${expectedChainId})`);

      
      // Validate wallet address
      if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
        throw new Error('Invalid wallet address. Please connect your wallet.');
      }

      // Validate recipient address
      if (!recipientAddress || !recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
        throw new Error('Invalid recipient address configuration.');
      }

      // Check wallet balance first
      console.log(`Checking USDC balance for wallet: ${walletAddress} on ${network}`);
      const { balance, error: balanceError } = await getWalletUSDCBalance(walletAddress, network);
      
      if (balanceError) {
        console.error('Balance check failed:', balanceError);
        throw new Error(`Failed to check balance: ${balanceError}`);
      }
      
      console.log(`Current balance: $${(balance / 100).toFixed(2)}, Required: $${(amount / 100).toFixed(2)}`);
      
      if (balance < amount) {
        throw new Error(`Insufficient USDC balance. Required: $${(amount / 100).toFixed(2)}, Available: $${(balance / 100).toFixed(2)}`);
      }
      
      // Execute gas-free USDC payment using paymaster
      console.log(`Processing gas-free USDC payment of $${(amount / 100).toFixed(2)} from wallet: ${walletAddress} to: ${recipientAddress} on ${network}`);
      
      const paymentResult = await executeGasFreePayment(
        walletAddress,
        recipientAddress,
        amount,
        network
      );
      
      if (!paymentResult.success) {
        console.error('Payment execution failed:', paymentResult.error);
        console.error('Payment error code:', paymentResult.code);
        
        // Check if error is related to missing wallet data
        if (paymentResult.code === 'WALLET_NEEDS_REPAIR' ||
            paymentResult.error?.includes('wallet needs to be reinitialized') || 
            paymentResult.error?.includes('Wallet data not found')) {
          // Attempt to repair the wallet automatically
          console.log('Attempting automatic wallet repair for address:', walletAddress);
          setPaymentStatus('processing');
          
          try {
            const repairResponse = await fetch('/api/wallet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'repairWallet',
                walletAddress
              })
            });
            
            const repairResult = await repairResponse.json();
            
            if (repairResult.success) {
              console.log('✅ Wallet repaired successfully. User should retry payment.');
              setPaymentStatus('idle');
              setIsProcessing(false);
              throw new Error('Wallet repaired successfully! Please click Buy again to complete your purchase.');
            } else {
              console.error('Wallet repair failed:', repairResult.error);
              throw new Error('Unable to repair wallet automatically. Please click the "Reconnect Wallet" button at the top of the store.');
            }
          } catch (repairError) {
            console.error('Wallet repair attempt failed:', repairError);
            throw repairError instanceof Error ? repairError : new Error('Wallet repair failed. Please use the Reconnect Wallet button.');
          }
        }
        
        throw new Error(paymentResult.error || 'Payment failed');
      }
      
      console.log('Payment successful:', paymentResult.transactionHash);
      setPaymentStatus('success');
      onPaymentSuccess(paymentResult.transactionHash || `gas_free_${Date.now()}`);
      
      // Reset status after success animation
      setTimeout(() => {
        setPaymentStatus('idle');
        setIsProcessing(false);
      }, 1500);
      
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('error');
      setIsProcessing(false);
      
      // Provide more detailed error messages
      let errorMessage = 'Payment failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      onPaymentError(errorMessage);
      
      // Reset status after error
      setTimeout(() => {
        setPaymentStatus('idle');
      }, 3000);
    }
  };

  const getButtonContent = () => {
    switch (paymentStatus) {
      case 'processing':
        return (
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Success!</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Failed</span>
          </div>
        );
      default:
        return children || (
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Pay ${(amount / 100).toFixed(2)}</span>
          </div>
        );
    }
  };

  const getButtonStyles = () => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 
      focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
    `;
    
    switch (paymentStatus) {
      case 'processing':
        return `${baseStyles} bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500`;
      case 'success':
        return `${baseStyles} bg-green-500 text-white focus:ring-green-500`;
      case 'error':
        return `${baseStyles} bg-red-500 text-white focus:ring-red-500`;
      default:
        return `${baseStyles} bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 shadow-lg hover:shadow-xl`;
    }
  };

  return (
    <motion.button
      onClick={handlePayment}
      disabled={disabled || isProcessing}
      className={`${getButtonStyles()} ${className}`}
      whileHover={!disabled && !isProcessing ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isProcessing ? { scale: 0.98 } : {}}
      animate={{
        backgroundColor: paymentStatus === 'success' ? '#10B981' : 
                        paymentStatus === 'error' ? '#EF4444' : undefined
      }}
    >
      {getButtonContent()}
    </motion.button>
  );
};

export default BasePayButton;