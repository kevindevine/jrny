// Replace your src/app/api/strava/sync/route.ts with this fixed version

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { StravaAPI } from '@/lib/strava';

export async function POST(request: NextRequest) {
  console.log('📡 POST /api/strava/sync - Starting Strava sync...');
  
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

    // Get user's Strava tokens
    const { data: profile } = await supabase
      .from('profiles')
      .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
      .eq('id', user.id)
      .single();

    console.log('🔍 Profile check:', {
      hasAccessToken: !!profile?.strava_access_token,
      hasRefreshToken: !!profile?.strava_refresh_token,
      tokenExpiresAt: profile?.strava_token_expires_at
    });

    if (!profile?.strava_access_token) {
      console.log('❌ Strava not connected');
      return NextResponse.json({ error: 'Strava not connected' }, { status: 400 });
    }

    // Check if token needs refresh
    const tokenExpiresAt = new Date(profile.strava_token_expires_at);
    const now = new Date();
    
    let accessToken = profile.strava_access_token;
    
    if (tokenExpiresAt <= now) {
      console.log('🔄 Token expired, refreshing...');
      // Token expired, refresh it
      const stravaAPI = new StravaAPI(accessToken);
      const newTokens = await stravaAPI.refreshToken(profile.strava_refresh_token);
      
      await supabase
        .from('profiles')
        .update({
          strava_access_token: newTokens.access_token,
          strava_refresh_token: newTokens.refresh_token,
          strava_token_expires_at: new Date(newTokens.expires_at * 1000).toISOString(),
        })
        .eq('id', user.id);
        
      accessToken = newTokens.access_token;
      console.log('✅ Token refreshed successfully');
    }

    // Get activities from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log('📥 Fetching Strava activities since:', thirtyDaysAgo.toISOString());
    const strava = new StravaAPI(accessToken);
    const activities = await strava.getActivities(thirtyDaysAgo);

    console.log('📊 Raw activities fetched:', activities.length);

    // Filter for running activities only
    const runningActivities = activities.filter(activity => 
      activity.type === 'Run' || activity.type === 'TrailRun'
    );

    console.log('🏃‍♂️ Running activities found:', runningActivities.length);

    // Upsert activities to database
    const activitiesData = runningActivities.map(activity => ({
      id: activity.id,
      user_id: user.id,
      name: activity.name,
      distance: activity.distance,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      start_date: activity.start_date,
      activity_type: activity.type,
      strava_data: activity,
      synced_at: new Date().toISOString(),
    }));

    if (activitiesData.length > 0) {
      console.log('💾 Saving activities to database for user:', user.id);
      console.log('📝 Sample activity data:', JSON.stringify(activitiesData[0], null, 2));
      
      // Debug: Check all activities for problematic values
      console.log('🔍 Checking all activities for problematic values...');
      activitiesData.forEach((activity, index) => {
        // Check for any fields that might contain "205.2"
        const problematicFields = [];
        if (String(activity.distance).includes('205.2')) problematicFields.push('distance');
        if (String(activity.moving_time).includes('205.2')) problematicFields.push('moving_time');
        if (String(activity.elapsed_time).includes('205.2')) problematicFields.push('elapsed_time');
        if (String(activity.total_elevation_gain).includes('205.2')) problematicFields.push('total_elevation_gain');
        if (String(activity.average_speed).includes('205.2')) problematicFields.push('average_speed');
        if (String(activity.max_speed).includes('205.2')) problematicFields.push('max_speed');
        
        if (problematicFields.length > 0) {
          console.log(`🚨 Activity ${index} (${activity.id}) has problematic values:`, {
            name: activity.name,
            problematicFields,
            distance: activity.distance,
            moving_time: activity.moving_time,
            elapsed_time: activity.elapsed_time,
            total_elevation_gain: activity.total_elevation_gain,
            average_speed: activity.average_speed,
            max_speed: activity.max_speed
          });
        }
        
        // Also check for any non-numeric values in numeric fields
        if (isNaN(Number(activity.moving_time))) {
          console.log(`🚨 Activity ${index} has non-numeric moving_time:`, activity.moving_time);
        }
        if (isNaN(Number(activity.elapsed_time))) {
          console.log(`🚨 Activity ${index} has non-numeric elapsed_time:`, activity.elapsed_time);
        }
        if (isNaN(Number(activity.total_elevation_gain))) {
          console.log(`🚨 Activity ${index} has non-numeric total_elevation_gain:`, activity.total_elevation_gain);
        }
      });
      
      const { data: savedActivities, error: saveError } = await supabase
        .from('strava_activities')
        .upsert(activitiesData, { onConflict: 'id' })
        .select();

      if (saveError) {
        console.error('💥 Error saving activities:', saveError);
        throw saveError;
      }
      
      console.log('✅ Activities saved to database:', savedActivities?.length || 0, 'activities');
    }

    // Try to match activities to planned sessions
    await matchActivitiesToSessions(supabase, user.id, runningActivities);

    console.log('✅ Strava sync completed successfully');
    return NextResponse.json({ 
      success: true, 
      activitiesSync: runningActivities.length 
    });

  } catch (error) {
    console.error('💥 Strava sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

async function matchActivitiesToSessions(supabase: any, userId: string, activities: any[]) {
  console.log('🔄 Matching activities to training sessions...');
  
  // Get active training blocks for user
  const { data: blocks } = await supabase
    .from('training_blocks')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!blocks || blocks.length === 0) {
    console.log('⚠️ No active training blocks found');
    return;
  }

  console.log('📋 Active training blocks:', blocks.length);

  for (const activity of activities) {
    const activityDate = new Date(activity.start_date).toISOString().split('T')[0];
    
    // Try to find a matching planned session
    const { data: session } = await supabase
      .from('training_sessions')
      .select('id, planned_type')
      .eq('training_block_id', blocks[0].id) // Use first active block
      .eq('date', activityDate)
      .neq('planned_type', 'Rest')
      .is('strava_activity_id', null)
      .single();

    if (session) {
      console.log(`🎯 Matching activity ${activity.id} to session ${session.id} on ${activityDate}`);
      
      // Update session with Strava data
      await supabase
        .from('training_sessions')
        .update({
          completed_distance: activity.distance / 1000, // Convert to km
          completed_pace: formatPace(activity.average_speed),
          completed_time: formatTime(activity.moving_time),
          completed_elevation: activity.total_elevation_gain,
          strava_activity_id: activity.id,
          strava_synced_at: new Date().toISOString(),
          is_completed: true,
        })
        .eq('id', session.id);
    }
  }
}

// Helper functions
function formatPace(metersPerSecond: number): string {
  const minutesPerKm = 1000 / (metersPerSecond * 60);
  const minutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}