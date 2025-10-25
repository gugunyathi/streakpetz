import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Pet from '@/lib/models/Pet';
import UserInventory from '@/lib/models/UserInventory';
import { PetStore } from '@/lib/pet-store';
import { PetStage } from '@/lib/pet';

/**
 * Auto-Evolution Checker
 * 
 * This endpoint automatically checks and applies evolution when:
 * - User reconnects wallet
 * - App comes back online
 * - Pet data is loaded
 * - Periodic checks
 * 
 * It evaluates pet based on:
 * - XP accumulated
 * - Items purchased
 * - Achievements unlocked
 * - Time elapsed
 */

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

    console.log(`🔍 Auto-checking evolution for pet ${petId}...`);

    // Fetch pet
    const pet = await Pet.findOne({ _id: petId, userWalletAddress: userId.toLowerCase() });
    if (!pet) {
      return NextResponse.json(
        { success: false, error: 'Pet not found' },
        { status: 404 }
      );
    }

    const originalStage = pet.stage;
    let evolutionsApplied = 0;
    const evolutionLog: string[] = [];

    // Fetch inventory
    const inventory = await UserInventory.findOne({
      userId: userId.toLowerCase(),
      petId: petId
    });

    const petStore = new PetStore();
    const requirements = petStore.getEvolutionRequirements();

    // XP thresholds for each stage
    const xpRequirements: { [key in PetStage]?: number } = {
      [PetStage.EGG]: 50,
      [PetStage.HATCHLING]: 200,
      [PetStage.TEEN]: 500,
      [PetStage.ADULT]: 1000
    };

    // Stage progression
    const stageProgression: { [key: string]: PetStage } = {
      [PetStage.EGG]: PetStage.HATCHLING,
      [PetStage.HATCHLING]: PetStage.TEEN,
      [PetStage.TEEN]: PetStage.ADULT,
      [PetStage.ADULT]: PetStage.UNICORN
    };

    // Check if pet can evolve (potentially multiple times if offline)
    let canContinueEvolving = true;
    let currentStage = pet.stage;

    while (canContinueEvolving && currentStage !== PetStage.UNICORN) {
      const nextStage = stageProgression[currentStage];
      
      if (!nextStage) {
        console.log(`Pet is at maximum stage: ${currentStage}`);
        canContinueEvolving = false;
        break;
      }

      // Check XP requirement
      const requiredXP = xpRequirements[currentStage as PetStage];
      const hasEnoughXP = !requiredXP || pet.xp >= requiredXP;

      if (!hasEnoughXP) {
        console.log(`Not enough XP for ${currentStage} → ${nextStage}: ${pet.xp}/${requiredXP}`);
        canContinueEvolving = false;
        break;
      }

      // Check item requirements
      const requiredItems = requirements[currentStage as PetStage] || [];
      const hasAllItems = requiredItems.every((itemId: string) => {
        return inventory?.hasItem(itemId) || false;
      });

      if (!hasAllItems && requiredItems.length > 0) {
        const missingItems = requiredItems.filter((itemId: string) => !inventory?.hasItem(itemId));
        console.log(`Missing items for ${currentStage} → ${nextStage}:`, missingItems);
        canContinueEvolving = false;
        break;
      }

      // Pet can evolve! Apply evolution
      console.log(`✅ Auto-evolving: ${currentStage} → ${nextStage}`);
      
      // Consume evolution items
      if (inventory && requiredItems.length > 0) {
        for (const itemId of requiredItems) {
          try {
            inventory.useItem(itemId, 1);
          } catch (error) {
            console.warn(`Failed to consume item ${itemId}:`, error);
          }
        }
        await inventory.save();
      }

      // Update pet stage
      pet.stage = nextStage;
      currentStage = nextStage;
      evolutionsApplied++;
      evolutionLog.push(`${originalStage} → ${nextStage}`);

      // Apply evolution bonuses
      pet.stats.happiness = Math.min(100, pet.stats.happiness + 20);
      pet.stats.health = 100;
      pet.stats.energy = 100;
      pet.stats.level += 1;
      pet.lastInteraction = new Date();

      // Check if can evolve again (for offline periods)
      if (nextStage === PetStage.UNICORN) {
        canContinueEvolving = false;
      }
    }

    // Save pet if any evolutions were applied
    if (evolutionsApplied > 0) {
      await pet.save();
      console.log(`🎉 Applied ${evolutionsApplied} evolution(s): ${evolutionLog.join(' → ')}`);

      return NextResponse.json({
        success: true,
        evolved: true,
        evolutionsApplied,
        message: `🎉 ${pet.name} evolved ${evolutionsApplied} time(s)!`,
        evolutionLog,
        pet: {
          id: pet._id.toString(),
          name: pet.name,
          stage: pet.stage,
          mood: pet.mood,
          xp: pet.xp,
          stats: pet.stats
        },
        originalStage,
        newStage: pet.stage
      });
    } else {
      console.log(`No evolutions available for ${pet.name} (${pet.stage}, ${pet.xp} XP)`);
      
      return NextResponse.json({
        success: true,
        evolved: false,
        message: 'Pet is up to date',
        pet: {
          id: pet._id.toString(),
          name: pet.name,
          stage: pet.stage,
          mood: pet.mood,
          xp: pet.xp,
          stats: pet.stats
        }
      });
    }
  } catch (error: any) {
    console.error('Auto-evolution check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to check evolution' 
      },
      { status: 500 }
    );
  }
}

// GET: Check evolution eligibility without applying
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

    // Calculate how many evolutions are possible
    const xpRequirements: { [key in PetStage]?: number } = {
      [PetStage.EGG]: 50,
      [PetStage.HATCHLING]: 200,
      [PetStage.TEEN]: 500,
      [PetStage.ADULT]: 1000
    };

    const stageProgression: { [key: string]: PetStage } = {
      [PetStage.EGG]: PetStage.HATCHLING,
      [PetStage.HATCHLING]: PetStage.TEEN,
      [PetStage.TEEN]: PetStage.ADULT,
      [PetStage.ADULT]: PetStage.UNICORN
    };

    const possibleEvolutions: string[] = [];
    let checkStage = pet.stage;
    let canEvolveCount = 0;

    while (checkStage !== PetStage.UNICORN) {
      const nextStage = stageProgression[checkStage];
      if (!nextStage) break;

      const requiredXP = xpRequirements[checkStage as PetStage];
      const hasEnoughXP = !requiredXP || pet.xp >= requiredXP;

      const requiredItems = requirements[checkStage as PetStage] || [];
      const hasAllItems = requiredItems.every((itemId: string) => {
        return inventory?.hasItem(itemId) || false;
      });

      if (hasEnoughXP && (hasAllItems || requiredItems.length === 0)) {
        possibleEvolutions.push(`${checkStage} → ${nextStage}`);
        canEvolveCount++;
        checkStage = nextStage;
      } else {
        break;
      }
    }

    return NextResponse.json({
      success: true,
      canAutoEvolve: canEvolveCount > 0,
      possibleEvolutions: canEvolveCount,
      evolutionPath: possibleEvolutions,
      currentStage: pet.stage,
      currentXP: pet.xp,
      message: canEvolveCount > 0 
        ? `Pet can evolve ${canEvolveCount} time(s)!` 
        : 'Pet evolution is up to date'
    });
  } catch (error: any) {
    console.error('Evolution eligibility check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to check eligibility' 
      },
      { status: 500 }
    );
  }
}
