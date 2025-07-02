// Create: src/app/api/strava/activities/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  console.log('📡 GET /api/strava/activities - Fetching user activities...');
  
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

    // Get user's Strava activities from database
    const { data: activities, error } = await supabase
      .from('strava_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('💥 Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Strava activities fetched:', activities?.length || 0, 'activities found');
    return NextResponse.json(activities || []);
    
  } catch (error) {
    console.error('💥 API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}