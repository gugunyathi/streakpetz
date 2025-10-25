import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import ActivityLog from '@/lib/models/ActivityLog';

// GET - Fetch activity logs
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const petId = searchParams.get('petId');
    const category = searchParams.get('category');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build query
    const query: any = { userId };
    if (petId) query.petId = petId;
    if (category) query.category = category;
    if (action) query.action = action;

    // Filter by date range
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    query.timestamp = { $gte: dateLimit };

    // Fetch activity logs
    const activities = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    // Get total count
    const total = await ActivityLog.countDocuments(query);

    return NextResponse.json({
      success: true,
      activities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}

// POST - Log a new activity
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId, action, category, details, petId, metadata } = body;

    if (!userId || !action || !category) {
      return NextResponse.json(
        { success: false, error: 'User ID, action, and category are required' },
        { status: 400 }
      );
    }

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create activity log
    const activity = await ActivityLog.logActivity(
      userId,
      action,
      category,
      details || {},
      petId,
      {
        ...metadata,
        ipAddress,
        userAgent
      }
    );

    if (!activity) {
      return NextResponse.json(
        { success: false, error: 'Failed to create activity log' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      activity: activity.toObject()
    });

  } catch (error) {
    console.error('Error logging activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}
