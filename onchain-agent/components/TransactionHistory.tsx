'use client';

import { useState, useEffect } from 'react';

interface Transaction {
  _id: string;
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  network: string;
  type: 'purchase' | 'transfer' | 'evolution' | 'gift' | 'basename';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  metadata?: {
    itemName?: string;
    itemType?: string;
    note?: string;
    error?: string;
  };
}

interface TransactionHistoryProps {
  userId: string;
  limit?: number;
}

export default function TransactionHistory({ userId, limit = 20 }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'purchase' | 'transfer'>('all');

  useEffect(() => {
    loadTransactions();
  }, [userId, filter]);

  const loadTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filterParam = filter !== 'all' ? `&type=${filter}` : '';
      const response = await fetch(`/api/transactions?userId=${userId}&limit=${limit}${filterParam}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions || []);
      } else {
        setError(data.error || 'Failed to load transactions');
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return '✓';
      case 'pending': return '⏳';
      case 'failed': return '✗';
      default: return '?';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase': return '🛒';
      case 'transfer': return '💸';
      case 'evolution': return '⭐';
      case 'gift': return '🎁';
      case 'basename': return '🏷️';
      default: return '📄';
    }
  };

  const formatAmount = (amount: string, token: string) => {
    try {
      // Convert from wei to token amount (assuming 6 decimals for USDC)
      const amountNum = parseFloat(amount) / 1000000;
      return `${amountNum.toFixed(2)} ${token}`;
    } catch {
      return `${amount} ${token}`;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
        <h3 className="text-white font-bold text-lg mb-4">💳 Transaction History</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
        <h3 className="text-white font-bold text-lg mb-4">💳 Transaction History</h3>
        <div className="text-red-400 text-center py-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-base sm:text-lg">💳 Transaction History</h3>
        <button
          onClick={loadTransactions}
          className="text-white/60 hover:text-white text-xs sm:text-sm transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {['all', 'purchase', 'transfer'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType as any)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              filter === filterType
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
      }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}</style>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx._id}
              className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all border border-white/10"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getTypeIcon(tx.type)}</span>
                  <div>
                    <div className="text-white font-medium text-sm capitalize">
                      {tx.metadata?.itemName || tx.type}
                    </div>
                    <div className="text-white/50 text-xs">
                      {formatDate(tx.timestamp)}
                    </div>
                  </div>
                </div>
                <div className={`flex items-center space-x-1 text-xs font-medium ${getStatusColor(tx.status)}`}>
                  <span>{getStatusIcon(tx.status)}</span>
                  <span className="hidden sm:inline">{tx.status}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-white/70 text-xs">
                  {tx.type === 'transfer' ? (
                    <>To: {formatAddress(tx.to)}</>
                  ) : (
                    <>From: {formatAddress(tx.from)}</>
                  )}
                </div>
                <div className="text-white font-bold text-sm">
                  {formatAmount(tx.amount, tx.token)}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-white/10">
                <a
                  href={`https://sepolia.basescan.org/tx/${tx.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center space-x-1"
                >
                  <span>View on BaseScan</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
