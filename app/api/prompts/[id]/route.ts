import { NextRequest, NextResponse } from 'next/server';
import { getComposedPrompt, updateComposedPrompt, deleteComposedPrompt } from '@/lib/supabase';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const prompt = await getComposedPrompt(params.id);
    return NextResponse.json({ prompt });
  } catch (error: any) {
    console.error('Error fetching prompt:', error);
    
    if (error.message?.includes('No rows')) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch prompt' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const prompt = await updateComposedPrompt(params.id, body);
    
    return NextResponse.json({ prompt });
  } catch (error: any) {
    console.error('Error updating prompt:', error);
    
    if (error.message?.includes('No rows')) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await deleteComposedPrompt(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}