'use client';

import { useState, useEffect } from 'react';

interface Activity {
  _id: string;
  userId: string;
  petId?: string;
  action: string;
  category: 'auth' | 'pet' | 'wallet' | 'social' | 'purchase' | 'system';
  details: any;
  timestamp: string;
}

interface ActivityFeedProps {
  userId: string;
  limit?: number;
  categoryFilter?: string;
}

export default function ActivityFeed({ userId, limit = 20, categoryFilter }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>(categoryFilter || 'all');

  useEffect(() => {
    loadActivities();
  }, [userId, filter]);

  const loadActivities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filterParam = filter !== 'all' ? `&category=${filter}` : '';
      const response = await fetch(`/api/activity?userId=${userId}&limit=${limit}${filterParam}`);
      const data = await response.json();

      if (data.success) {
        setActivities(data.activities || []);
      } else {
        setError(data.error || 'Failed to load activity');
      }
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activity feed');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'auth': return 'bg-blue-500/20 text-blue-400';
      case 'pet': return 'bg-purple-500/20 text-purple-400';
      case 'wallet': return 'bg-green-500/20 text-green-400';
      case 'social': return 'bg-pink-500/20 text-pink-400';
      case 'purchase': return 'bg-yellow-500/20 text-yellow-400';
      case 'system': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return '🔐';
      case 'pet': return '🐾';
      case 'wallet': return '💰';
      case 'social': return '👥';
      case 'purchase': return '🛒';
      case 'system': return '⚙️';
      default: return '📌';
    }
  };

  const formatActionText = (activity: Activity) => {
    const action = activity.action.replace(/_/g, ' ');
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  const formatDetails = (activity: Activity) => {
    const { details } = activity;
    
    if (activity.category === 'pet') {
      if (details.interactionType) return `Interaction: ${details.interactionType}`;
      if (details.fromStage && details.toStage) return `${details.fromStage} → ${details.toStage}`;
      if (details.petName) return details.petName;
    }
    
    if (activity.category === 'wallet') {
      if (details.amount && details.token) {
        const amount = parseFloat(details.amount) / 1000000;
        return `${amount.toFixed(2)} ${details.token}`;
      }
    }
    
    if (activity.category === 'purchase') {
      if (details.itemName) return details.itemName;
    }
    
    if (activity.category === 'social') {
      if (details.friendName) return details.friendName;
    }
    
    return '';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
        <h3 className="text-white font-bold text-lg mb-4">📊 Activity Feed</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
        <h3 className="text-white font-bold text-lg mb-4">📊 Activity Feed</h3>
        <div className="text-red-400 text-center py-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-base sm:text-lg">📊 Activity Feed</h3>
        <button
          onClick={loadActivities}
          className="text-white/60 hover:text-white text-xs sm:text-sm transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {['all', 'pet', 'wallet', 'purchase', 'social', 'auth'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
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

      {/* Activity List */}
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

        {activities.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity._id}
              className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all border border-white/10"
            >
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getCategoryColor(activity.category)}`}>
                  <span className="text-sm">{getCategoryIcon(activity.category)}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm">
                        {formatActionText(activity)}
                      </div>
                      {formatDetails(activity) && (
                        <div className="text-white/70 text-xs mt-0.5 truncate">
                          {formatDetails(activity)}
                        </div>
                      )}
                    </div>
                    <div className="text-white/50 text-xs ml-2 flex-shrink-0">
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
