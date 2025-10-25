import { NextRequest, NextResponse } from 'next/server';
import { CdpClient } from '@coinbase/cdp-sdk';
import { parseUnits } from 'viem';
import Wallets from '@/lib/models/Wallet';
import Transaction from '@/lib/models/Transaction';
import ActivityLog from '@/lib/models/ActivityLog';
import connectDB from '@/lib/database';
import { rateLimiters } from '@/lib/rate-limiter';

// USDC contract address on Base Sepolia
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// Initialize CDP client
const cdp = new CdpClient();

/**
 * Simplified payment endpoint using CDP SDK's sendTransaction
 * This handles USDC transfers with automatic gas sponsorship via paymaster
 */
export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();
  const requestId = `pay_${requestStartTime}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`💳 SIMPLE PAYMENT STARTED [${requestId}]`);
    console.log(`Time: ${new Date().toISOString()}`);
    
    // Rate limiting
    const rateLimitResponse = rateLimiters.transaction(request);
    if (rateLimitResponse) {
      console.log(`❌ Rate limit exceeded [${requestId}]`);
      return rateLimitResponse;
    }
    
    const body = await request.json();
    const { fromAddress, toAddress, amountInCents, network = 'base-sepolia', userId, petId } = body;
    
    console.log(`📋 Payment Details [${requestId}]:`, {
      from: fromAddress,
      to: toAddress,
      amount: `$${(amountInCents / 100).toFixed(2)}`,
      network
    });
    
    // Validate inputs
    if (!fromAddress || !toAddress || !amountInCents) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Get wallet from database
    const walletRecord = await Wallets.findOne({ 
      address: fromAddress.toLowerCase() 
    });
    
    if (!walletRecord) {
      console.error(`❌ Wallet not found [${requestId}]: ${fromAddress}`);
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Wallet found [${requestId}]`);
    
    // Convert cents to USDC wei (6 decimals)
    const dollars = amountInCents / 100;
    const amountInWei = parseUnits(dollars.toString(), 6);
    
    console.log(`💰 Transfer amount: ${amountInWei} wei (${dollars} USDC)`);
    
    // Encode USDC transfer function call
    // transfer(address to, uint256 amount)
    const transferData = `0xa9059cbb${
      toAddress.slice(2).padStart(64, '0')
    }${amountInWei.toString(16).padStart(64, '0')}`;
    
    console.log(`📤 Sending transaction via CDP SDK [${requestId}]...`);
    
    // Use CDP SDK to send transaction with automatic gas sponsorship
    const transactionResult = await cdp.evm.sendTransaction({
      address: fromAddress,
      transaction: {
        to: USDC_ADDRESS,
        data: transferData as `0x${string}`,
        value: 0n // No ETH value, only USDC transfer
      },
      network: 'base-sepolia'
    });
    
    const transactionHash = transactionResult.transactionHash;
    
    console.log(`✅ Transaction sent! [${requestId}]`);
    console.log(`   Hash: ${transactionHash}`);
    console.log(`   Explorer: https://sepolia.basescan.org/tx/${transactionHash}`);
    
    // Record transaction in database
    if (userId) {
      try {
        await Transaction.create({
          transactionHash,
          from: fromAddress.toLowerCase(),
          to: toAddress.toLowerCase(),
          amount: amountInWei.toString(),
          token: 'USDC',
          network,
          type: 'store_purchase',
          status: 'confirmed',
          timestamp: new Date(),
          userId,
          petId,
          metadata: {
            note: 'Pet store purchase - gas-free via CDP paymaster',
            usdcAmount: dollars.toString(),
            paymasterSponsored: true
          }
        });
        
        // Log activity
        await ActivityLog.logActivity(
          userId,
          'store_purchase',
          'purchase',
          {
            to: toAddress,
            amount: dollars.toString(),
            token: 'USDC',
            transactionHash
          },
          petId,
          {
            success: true,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
          }
        );
        
        console.log(`📝 Transaction recorded [${requestId}]`);
      } catch (dbError) {
        console.error('Error recording transaction:', dbError);
        // Continue even if logging fails
      }
    }
    
    const duration = Date.now() - requestStartTime;
    console.log(`\n✅ PAYMENT COMPLETED [${requestId}] in ${duration}ms`);
    console.log(`${'='.repeat(80)}\n`);
    
    return NextResponse.json({
      success: true,
      transactionHash,
      message: 'Payment successful'
    });
    
  } catch (error: any) {
    const duration = Date.now() - requestStartTime;
    console.error(`\n❌ PAYMENT FAILED [${requestId}] after ${duration}ms:`, error);
    console.log(`${'='.repeat(80)}\n`);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Payment failed'
      },
      { status: 500 }
    );
  }
}
