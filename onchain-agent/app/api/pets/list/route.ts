import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import Pet from '@/lib/models/Pet';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userWalletAddress = searchParams.get('userWalletAddress');
    
    if (!userId && !userWalletAddress) {
      return NextResponse.json(
        { success: false, error: 'userId or userWalletAddress required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find all pets for this user
    const query = userId 
      ? { ownerId: userId }
      : { userWalletAddress: userWalletAddress?.toLowerCase() };
    
    const pets = await Pet.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`📋 Found ${pets.length} pets for user ${userId || userWalletAddress}`);
    
    return NextResponse.json({
      success: true,
      pets: pets.map((pet: any) => ({
        id: pet._id.toString(),
        name: pet.name,
        stage: pet.stage,
        mood: pet.mood,
        xp: pet.xp,
        streak: pet.streak,
        stats: pet.stats,
        petWalletAddress: pet.petWalletAddress,
        imageUrl: pet.imageUrl,
        isActive: pet.isActive,
        lastInteraction: pet.lastInteraction,
        createdAt: pet.createdAt
      }))
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching pets:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch pets',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
