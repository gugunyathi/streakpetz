import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import Pet from '@/lib/models/Pet';

export async function POST(request: NextRequest) {
  try {
    console.log('\n🖼️ Uploading pet image...');
    
    const body = await request.json();
    const { petId, imageUrl } = body;
    
    if (!petId || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'petId and imageUrl are required' },
        { status: 400 }
      );
    }
    
    // Validate image URL
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
      return NextResponse.json(
        { success: false, error: 'Invalid image URL format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Update pet with new image
    const pet = await Pet.findByIdAndUpdate(
      petId,
      { imageUrl },
      { new: true }
    );
    
    if (!pet) {
      return NextResponse.json(
        { success: false, error: 'Pet not found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Image updated for pet: ${pet.name}`);
    
    return NextResponse.json({
      success: true,
      message: 'Pet image updated successfully',
      pet: {
        id: pet._id.toString(),
        name: pet.name,
        imageUrl: pet.imageUrl
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error uploading image:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload image',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
