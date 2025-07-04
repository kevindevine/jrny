export interface StravaConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

export const stravaConfig: StravaConfig = {
  clientId: process.env.STRAVA_CLIENT_ID!,
  clientSecret: process.env.STRAVA_CLIENT_SECRET!,
  redirectUri: process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000/api/auth/strava/callback'
  : `${process.env.NEXTAUTH_URL}/api/auth/strava/callback`,
  scope: 'read,activity:read_all'
};

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
    profile: string;
  };
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  average_speed: number;
  max_speed: number;
}

export class StravaAPI {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getActivities(after?: Date, before?: Date): Promise<StravaActivity[]> {
    const params = new URLSearchParams();
    if (after) params.append('after', Math.floor(after.getTime() / 1000).toString());
    if (before) params.append('before', Math.floor(before.getTime() / 1000).toString());
    params.append('per_page', '200');

    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getActivity(id: number): Promise<StravaActivity> {
    const response = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.statusText}`);
    }

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<StravaTokenResponse> {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: stravaConfig.clientId,
        client_secret: stravaConfig.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Strava token refresh error: ${response.statusText}`);
    }

    return response.json();
  }
}

// Utility functions
export function getStravaAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: stravaConfig.clientId,
    redirect_uri: stravaConfig.redirectUri,
    response_type: 'code',
    scope: stravaConfig.scope,
    approval_prompt: 'auto',
  });

  return `https://www.strava.com/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: stravaConfig.clientId,
      client_secret: stravaConfig.clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error(`Strava token exchange error: ${response.statusText}`);
  }

  return response.json();
}

// Helper to format pace from m/s to min/km
export function formatPace(metersPerSecond: number): string {
  const minutesPerKm = 1000 / (metersPerSecond * 60);
  const minutes = Math.floor(minutesPerKm);
  const seconds = Math.round((minutesPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper to format distance
export function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(1)}km`;
}

// Helper to format time
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
