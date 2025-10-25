import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import Pet from '@/lib/models/Pet';
import Wallet from '@/lib/models/Wallet';
import { Coinbase, Wallet as CoinbaseWallet } from '@coinbase/coinbase-sdk';

// Ensure Coinbase SDK is configured
function ensureCoinbaseConfigured() {
  try {
    // Try to check if already configured - if this fails, configure it
    const apiKeyName = process.env.CDP_API_KEY_ID!;
    const privateKey = process.env.CDP_API_KEY_SECRET!.replace(/\\n/g, '\n');
    
    Coinbase.configure({
      apiKeyName,
      privateKey
    });
  } catch (error) {
    // Already configured or configuration error
    console.log('Coinbase SDK configuration check:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n🐾 Creating new pet...');
    
    // Configure CDP SDK
    ensureCoinbaseConfigured();
    
    const body = await request.json();
    const { userId, userWalletAddress, petName, imageUrl } = body;
    
    console.log('📋 Create Pet Request:', {
      userId,
      userWalletAddress,
      petName,
      hasImage: !!imageUrl
    });
    
    // Validate inputs
    if (!userId || !userWalletAddress || !petName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, userWalletAddress, petName' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Create a new wallet for the pet
    console.log('💰 Creating pet wallet...');
    
    let petWallet;
    let walletData;
    let petWalletAddress;
    
    try {
      // Create wallet using CDP SDK
      petWallet = await CoinbaseWallet.create({
        networkId: 'base-sepolia'
      });
      
      // Export wallet data for storage
      walletData = await petWallet.export();
      
      // Get default address
      const defaultAddress = await petWallet.getDefaultAddress();
      petWalletAddress = defaultAddress?.getId();
      
      console.log(`✅ Pet wallet created: ${petWalletAddress}`);
      
    } catch (walletError: any) {
      console.error('❌ Failed to create pet wallet:', walletError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create pet wallet',
          details: walletError.message 
        },
        { status: 500 }
      );
    }
    
    // Save wallet to database
    const walletRecord = new Wallet({
      userId,
      address: petWalletAddress,
      walletId: petWallet.getId(),
      walletData: JSON.stringify(walletData),
      network: 'base-sepolia',
      isActive: true
    });
    
    await walletRecord.save();
    console.log('✅ Pet wallet saved to database');
    
    // Create the pet record
    const newPet = new Pet({
      name: petName,
      ownerId: userId,
      userWalletAddress: userWalletAddress.toLowerCase(),
      petWalletAddress: petWalletAddress?.toLowerCase(),
      petWalletId: petWallet.getId(),
      imageUrl: imageUrl || undefined,
      stage: 'egg',
      mood: 'content',
      xp: 0,
      streak: 0,
      lastInteraction: new Date(),
      personality: ['curious', 'playful'],
      stats: {
        happiness: 80,
        health: 100,
        level: 1,
        energy: 100
      },
      isActive: true
    });
    
    await newPet.save();
    console.log(`✅ Pet created: ${newPet.name} (${newPet._id})`);
    
    return NextResponse.json({
      success: true,
      message: `${petName} has been born! 🐣`,
      pet: {
        id: newPet._id.toString(),
        name: newPet.name,
        stage: newPet.stage,
        mood: newPet.mood,
        xp: newPet.xp,
        streak: newPet.streak,
        stats: newPet.stats,
        petWalletAddress,
        imageUrl: newPet.imageUrl,
        createdAt: newPet.createdAt
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error creating pet:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create pet',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
