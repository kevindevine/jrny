import { createBrowserClient } from '@supabase/ssr'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          strava_id: number | null;
          strava_access_token: string | null;
          strava_refresh_token: string | null;
          strava_token_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          strava_id?: number | null;
          strava_access_token?: string | null;
          strava_refresh_token?: string | null;
          strava_token_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          strava_id?: number | null;
          strava_access_token?: string | null;
          strava_refresh_token?: string | null;
          strava_token_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      training_blocks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          race_name: string;
          race_date: string;
          goal_time: string | null;
          start_date: string;
          total_weeks: number;
          taper_start_week: number;
          current_week: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          race_name: string;
          race_date: string;
          goal_time?: string | null;
          start_date: string;
          total_weeks?: number;
          taper_start_week?: number;
          current_week?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          race_name?: string;
          race_date?: string;
          goal_time?: string | null;
          start_date?: string;
          total_weeks?: number;
          taper_start_week?: number;
          current_week?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      training_sessions: {
        Row: {
          id: string;
          training_block_id: string;
          date: string;
          week_number: number;
          day_of_week: number;
          planned_type: string;
          planned_distance: string | null;
          planned_pace: string | null;
          planned_details: string | null;
          completed_distance: number | null;
          completed_pace: string | null;
          completed_time: string | null;
          completed_elevation: number | null;
          strava_activity_id: number | null;
          strava_synced_at: string | null;
          is_completed: boolean;
          is_modified: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          training_block_id: string;
          date: string;
          week_number: number;
          day_of_week: number;
          planned_type: string;
          planned_distance?: string | null;
          planned_pace?: string | null;
          planned_details?: string | null;
          completed_distance?: number | null;
          completed_pace?: string | null;
          completed_time?: string | null;
          completed_elevation?: number | null;
          strava_activity_id?: number | null;
          strava_synced_at?: string | null;
          is_completed?: boolean;
          is_modified?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          training_block_id?: string;
          date?: string;
          week_number?: number;
          day_of_week?: number;
          planned_type?: string;
          planned_distance?: string | null;
          planned_pace?: string | null;
          planned_details?: string | null;
          completed_distance?: number | null;
          completed_pace?: string | null;
          completed_time?: string | null;
          completed_elevation?: number | null;
          strava_activity_id?: number | null;
          strava_synced_at?: string | null;
          is_completed?: boolean;
          is_modified?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      strava_activities: {
        Row: {
          id: number;
          user_id: string;
          name: string | null;
          distance: number | null;
          moving_time: number | null;
          elapsed_time: number | null;
          total_elevation_gain: number | null;
          average_speed: number | null;
          max_speed: number | null;
          start_date: string | null;
          activity_type: string | null;
          strava_data: any | null;
          synced_at: string;
        };
        Insert: {
          id: number;
          user_id: string;
          name?: string | null;
          distance?: number | null;
          moving_time?: number | null;
          elapsed_time?: number | null;
          total_elevation_gain?: number | null;
          average_speed?: number | null;
          max_speed?: number | null;
          start_date?: string | null;
          activity_type?: string | null;
          strava_data?: any | null;
          synced_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          name?: string | null;
          distance?: number | null;
          moving_time?: number | null;
          elapsed_time?: number | null;
          total_elevation_gain?: number | null;
          average_speed?: number | null;
          max_speed?: number | null;
          start_date?: string | null;
          activity_type?: string | null;
          strava_data?: any | null;
          synced_at?: string;
        };
      };
    };
  };
};

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Utility functions
export function formatSupabaseDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseSupabaseDate(dateString: string): Date {
  return new Date(dateString);
}

export function getDayOfWeek(date: Date): number {
  // Convert JS getDay() (0=Sunday) to our format (1=Monday)
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export function getWeekNumber(startDate: Date, currentDate: Date): number {
  const diffTime = currentDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
}