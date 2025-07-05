// Create this file: src/app/api/training/blocks/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('📡 PUT /api/training/blocks/[id] - Updating training block...');
  
  try {
    // Fix: Await cookies() before using
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('👤 User check:', {
      user: user ? { id: user.id, email: user.email } : null,
      error: userError?.message || 'none'
    });
    
    if (!user) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 Update request body:', body);
    console.log('🆔 Training block ID:', params.id);
    
    // Update the training block with new data including total_weeks
    const { data: updatedBlock, error } = await supabase
      .from('training_blocks')
      .update({
        race_name: body.race_name,
        race_date: body.race_date,
        goal_time: body.goal_time,
        start_date: body.start_date,
        total_weeks: body.total_weeks,
        taper_start_week: body.taper_start_week,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id) // Security: only update user's own blocks
      .select()
      .single();

    if (error) {
      console.error('💥 Database update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updatedBlock) {
      console.log('❌ Training block not found or not owned by user');
      return NextResponse.json({ error: 'Training block not found' }, { status: 404 });
    }

    console.log('✅ Training block updated successfully:', updatedBlock);
    return NextResponse.json(updatedBlock);
    
  } catch (error) {
    console.error('💥 API Error:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('📡 GET /api/training/blocks/[id] - Fetching single training block...');
  
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: block, error } = await supabase
      .from('training_blocks')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('💥 Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!block) {
      return NextResponse.json({ error: 'Training block not found' }, { status: 404 });
    }

    console.log('✅ Training block fetched:', block);
    return NextResponse.json(block);
    
  } catch (error) {
    console.error('💥 API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}