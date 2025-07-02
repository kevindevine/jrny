import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  console.log('🚀 OAuth route hit - starting debug...');
  
  // Check environment variables first
  console.log('🔧 Environment check:', {
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID ? 'present' : 'MISSING',
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET ? 'present' : 'MISSING', 
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING'
  });

  // Check if we can import the strava lib
  try {
    console.log('📚 Attempting to import strava lib...');
    const { getStravaAuthUrl } = await import('@/lib/strava');
    console.log('✅ Strava lib imported successfully');
    
    console.log('🔗 Generating auth URL...');
    const authUrl = getStravaAuthUrl();
    console.log('📍 Generated URL:', authUrl);
    
    if (!authUrl || !authUrl.startsWith('https://www.strava.com')) {
      console.error('❌ Invalid auth URL generated');
      return NextResponse.redirect(new URL('/dashboard?error=invalid_url', 'http://localhost:3000'));
    }
    
    console.log('✅ Redirecting to Strava...');
    return NextResponse.redirect(authUrl);
    
  } catch (importError) {
    console.error('💥 Failed to import strava lib:', importError);
    return NextResponse.redirect(new URL('/dashboard?error=import_failed', 'http://localhost:3000'));
  }
}