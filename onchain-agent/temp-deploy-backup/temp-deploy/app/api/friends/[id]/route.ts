import { NextRequest, NextResponse } from 'next/server';
import { Friend } from '@/lib/api';

// In-memory storage for friends (in production, use a database)
// This should be shared with the main route.ts file
let friends: Friend[] = [];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const friendIndex = friends.findIndex(f => f.id === id);
    if (friendIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Friend not found' },
        { status: 404 }
      );
    }

    friends[friendIndex] = { ...friends[friendIndex], ...body };

    return NextResponse.json({
      success: true,
      data: friends[friendIndex],
    });
  } catch (error) {
    console.error('Error updating friend:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update friend' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const friendIndex = friends.findIndex(f => f.id === id);
    if (friendIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Friend not found' },
        { status: 404 }
      );
    }

    friends.splice(friendIndex, 1);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
}