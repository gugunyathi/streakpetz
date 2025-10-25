import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import ActivityLog from '@/lib/models/ActivityLog';

// GET - Get activity statistics and summary
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user activity summary
    const summary = await ActivityLog.getUserActivitySummary(userId, days);

    // Get recent activity
    const recentActivity = await ActivityLog.getRecentActivity(userId, 10);

    // Calculate activity trends
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const dailyActivity = await ActivityLog.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: dateLimit }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 },
          categories: { $addToSet: '$category' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get most active hours
    const hourlyActivity = await ActivityLog.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: dateLimit }
        }
      },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        summary,
        recentActivity,
        dailyActivity,
        hourlyActivity,
        period: {
          days,
          startDate: dateLimit.toISOString(),
          endDate: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity statistics' },
      { status: 500 }
    );
  }
}
