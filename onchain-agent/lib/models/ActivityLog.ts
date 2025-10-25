import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IActivityLog extends Document {
  _id: string;
  userId: string; // Reference to User ID
  petId?: string; // Reference to Pet ID (if applicable)
  action: string; // Action type
  category: 'auth' | 'pet' | 'wallet' | 'social' | 'purchase' | 'system';
  details: any; // Additional details about the action
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: {
    success?: boolean;
    error?: string;
    duration?: number; // Action duration in ms
    previousValue?: any;
    newValue?: any;
  };
  createdAt: Date;
}

// Define static methods interface
interface IActivityLogModel extends Model<IActivityLog> {
  logActivity(
    userId: string,
    action: string,
    category: 'auth' | 'pet' | 'wallet' | 'social' | 'purchase' | 'system',
    details?: any,
    petId?: string,
    metadata?: any
  ): Promise<IActivityLog | null>;
  
  getUserActivitySummary(userId: string, days?: number): Promise<any[]>;
  
  getRecentActivity(userId: string, limit?: number): Promise<any[]>;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User',
    index: true
  },
  petId: {
    type: String,
    ref: 'Pet',
    index: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    index: true,
    maxlength: [100, 'Action cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['auth', 'pet', 'wallet', 'social', 'purchase', 'system'],
    index: true
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    success: Boolean,
    error: String,
    duration: Number,
    previousValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Only track creation time
});

// Create compound indexes for efficient queries
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ userId: 1, category: 1, timestamp: -1 });
ActivityLogSchema.index({ userId: 1, action: 1, timestamp: -1 });
ActivityLogSchema.index({ petId: 1, timestamp: -1 });
ActivityLogSchema.index({ category: 1, timestamp: -1 });
ActivityLogSchema.index({ createdAt: -1 });

// TTL index to auto-delete old logs after 90 days
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Static method to log activity
ActivityLogSchema.statics.logActivity = async function(
  userId: string,
  action: string,
  category: 'auth' | 'pet' | 'wallet' | 'social' | 'purchase' | 'system',
  details: any = {},
  petId?: string,
  metadata?: any
) {
  try {
    const log = await this.create({
      userId,
      petId,
      action,
      category,
      details,
      metadata,
      timestamp: new Date()
    });
    return log;
  } catch (error) {
    console.error('Failed to log activity:', error);
    return null;
  }
};

// Static method to get user activity summary
ActivityLogSchema.statics.getUserActivitySummary = async function(
  userId: string,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const summary = await this.aggregate([
    {
      $match: {
        userId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          action: '$action'
        },
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  return summary;
};

// Static method to get recent activity
ActivityLogSchema.statics.getRecentActivity = async function(
  userId: string,
  limit: number = 50
) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('-userAgent -ipAddress') // Exclude sensitive data
    .lean();
};

const ActivityLog = (mongoose.models.ActivityLog || 
  mongoose.model<IActivityLog, IActivityLogModel>('ActivityLog', ActivityLogSchema)) as unknown as IActivityLogModel;

export default ActivityLog;
