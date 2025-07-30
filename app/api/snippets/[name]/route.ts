import { NextRequest, NextResponse } from 'next/server';
import { getSnippet, updateSnippet, deleteSnippet } from '@/lib/supabase';

interface RouteParams {
  params: {
    name: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const snippet = await getSnippet(params.name);
    return NextResponse.json({ snippet });
  } catch (error: any) {
    console.error('Error fetching snippet:', error);
    
    if (error.message?.includes('No rows')) {
      return NextResponse.json(
        { error: 'Snippet not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch snippet' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { content, description } = body;
    
    const snippet = await updateSnippet(params.name, {
      content,
      description
    });
    
    return NextResponse.json({ snippet });
  } catch (error: any) {
    console.error('Error updating snippet:', error);
    
    if (error.message?.includes('No rows')) {
      return NextResponse.json(
        { error: 'Snippet not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update snippet' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await deleteSnippet(params.name);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting snippet:', error);
    return NextResponse.json(
      { error: 'Failed to delete snippet' },
      { status: 500 }
    );
  }
}
