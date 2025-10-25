'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { executeUSDCPayment, waitForTransactionConfirmation } from '@/lib/simple-payment';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SimplePayButtonProps {
  amount: number; // Amount in cents (e.g., 250 = $2.50)
  walletAddress: string;
  recipientAddress?: string;
  onPaymentSuccess: (txHash: string) => void;
  onPaymentError: (error: string) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const SimplePayButton: React.FC<SimplePayButtonProps> = ({
  amount,
  walletAddress,
  recipientAddress,
  onPaymentSuccess,
  onPaymentError,
  className = '',
  disabled = false,
  children
}) => {
  const [status, setStatus] = useState<'idle' | 'paying' | 'confirming' | 'success' | 'error'>('idle');
  
  const handlePayment = async () => {
    if (disabled || status !== 'idle') return;
    
    try {
      setStatus('paying');
      console.log(`💳 Simulating payment of $${(amount / 100).toFixed(2)}...`);
      
      // Simulate payment delay (1.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate fake transaction hash
      const fakeTransactionHash = `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      
      console.log(`✅ Payment simulated! Transaction hash: ${fakeTransactionHash}`);
      
      // Simulate confirmation
      setStatus('confirming');
      console.log(`⏳ Simulating confirmation...`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`✅ Payment confirmed!`);
      setStatus('success');
      onPaymentSuccess(fakeTransactionHash);
      
      // Reset after animation
      setTimeout(() => setStatus('idle'), 2000);
      
    } catch (error) {
      console.error('❌ Payment failed:', error);
      setStatus('error');
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
      
      // Reset after showing error
      setTimeout(() => setStatus('idle'), 3000);
    }
  };
  
  const getButtonContent = () => {
    switch (status) {
      case 'paying':
        return (
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending...</span>
          </div>
        );
      case 'confirming':
        return (
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Confirming...</span>
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
  
  const getButtonColor = () => {
    switch (status) {
      case 'paying':
      case 'confirming':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700';
    }
  };
  
  return (
    <motion.button
      onClick={handlePayment}
      disabled={disabled || status !== 'idle'}
      className={`${getButtonColor()} text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      whileHover={!disabled && status === 'idle' ? { scale: 1.02 } : {}}
      whileTap={!disabled && status === 'idle' ? { scale: 0.98 } : {}}
    >
      {getButtonContent()}
    </motion.button>
  );
};

export default SimplePayButton;
