// Quick fix for src/lib/strava.ts
// Find the redirectUri line and replace it with:

export const stravaConfig: StravaConfig = {
  clientId: process.env.STRAVA_CLIENT_ID!,
  clientSecret: process.env.STRAVA_CLIENT_SECRET!,
  redirectUri: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/api/auth/strava/callback'
    : `${process.env.NEXTAUTH_URL}/api/auth/strava/callback`,
  scope: 'read,activity:read_all'
};
