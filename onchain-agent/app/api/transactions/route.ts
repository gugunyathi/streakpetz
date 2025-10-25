import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import Transaction from '@/lib/models/Transaction';
import ActivityLog from '@/lib/models/ActivityLog';

// GET - Fetch transactions
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const address = searchParams.get('address');
    const txHash = searchParams.get('hash');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get specific transaction by hash
    if (txHash) {
      const transaction = await Transaction.findOne({ transactionHash: txHash }).lean();
      if (!transaction) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        transaction
      });
    }

    // Build query
    const query: any = {};
    if (userId) query.userId = userId;
    if (address) query.$or = [{ from: address.toLowerCase() }, { to: address.toLowerCase() }];
    if (type) query.type = type;
    if (status) query.status = status;

    if (!userId && !address) {
      return NextResponse.json(
        { success: false, error: 'User ID or address is required' },
        { status: 400 }
      );
    }

    // Fetch transactions with pagination
    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Transaction.countDocuments(query);

    // Calculate summary statistics
    const summary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: { $toDouble: '$amount' } }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      transactions,
      summary,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST - Record a new transaction
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      transactionHash,
      from,
      to,
      amount,
      token,
      network,
      type,
      status,
      blockNumber,
      gasUsed,
      gasFee,
      userId,
      petId,
      metadata
    } = body;

    // Validate required fields
    if (!transactionHash || !from || !to || !amount || !token || !network || !type || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if transaction already exists
    const existingTx = await Transaction.findOne({ transactionHash });
    if (existingTx) {
      return NextResponse.json(
        { success: false, error: 'Transaction already recorded' },
        { status: 409 }
      );
    }

    // Create transaction record
    const transaction = await Transaction.create({
      transactionHash,
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amount,
      token: token.toUpperCase(),
      network,
      type,
      status: status || 'pending',
      blockNumber,
      gasUsed,
      gasFee,
      timestamp: new Date(),
      userId,
      petId,
      metadata: metadata || {}
    });

    // Log activity
    await ActivityLog.logActivity(
      userId,
      'transaction_created',
      'wallet',
      {
        transactionHash,
        type,
        amount,
        token
      },
      petId,
      { success: true }
    );

    return NextResponse.json({
      success: true,
      transaction: transaction.toObject()
    });

  } catch (error) {
    console.error('Error recording transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record transaction' },
      { status: 500 }
    );
  }
}

// PUT - Update transaction status
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { transactionHash, status, blockNumber, gasUsed, gasFee, error } = body;

    if (!transactionHash || !status) {
      return NextResponse.json(
        { success: false, error: 'Transaction hash and status are required' },
        { status: 400 }
      );
    }

    // Find and update transaction
    const transaction = await Transaction.findOne({ transactionHash });
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update based on status
    if (status === 'confirmed') {
      await transaction.confirm(blockNumber, gasUsed, gasFee);
    } else if (status === 'failed') {
      await transaction.fail(error || 'Transaction failed');
    } else {
      transaction.status = status;
      await transaction.save();
    }

    // Log activity
    await ActivityLog.logActivity(
      transaction.userId,
      'transaction_updated',
      'wallet',
      {
        transactionHash,
        previousStatus: transaction.status,
        newStatus: status
      },
      transaction.petId,
      { success: true }
    );

    return NextResponse.json({
      success: true,
      transaction: transaction.toObject()
    });

  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}
