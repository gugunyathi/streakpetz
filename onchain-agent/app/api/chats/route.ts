import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/database';
import ChatMessage from '@/lib/models/ChatMessage';
import Pet from '@/lib/models/Pet';

// GET - Fetch chat messages
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const petId = searchParams.get('petId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build query
    const query: any = { userId };
    if (petId) query.petId = petId;
    if (unreadOnly) query.isRead = false;

    // Fetch messages with pagination
    const messages = await ChatMessage.find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    // Get total count
    const total = await ChatMessage.countDocuments(query);

    return NextResponse.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

// POST - Save a new chat message
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { userId, petId, sender, content, metadata } = body;

    // Validate required fields
    if (!userId || !petId || !sender || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate sender
    if (!['user', 'pet', 'system'].includes(sender)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sender type' },
        { status: 400 }
      );
    }

    // Verify pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return NextResponse.json(
        { success: false, error: 'Pet not found' },
        { status: 404 }
      );
    }

    // Create message
    const message = await ChatMessage.create({
      userId,
      petId,
      sender,
      content,
      metadata: metadata || {},
      timestamp: new Date(),
      isRead: sender === 'user' // Auto-mark user messages as read
    });

    // TEST MODE: Auto-evolve EGG to HATCHLING after first complete chat exchange
    if (sender === 'pet' && pet.stage === 'egg') {
      try {
        console.log('🥚 Pet response detected! Checking if egg should hatch...');
        
        // Count how many complete chat exchanges have happened
        // A complete exchange = user message + pet response
        const userMessageCount = await ChatMessage.countDocuments({
          userId,
          petId,
          sender: 'user'
        });
        
        const petMessageCount = await ChatMessage.countDocuments({
          userId,
          petId,
          sender: 'pet'
        });

        // Evolve after the first complete chat exchange (user sent message, pet responded)
        if (userMessageCount >= 1 && petMessageCount >= 1) {
          // Import PetStage enum
          const { PetStage } = await import('@/lib/pet');
          
          // Evolve pet to HATCHLING
          pet.stage = PetStage.HATCHLING;
          pet.xp = 0; // Reset XP for new stage
          await pet.save();
          
          console.log('🐣 Pet evolved from EGG to HATCHLING after first chat!');
          
          // Create a system message about evolution
          await ChatMessage.create({
            userId,
            petId,
            sender: 'system',
            content: `🎉 Congratulations! Your egg just hatched! Your pet is now a Hatchling! Keep chatting and buying items to help it grow! 🐣`,
            metadata: { evolutionEvent: true, fromStage: 'egg', toStage: 'hatchling' },
            timestamp: new Date(),
            isRead: false
          });
        }
      } catch (evolutionError) {
        console.error('Failed to auto-evolve on first chat:', evolutionError);
        // Don't fail the chat message if evolution fails
      }
    }

    return NextResponse.json({
      success: true,
      message: message.toObject()
    });

  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save chat message' },
      { status: 500 }
    );
  }
}

// PUT - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { messageIds, userId, petId, markAllAsRead } = body;

    if (markAllAsRead && userId && petId) {
      // Mark all messages for a specific chat as read
      const result = await ChatMessage.updateMany(
        { userId, petId, isRead: false },
        { $set: { isRead: true } }
      );

      return NextResponse.json({
        success: true,
        modifiedCount: result.modifiedCount
      });
    }

    if (messageIds && Array.isArray(messageIds)) {
      // Mark specific messages as read
      const result = await ChatMessage.updateMany(
        { _id: { $in: messageIds } },
        { $set: { isRead: true } }
      );

      return NextResponse.json({
        success: true,
        modifiedCount: result.modifiedCount
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating chat messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update chat messages' },
      { status: 500 }
    );
  }
}

// DELETE - Delete chat messages
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const userId = searchParams.get('userId');
    const petId = searchParams.get('petId');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (messageId) {
      // Delete specific message
      const result = await ChatMessage.findByIdAndDelete(messageId);
      if (!result) {
        return NextResponse.json(
          { success: false, error: 'Message not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Message deleted successfully'
      });
    }

    if (deleteAll && userId && petId) {
      // Delete all messages for a specific chat
      const result = await ChatMessage.deleteMany({ userId, petId });

      return NextResponse.json({
        success: true,
        deletedCount: result.deletedCount
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid delete parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error deleting chat messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete chat messages' },
      { status: 500 }
    );
  }
}
