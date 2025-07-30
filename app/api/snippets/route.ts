import { NextRequest, NextResponse } from 'next/server';
import { getSnippets, createSnippet } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
    });
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    
    const snippets = await getSnippets(search);
    
    return NextResponse.json({ snippets });
  } catch (error) {
    console.error('Error fetching snippets:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Failed to fetch snippets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, content, description, client_id, is_general } = body;
    
    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }
    
    const snippet = await createSnippet({
      name,
      content,
      description,
      client_id: client_id || null,
      is_general: is_general !== undefined ? is_general : !client_id
    } as any);
    
    return NextResponse.json({ snippet }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating snippet:', error);
    
    if (error.message?.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'A snippet with this name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create snippet' },
      { status: 500 }
    );
  }
}
