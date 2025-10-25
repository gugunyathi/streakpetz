import { NextRequest, NextResponse } from 'next/server';
import { Friend } from '@/lib/api';

// In-memory storage for friends (in production, use a database)
let friends: Friend[] = [];
let nextId = 1;

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: friends,
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, name, xmtpAvailable } = body;

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    // Check if friend already exists
    const existingFriend = friends.find(f => f.address.toLowerCase() === address.toLowerCase());
    if (existingFriend) {
      return NextResponse.json(
        { success: false, error: 'Friend already exists' },
        { status: 400 }
      );
    }

    const newFriend: Friend = {
      id: nextId.toString(),
      address,
      name,
      xmtpAvailable: xmtpAvailable || false,
      inviteSent: false,
      addedAt: Date.now(),
    };

    friends.push(newFriend);
    nextId++;

    return NextResponse.json({
      success: true,
      data: newFriend,
    });
  } catch (error) {
    console.error('Error adding friend:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add friend' },
      { status: 500 }
    );
  }
}