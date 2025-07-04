import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { exchangeCodeForToken } from '@/lib/strava';

export async function GET(request: NextRequest) {
  console.log('🔄 Strava callback hit:', request.url);
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  console.log('📥 Callback params:', { 
    code: code ? 'present' : 'missing', 
    error
  });

  if (error) {
    console.log('❌ Strava returned error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=strava_denied', request.url));
  }

  if (!code) {
    console.log('❌ No authorization code received');
    return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url));
  }

  try {
    console.log('🔄 Exchanging code for token...');
    const tokenData = await exchangeCodeForToken(code);
    console.log('✅ Token exchange successful, athlete ID:', tokenData.athlete.id);
    
    // Create Supabase client with new method
    const cookieStore = await cookies();

    // Debug: Log all cookies
    console.log('🍪 Cookies:', cookieStore.getAll());

    // Debug: Log Supabase env vars
    console.log('🌍 ENV:', process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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
    
    console.log('🔍 Checking user authentication...');
    
    // Get user with better error handling
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('👤 User check result:', {
      user: user ? { id: user.id, email: user.email } : null,
      error: userError?.message || 'none'
    });
    
    if (!user) {
      console.log('❌ No authenticated user found');
      
      // Let's also try to get session info for debugging
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 Session check:', {
        session: session ? 'present' : 'null',
        sessionError: sessionError?.message || 'none'
      });
      
      return NextResponse.redirect(new URL('/auth/login?error=not_logged_in&from=strava', request.url));
    }

    console.log('💾 Saving Strava data to database for user:', user.id);
    
    // Update user profile with Strava data
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        strava_id: tokenData.athlete.id,
        strava_access_token: tokenData.access_token,
        strava_refresh_token: tokenData.refresh_token,
        strava_token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
        full_name: `${tokenData.athlete.firstname} ${tokenData.athlete.lastname}`,
        avatar_url: tokenData.athlete.profile,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('💥 Database error:', dbError);
      return NextResponse.redirect(new URL('/dashboard?error=db_error', request.url));
    }

    console.log('✅ Strava connection successful! Redirecting to dashboard...');
    return NextResponse.redirect(new URL('/dashboard?success=strava_connected', request.url));
    
  } catch (error) {
    console.error('💥 Strava callback error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=callback_failed', request.url));
  }
}