import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Pet from '@/lib/models/Pet';
import UserInventory from '@/lib/models/UserInventory';
import ActivityLog from '@/lib/models/ActivityLog';
import { PetStore } from '@/lib/pet-store';
import { PetStage } from '@/lib/pet';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { userId, petId } = await request.json();

    if (!userId || !petId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`Attempting evolution for pet ${petId}`);

    // Fetch pet
    const pet = await Pet.findOne({ _id: petId, userWalletAddress: userId.toLowerCase() });
    if (!pet) {
      return NextResponse.json(
        { success: false, error: 'Pet not found' },
        { status: 404 }
      );
    }

    // Fetch inventory
    const inventory = await UserInventory.findOne({
      userId: userId.toLowerCase(),
      petId: petId
    });

    if (!inventory) {
      return NextResponse.json(
        { success: false, error: 'No inventory found. Purchase evolution items first.' },
        { status: 400 }
      );
    }

    // Get evolution requirements for current stage
    const petStore = new PetStore();
    const requirements = petStore.getEvolutionRequirements();
    const requiredItems = requirements[pet.stage as PetStage];

    if (!requiredItems || requiredItems.length === 0) {
      return NextResponse.json(
        { success: false, error: `No evolution available from ${pet.stage}` },
        { status: 400 }
      );
    }

    // Check if user has all required items
    const missingItems: string[] = [];
    for (const itemId of requiredItems) {
      if (!inventory.hasItem(itemId)) {
        const item = petStore.getItemById(itemId);
        missingItems.push(item?.name || itemId);
      }
    }

    if (missingItems.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing evolution items: ${missingItems.join(', ')}`,
          missingItems 
        },
        { status: 400 }
      );
    }

    // Check XP requirements for current stage
    const xpRequirements: { [key in PetStage]?: number } = {
      [PetStage.EGG]: 50,
      [PetStage.HATCHLING]: 200,
      [PetStage.TEEN]: 500,
      [PetStage.ADULT]: 1000
    };

    const requiredXP = xpRequirements[pet.stage as PetStage];
    if (requiredXP && pet.xp < requiredXP) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Not enough XP. Required: ${requiredXP}, Current: ${pet.xp}` 
        },
        { status: 400 }
      );
    }

    // Determine next stage
    const stageProgression: { [key in PetStage]?: PetStage } = {
      [PetStage.EGG]: PetStage.HATCHLING,
      [PetStage.HATCHLING]: PetStage.TEEN,
      [PetStage.TEEN]: PetStage.ADULT,
      [PetStage.ADULT]: PetStage.UNICORN
    };

    const newStage = stageProgression[pet.stage as PetStage];
    if (!newStage) {
      return NextResponse.json(
        { success: false, error: 'Pet is already at maximum evolution' },
        { status: 400 }
      );
    }

    // Consume evolution items
    for (const itemId of requiredItems) {
      try {
        inventory.useItem(itemId, 1);
      } catch (error) {
        console.warn(`Failed to consume item ${itemId}:`, error);
      }
    }

    await inventory.save();

    // Evolve pet
    const oldStage = pet.stage;
    pet.stage = newStage;
    pet.stats.happiness = Math.min(100, pet.stats.happiness + 20);
    pet.stats.health = 100; // Full health on evolution
    pet.stats.energy = 100; // Full energy on evolution
    pet.stats.level += 1;
    pet.lastInteraction = new Date();

    await pet.save();

    console.log(`✅ Pet evolved from ${oldStage} to ${newStage}`);

    // Log evolution activity
    try {
      await ActivityLog.logActivity(
        userId,
        'pet_evolved',
        'pet',
        {
          petId: pet._id.toString(),
          fromStage: oldStage,
          toStage: newStage,
          xpLevel: pet.xp,
          itemsConsumed: requiredItems
        },
        pet._id.toString()
      );
      console.log(`📊 Activity logged for evolution`);
    } catch (logError) {
      console.error('Error logging evolution:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `🎉 ${pet.name} evolved to ${newStage}!`,
      pet: {
        id: pet._id.toString(),
        name: pet.name,
        stage: pet.stage,
        mood: pet.mood,
        xp: pet.xp,
        stats: pet.stats
      },
      oldStage,
      newStage
    });
  } catch (error: any) {
    console.error('Evolution error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to evolve pet' 
      },
      { status: 500 }
    );
  }
}

// GET: Check if pet can evolve
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const petId = searchParams.get('petId');

    if (!userId || !petId) {
      return NextResponse.json(
        { success: false, error: 'userId and petId are required' },
        { status: 400 }
      );
    }

    const pet = await Pet.findOne({ _id: petId, userWalletAddress: userId.toLowerCase() });
    if (!pet) {
      return NextResponse.json(
        { success: false, error: 'Pet not found' },
        { status: 404 }
      );
    }

    const inventory = await UserInventory.findOne({
      userId: userId.toLowerCase(),
      petId: petId
    });

    const petStore = new PetStore();
    const requirements = petStore.getEvolutionRequirements();
    const requiredItems = requirements[pet.stage as PetStage];

    const xpRequirements: { [key in PetStage]?: number } = {
      [PetStage.EGG]: 50,
      [PetStage.HATCHLING]: 200,
      [PetStage.TEEN]: 500,
      [PetStage.ADULT]: 1000
    };

    const requiredXP = xpRequirements[pet.stage as PetStage];
    const hasEnoughXP = !requiredXP || pet.xp >= requiredXP;

    const itemStatus = requiredItems.map((itemId: string) => {
      const item = petStore.getItemById(itemId);
      const hasItem = inventory?.hasItem(itemId) || false;
      return {
        itemId,
        itemName: item?.name || itemId,
        required: true,
        owned: hasItem
      };
    });

    const hasAllItems = itemStatus.every((item: any) => item.owned);
    const canEvolve = hasEnoughXP && hasAllItems;

    return NextResponse.json({
      success: true,
      canEvolve,
      currentStage: pet.stage,
      currentXP: pet.xp,
      requiredXP,
      hasEnoughXP,
      itemStatus,
      hasAllItems
    });
  } catch (error: any) {
    console.error('Evolution check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to check evolution status' 
      },
      { status: 500 }
    );
  }
}
