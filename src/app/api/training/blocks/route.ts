// Replace your src/app/api/training/blocks/route.ts with this fixed version

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // Update the training block in Supabase with new total_weeks
}

export async function GET() {
  console.log('📡 GET /api/training/blocks - Fetching training blocks...');
  
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

    const { data: blocks, error } = await supabase
      .from('training_blocks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('💥 Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Training blocks fetched:', blocks?.length || 0, 'blocks found');
    return NextResponse.json(blocks || []);
    
  } catch (error) {
    console.error('💥 API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('📡 POST /api/training/blocks - Creating training block...');
  
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
    console.log('👤 User from auth:', user ? { id: user.id, email: user.email } : 'NULL');
console.log('🔍 User error:', userError);
    console.log('👤 User check:', {
      user: user ? { id: user.id, email: user.email } : null,
      error: userError?.message || 'none'
    });
    
    if (!user) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 Request body:', body);
    console.log('🆔 Using user_id for insert:', user.id);
    const { data: block, error } = await supabase
      .from('training_blocks')
      .insert({
        user_id: user.id,
        name: body.name,
        race_name: body.race_name,
        race_date: body.race_date,
        goal_time: body.goal_time,
        start_date: body.start_date,
        total_weeks: body.total_weeks || 18,
        taper_start_week: body.taper_start_week || 16,
      })
      .select()
      .single();

    if (error) {
      console.error('💥 Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Training block created:', block);
    return NextResponse.json(block);
    
  } catch (error) {
    console.error('💥 API Error:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}