import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationCode } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Send verification code
    const result = await sendVerificationCode(phoneNumber);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Verification code sent successfully' 
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send SMS' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}