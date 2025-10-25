import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Pet from '@/lib/models/Pet';
import UserInventory from '@/lib/models/UserInventory';
import Transaction from '@/lib/models/Transaction';
import ActivityLog from '@/lib/models/ActivityLog';
import { PetStore } from '@/lib/pet-store';
import { rateLimiters } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting - 10 purchases per minute
    const rateLimitResponse = rateLimiters.transaction(request);
    if (rateLimitResponse) return rateLimitResponse;

    await connectDB();
    
    const { userId, petId, itemId, quantity, transactionHash, price } = await request.json();

    if (!userId || !petId || !itemId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`Recording purchase: Item ${itemId} for pet ${petId}`);

    // Verify pet exists and belongs to user
    const pet = await Pet.findOne({ _id: petId, userWalletAddress: userId.toLowerCase() });
    if (!pet) {
      return NextResponse.json(
        { success: false, error: 'Pet not found or does not belong to user' },
        { status: 404 }
      );
    }

    // Get item details from store
    const petStore = new PetStore();
    const item = petStore.getItemById(itemId);
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Store item not found' },
        { status: 404 }
      );
    }

    // Find or create user inventory
    let inventory = await UserInventory.findOne({
      userId: userId.toLowerCase(),
      petId: petId
    });

    if (!inventory) {
      inventory = new UserInventory({
        userId: userId.toLowerCase(),
        petId: petId,
        items: [],
        totalValue: 0
      });
    }

    // Add item to inventory
    inventory.addItem(
      itemId,
      quantity || 1,
      price || item.price,
      transactionHash
    );

    await inventory.save();

    console.log(`✅ Purchase recorded: ${item.name} added to inventory`);

    // Record transaction in database if transactionHash provided
    if (transactionHash) {
      try {
        await Transaction.create({
          transactionHash,
          from: userId.toLowerCase(),
          to: process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '0x226710d13E6c16f1c99F34649526bD3bF17cd010',
          amount: (price || item.price).toString(),
          token: 'USDC',
          network: 'base-sepolia',
          type: 'purchase',
          status: 'confirmed', // Assume confirmed if inventory updated
          timestamp: new Date(),
          userId: userId.toLowerCase(),
          petId,
          metadata: {
            itemId,
            itemName: item.name,
            itemType: item.category,
            quantity: quantity || 1,
            category: item.category
          }
        });
        console.log(`📝 Transaction recorded for purchase: ${transactionHash}`);
      } catch (txError) {
        console.error('Error recording transaction:', txError);
        // Continue even if transaction recording fails
      }
    }

    // Log purchase activity
    try {
      await ActivityLog.logActivity(
        userId.toLowerCase(),
        'item_purchased',
        'purchase',
        {
          itemId,
          itemName: item.name,
          itemType: item.category,
          price: price || item.price,
          currency: 'USDC',
          transactionHash,
          quantity: quantity || 1
        },
        petId
      );
      console.log(`📊 Activity logged for purchase`);
    } catch (actError) {
      console.error('Error logging activity:', actError);
      // Continue even if activity logging fails
    }

    // Apply item effects to pet
    if (item.effects) {
      let petUpdated = false;

      if (item.effects.experienceBoost) {
        pet.xp += item.effects.experienceBoost;
        petUpdated = true;
        console.log(`Pet gained ${item.effects.experienceBoost} XP (total: ${pet.xp})`);
      }

      if (item.effects.moodBoost) {
        pet.mood = item.effects.moodBoost as any;
        petUpdated = true;
        console.log(`Pet mood changed to: ${item.effects.moodBoost}`);
      }

      if (item.effects.healthBoost) {
        pet.stats.health = Math.min(100, pet.stats.health + item.effects.healthBoost);
        petUpdated = true;
      }

      if (item.effects.energyBoost) {
        pet.stats.energy = Math.min(100, pet.stats.energy + item.effects.energyBoost);
        petUpdated = true;
      }

      if (petUpdated) {
        pet.lastInteraction = new Date();
        await pet.save();
        console.log(`✅ Pet stats updated in database`);
      }
    }

    // Return updated pet and inventory
    return NextResponse.json({
      success: true,
      message: 'Purchase recorded successfully',
      inventory: {
        userId: inventory.userId,
        petId: inventory.petId,
        items: inventory.items,
        totalValue: inventory.totalValue,
        lastUpdated: inventory.lastUpdated
      },
      pet: {
        id: pet._id.toString(),
        name: pet.name,
        stage: pet.stage,
        mood: pet.mood,
        xp: pet.xp,
        stats: pet.stats
      }
    });
  } catch (error: any) {
    console.error('Purchase recording error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to record purchase' 
      },
      { status: 500 }
    );
  }
}

// GET: Fetch user inventory
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

    const inventory = await UserInventory.findOne({
      userId: userId.toLowerCase(),
      petId: petId
    });

    if (!inventory) {
      return NextResponse.json({
        success: true,
        inventory: {
          userId: userId.toLowerCase(),
          petId: petId,
          items: [],
          totalValue: 0,
          lastUpdated: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      inventory: {
        userId: inventory.userId,
        petId: inventory.petId,
        items: inventory.items,
        totalValue: inventory.totalValue,
        lastUpdated: inventory.lastUpdated
      }
    });
  } catch (error: any) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch inventory' 
      },
      { status: 500 }
    );
  }
}
