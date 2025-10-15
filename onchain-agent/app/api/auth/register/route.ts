import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Add error handling for JSON parsing
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { type, email, phone, password, name } = body;

    // Validate required fields
    if (!type || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: type, password, name' },
        { status: 400 }
      );
    }

    if (type === 'email') {
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required for email registration' },
          { status: 400 }
        );
      }

      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 400 }
          );
        }

        // Create new user
        const user = new User({
          email,
          password,
          name
        });

        await user.save();

        return NextResponse.json({
          success: true,
          message: 'User registered successfully',
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
          }
        });
      } catch (error: unknown) {
        console.error('Email registration error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Registration failed' },
          { status: 500 }
        );
      }
    } else if (type === 'phone') {
      if (!phone) {
        return NextResponse.json(
          { error: 'Phone number is required for phone registration' },
          { status: 400 }
        );
      }

      try {
        // Check if user already exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
          return NextResponse.json(
            { error: 'User with this phone number already exists' },
            { status: 400 }
          );
        }

        // Create new user
        const user = new User({
          phone,
          password,
          name
        });

        await user.save();

        return NextResponse.json({
          success: true,
          message: 'User registered successfully',
          user: {
            id: user._id,
            phone: user.phone,
            name: user.name,
          }
        });
      } catch (error: unknown) {
        console.error('Phone registration error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Registration failed' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid registration type. Must be "email" or "phone"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}