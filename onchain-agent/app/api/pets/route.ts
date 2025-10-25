import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Pet from '@/lib/models/Pet';
import User from '@/lib/models/User';
import ActivityLog from '@/lib/models/ActivityLog';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    const body = await request.json();
    const { action, userId, name, userWalletAddress } = body;

    if (action === 'createPet') {
      if (!userId || !name || !userWalletAddress) {
        return NextResponse.json(
          { error: 'User ID, name, and user wallet address are required' },
          { status: 400 }
        );
      }

      try {
        // Check if user exists - handle both email-based IDs and MongoDB ObjectIds
        let user;
        
        // First try to find by MongoDB ObjectId if it looks like one
        if (userId.match(/^[0-9a-fA-F]{24}$/)) {
          user = await User.findById(userId);
        } else {
          // Otherwise, try to find by email (for NextAuth users)
          user = await User.findOne({ email: userId });
        }
        
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Check if user already has an active pet - use the actual user._id for database queries
        const existingPet = await Pet.findOne({ ownerId: user._id, isActive: true });
        if (existingPet) {
          console.log('User already has an active pet:', existingPet.name, 'Pet ID:', existingPet._id);
          return NextResponse.json(
            { 
              success: true,
              message: 'User already has an active pet',
              pet: {
                id: existingPet._id,
                name: existingPet.name,
                ownerId: existingPet.ownerId,
                userWalletAddress: existingPet.userWalletAddress,
                petWalletAddress: existingPet.petWalletAddress,
                petWalletId: existingPet.petWalletId,
                stage: existingPet.stage,
                mood: existingPet.mood,
                xp: existingPet.xp,
                streak: existingPet.streak,
                personality: existingPet.personality,
                stats: existingPet.stats,
                createdAt: existingPet.createdAt
              }
            },
            { status: 200 }
          );
        }

        // Create new pet - use the actual user._id for ownerId
        const pet = new Pet({
          name,
          ownerId: user._id,
          userWalletAddress,
          personality: ['curious', 'playful'],
          stats: {
            happiness: 80,
            health: 100,
            level: 1,
            energy: 100
          }
        });

        await pet.save();

        // Log pet creation activity
        try {
          await ActivityLog.logActivity(
            user._id.toString(),
            'pet_created',
            'pet',
            {
              petId: pet._id.toString(),
              petName: pet.name,
              stage: pet.stage
            },
            pet._id.toString()
          );
        } catch (logError) {
          console.error('Error logging pet creation:', logError);
        }

        return NextResponse.json({
          success: true,
          message: 'Pet created successfully',
          pet: {
            id: pet._id,
            name: pet.name,
            ownerId: pet.ownerId,
            userWalletAddress: pet.userWalletAddress,
            stage: pet.stage,
            mood: pet.mood,
            xp: pet.xp,
            streak: pet.streak,
            personality: pet.personality,
            stats: pet.stats,
            createdAt: pet.createdAt
          }
        });
      } catch (error: unknown) {
        console.error('Pet creation error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to create pet' },
          { status: 500 }
        );
      }
    } else if (action === 'updatePet') {
      const { petId, updates } = body;
      
      if (!petId) {
        return NextResponse.json(
          { error: 'Pet ID is required' },
          { status: 400 }
        );
      }

      try {
        // Find and update pet
        const pet = await Pet.findById(petId);
        if (!pet) {
          return NextResponse.json(
            { error: 'Pet not found' },
            { status: 404 }
          );
        }

        // Update pet fields
        if (updates.petWalletAddress) {
          pet.petWalletAddress = updates.petWalletAddress;
        }
        if (updates.petWalletId) {
          pet.petWalletId = updates.petWalletId;
        }
        if (updates.stage) {
          pet.stage = updates.stage;
        }
        if (updates.mood) {
          pet.mood = updates.mood;
        }
        if (updates.xp !== undefined) {
          pet.xp = updates.xp;
        }
        if (updates.streak !== undefined) {
          pet.streak = updates.streak;
        }
        if (updates.stats) {
          pet.stats = { ...pet.stats, ...updates.stats };
        }

        await pet.save();

        // Log pet update activity
        try {
          await ActivityLog.logActivity(
            userId,
            'pet_updated',
            'pet',
            {
              petId: pet._id.toString(),
              updates: Object.keys(updates)
            },
            pet._id.toString()
          );
        } catch (logError) {
          console.error('Error logging pet update:', logError);
        }

        return NextResponse.json({
          success: true,
          message: 'Pet updated successfully',
          pet: {
            id: pet._id,
            name: pet.name,
            ownerId: pet.ownerId,
            userWalletAddress: pet.userWalletAddress,
            petWalletAddress: pet.petWalletAddress,
            petWalletId: pet.petWalletId,
            stage: pet.stage,
            mood: pet.mood,
            xp: pet.xp,
            streak: pet.streak,
            personality: pet.personality,
            stats: pet.stats,
            updatedAt: pet.updatedAt
          }
        });
      } catch (error: unknown) {
        console.error('Pet update error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to update pet' },
          { status: 500 }
        );
      }
    } else if (action === 'interactWithPet') {
      const { petId, interactionType } = body;
      
      if (!petId || !interactionType) {
        return NextResponse.json(
          { error: 'Pet ID and interaction type are required' },
          { status: 400 }
        );
      }

      try {
        // Find pet
        const pet = await Pet.findById(petId);
        if (!pet) {
          return NextResponse.json(
            { error: 'Pet not found' },
            { status: 404 }
          );
        }

        // Update pet after interaction
        pet.updateAfterInteraction(interactionType);
        await pet.save();

        // Log interaction activity
        try {
          await ActivityLog.logActivity(
            userId,
            `pet_${interactionType}`,
            'pet',
            {
              petId: pet._id.toString(),
              interactionType,
              moodAfter: pet.mood,
              xpAfter: pet.xp,
              statsAfter: pet.stats
            },
            pet._id.toString()
          );
        } catch (logError) {
          console.error('Error logging pet interaction:', logError);
        }

        return NextResponse.json({
          success: true,
          message: 'Pet interaction completed',
          pet: {
            id: pet._id,
            name: pet.name,
            stage: pet.stage,
            mood: pet.mood,
            xp: pet.xp,
            streak: pet.streak,
            stats: pet.stats,
            lastInteraction: pet.lastInteraction
          }
        });
      } catch (error: unknown) {
        console.error('Pet interaction error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to interact with pet' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Pet API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const petId = searchParams.get('petId');

    if (petId) {
      // Get specific pet
      try {
        const pet = await Pet.findById(petId);
        if (!pet) {
          return NextResponse.json(
            { error: 'Pet not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          pet: {
            id: pet._id,
            name: pet.name,
            ownerId: pet.ownerId,
            userWalletAddress: pet.userWalletAddress,
            petWalletAddress: pet.petWalletAddress,
            petWalletId: pet.petWalletId,
            stage: pet.stage,
            mood: pet.mood,
            xp: pet.xp,
            streak: pet.streak,
            personality: pet.personality,
            stats: pet.stats,
            isActive: pet.isActive,
            createdAt: pet.createdAt,
            updatedAt: pet.updatedAt
          }
        });
      } catch (error: unknown) {
        console.error('Get pet error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to retrieve pet' },
          { status: 500 }
        );
      }
    } else if (userId) {
      // Get user's pets - handle both email-based IDs and MongoDB ObjectIds
      try {
        let pets;
        
        // First try to find by MongoDB ObjectId if it looks like one
        if (userId.match(/^[0-9a-fA-F]{24}$/)) {
          pets = await Pet.find({ ownerId: userId, isActive: true });
        } else {
          // Otherwise, find user by email first, then get pets
          const user = await User.findOne({ email: userId });
          if (!user) {
            return NextResponse.json(
              { error: 'User not found' },
              { status: 404 }
            );
          }
          pets = await Pet.find({ ownerId: user._id, isActive: true });
        }
        
        return NextResponse.json({
          success: true,
          pets: pets.map(pet => ({
            id: pet._id,
            name: pet.name,
            ownerId: pet.ownerId,
            userWalletAddress: pet.userWalletAddress,
            petWalletAddress: pet.petWalletAddress,
            petWalletId: pet.petWalletId,
            stage: pet.stage,
            mood: pet.mood,
            xp: pet.xp,
            streak: pet.streak,
            personality: pet.personality,
            stats: pet.stats,
            isActive: pet.isActive,
            createdAt: pet.createdAt,
            updatedAt: pet.updatedAt
          }))
        });
      } catch (error: unknown) {
        console.error('Get user pets error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to retrieve pets' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'User ID or Pet ID is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Pet GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}