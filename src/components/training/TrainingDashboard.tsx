import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Settings, CheckCircle, Loader2, User, Link, Camera, LogOut, ExternalLink } from 'lucide-react';
import RaceOverview from './RaceOverview';
import StravaSyncButton, { HeaderWithSync } from '../StravaSyncButton';
import ResetTrainingBlock from '../settings/ResetTrainingBlock';

interface TrainingBlock {
  id: string;
  name: string;
  race_name: string;
  race_date: string;
  goal_time: string | null;
  start_date: string;
  total_weeks: number;
  current_week: number;
  taper_start_week: number;
  status: string;
}

interface SessionData {
  date: string;
  dayName: string;
  planned: {
    type: string;
    distance?: string;
    pace?: string;
    details?: string;
  };
  completed?: {
    type: string;
    distance?: string;
    pace?: string;
    time?: string;
    stravaId?: string;
  } | null;
  stravaActivities?: any[]; // <-- Add this line
}

export default function TrainingDashboard() {
  const [activeTab, setActiveTab] = useState('training');
  const [trainingBlock, setTrainingBlock] = useState<TrainingBlock | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      console.log('📡 Loading training data...');
      const response = await fetch('/api/training/blocks');
      
      if (!response.ok) {
        throw new Error('Failed to load training data');
      }
      
      const blocks = await response.json();
      console.log('📊 Training blocks loaded:', blocks);
      
   if (blocks && blocks.length > 0) {
  // Only get active blocks
  const activeBlock = blocks.find((block: TrainingBlock) => block.status === 'active');
  
  if (activeBlock) {
    setTrainingBlock(activeBlock);
    setCurrentWeek(activeBlock.current_week || 1);
    console.log('✅ Active training block:', activeBlock);
    
    // Load Strava activities for this week
    await loadWeekActivities(activeBlock);
  } else {
    console.log('🎯 No active training block found - should trigger onboarding');
    setTrainingBlock(null);
    setError('No active training block'); // This should trigger onboarding
  }
} else {
  setError('No training blocks found');
}
      
    } catch (err: any) {
      console.error('💥 Error loading training data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadWeekActivities = async (block: TrainingBlock) => {
    try {
      console.log('📡 Loading Strava activities...');
      const response = await fetch('/api/strava/activities', { credentials: 'include' });

      if (response.status === 401) {
        window.location.href = '/auth/login';
        return;
      }

      if (response.ok) {
        const activities = await response.json();
        console.log('Loaded activities:', activities); // <-- Move here!

        // Make sure activities is an array
        if (Array.isArray(activities)) {
          setSessions(activities);
        } else {
          console.log('⚠️ Activities response is not an array:', activities);
          setSessions([]);
        }
      } else {
        console.log('⚠️ Failed to load Strava activities, status:', response.status);
        setSessions([]);
      }
    } catch (error) {
      console.error('💥 Error loading activities:', error);
      setSessions([]);
    }
  };

  // Calculate derived data from training block
  const getDaysToRace = (): number => {
    if (!trainingBlock) return 0;
    const today = new Date();
    const raceDate = new Date(trainingBlock.race_date);
    const diffTime = raceDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getWeeksToTaper = (): number => {
    if (!trainingBlock) return 0;
    return Math.max(0, trainingBlock.taper_start_week - currentWeek);
  };

  const getCurrentWeekNumber = (): number => {
    if (!trainingBlock) return 1;
    
    const startDate = new Date(trainingBlock.start_date);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const weeksSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;
    
    return Math.max(1, Math.min(weeksSinceStart, trainingBlock.total_weeks));
  };

  useEffect(() => {
    if (trainingBlock) {
      setCurrentWeek(getCurrentWeekNumber());
    }
  }, [trainingBlock]);

  // Generate week data with real Strava activities
 const generateWeekData = (weekNumber: number): SessionData[] => {
  const originalStartDate = new Date(trainingBlock?.start_date || new Date());
  

  
  // Find the Monday of the week containing the start date
  const startDayOfWeek = originalStartDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToSubtract = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  
  const mondayOfStartWeek = new Date(originalStartDate);
  mondayOfStartWeek.setDate(originalStartDate.getDate() - daysToSubtract);
  
  const weekOffset = (weekNumber - 1) * 7;
    
    const weekData: SessionData[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    console.log('🔍 Generating week data for week', weekNumber);
    console.log('📅 Start date:', originalStartDate.toISOString());
console.log('📅 Monday of start week:', mondayOfStartWeek.toISOString());
    console.log('🏃‍♂️ Available activities:', sessions.length);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayOfStartWeek);
date.setDate(mondayOfStartWeek.getDate() + weekOffset + i);
      const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
      // Mock planned sessions (until we have real session data)
     const sessions_static = {
  0: { type: '', details: null },
  1: { type: '', details: null },
  2: { type: '', details: null },
  3: { type: '', details: null },
  4: { type: '', details: null },
  5: { type: '', details: null },
  6: { type: '', details: null }
};
      
      // Find matching Strava activity for this date from the loaded sessions state
      const stravaActivities = Array.isArray(sessions) ? sessions.filter((activity: any) => {
        if (!activity.start_date) return false;
        // Convert both to local date string (YYYY-MM-DD)
        const activityDate = new Date(activity.start_date).toLocaleDateString('en-CA');
        // Only include runs
        return activityDate === dateStr; 
      }) : [];

      // ADD THIS DEBUG LINE:
if (i === 0) console.log(`🔍 Monday ${dateStr} - checking ${sessions.length} activities. First activity date: ${sessions[0]?.start_date}, formatted: ${new Date(sessions[0]?.start_date).toLocaleDateString('en-CA')}`);
if (i === 0) console.log(`📅 Your activities this week:`, sessions.slice(0, 5).map(a => ({ 
  name: a.name, 
  date: a.start_date?.split('T')[0],
  type: a.type 
})));      
      let completed = null;
      if (stravaActivities.length > 0) {
        const stravaActivity = stravaActivities[0];
        const distanceKm = (stravaActivity.distance / 1000).toFixed(1);
        const pace = formatPaceFromSpeed(stravaActivity.average_speed);
        const time = formatDuration(stravaActivity.moving_time);
        
        completed = {
          type: 'Run',
          distance: `${distanceKm}km`,
          pace: pace,
          time: time,
          stravaId: stravaActivity.id.toString()
        };
        
        console.log('🎯 Created completed session for', dateStr, ':', completed);
      }
      
      weekData.push({
  date: dateStr,
  dayName: dayNames[i],
  planned: sessions_static[i as keyof typeof sessions_static],
  stravaActivities // <-- pass all activities for the day
});
    }
    
    console.log('📊 Generated week data:', weekData.filter(d => d.completed).length, 'completed sessions');
    return weekData;
  };

  // Helper functions for formatting Strava data
  const formatPaceFromSpeed = (metersPerSecond: number): string => {
    const minutesPerKm = 1000 / (metersPerSecond * 60);
    const minutes = Math.floor(minutesPerKm);
    const seconds = Math.round((minutesPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const isToday = (date: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const isPast = (date: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return date < today;
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/85 to-purple-900/90"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg italic transform -skew-x-6 mb-8">
              JRNY
            </h1>
            <div className="flex items-center justify-center space-x-2 text-white/80">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg font-medium">Loading your training plan...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

if (error || !trainingBlock) {
  // If it's specifically "no active training block", trigger onboarding instead of error
  if (error === 'No active training block') {
    // Create empty training block for onboarding
    const emptyBlock: TrainingBlock = {
      id: '',
      name: '',
      race_name: '',
      race_date: '',
      goal_time: null,
      start_date: new Date().toISOString().split('T')[0],
      total_weeks: 18,
      current_week: 1,
      taper_start_week: 16,
      status: 'active'
    };

    return (
      <div className="max-w-md mx-auto min-h-screen relative overflow-hidden">
        {/* Your existing background styling */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-300/30 via-red-300/20 to-purple-300/30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/85 to-purple-900/90"></div>
        
        <div className="relative z-10">
          <div className="sticky top-0 z-20">
            <div className="py-3">
              <h1 className="text-xl font-black text-center text-white tracking-tighter drop-shadow-lg italic transform -skew-x-6">
                JRNY
              </h1>
            </div>
          </div>

          <div className="p-6">
            {/* This will trigger onboarding since race_name is empty */}
            <RaceOverview 
              trainingBlock={emptyBlock}
              currentWeek={1}
              onUpdate={(updatedBlock) => {
                console.log('📝 New training block created:', updatedBlock);
                // Reload to show the new block
                window.location.reload();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // For other errors, show the error screen
  return (
    <div className="max-w-md mx-auto min-h-screen relative overflow-hidden">
      {/* Your existing error display code */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/85 to-purple-900/90"></div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg italic transform -skew-x-6 mb-8">
            JRNY
          </h1>
          
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 mb-6">
            <p className="text-red-200 mb-4">
              Unable to load your training plan
            </p>
            <p className="text-red-300/80 text-sm mb-4">
              {error || 'No training plan found'}
            </p>
            <button 
              onClick={loadTrainingData}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

  const timelineData = generateWeekData(currentWeek);

  const generateWeeklyMileage = () => {
    const weeks = [];
    for (let week = 1; week <= trainingBlock.total_weeks; week++) {
      let mileage;
      if (week <= 4) mileage = 40 + week * 5;
      else if (week <= 8) mileage = 55 + (week - 4) * 3;
      else if (week <= 12) mileage = 65 + (week - 8) * 2;
      else if (week <= 15) mileage = 70 - (week - 12) * 2;
      else mileage = 60 - (week - 15) * 15;
      
      weeks.push({
        week,
        mileage: Math.max(mileage, 20),
        completed: week < currentWeek ? mileage * 0.85 : (week === currentWeek ? mileage * 0.6 : 0)
      });
    }
    return weeks;
  };

  const TrainingTimeline = () => {
    const weeklyData = generateWeeklyMileage();
    const maxMileage = Math.max(...weeklyData.map(w => w.mileage));
    
    const createProgressPath = (): string => {
      const width = 100;
      const height = 30;
      const stepX = width / (trainingBlock.total_weeks - 1);
      
      let pathData = '';
      weeklyData.forEach((week, index) => {
        const x = index * stepX;
        const y = height - (week.mileage / maxMileage) * height;
        
        if (index === 0) {
          pathData += `M ${x} ${y}`;
        } else {
          pathData += ` L ${x} ${y}`;
        }
      });
      
      return pathData;
    };

    return (






      <div className="space-y-6">
        {/* Progress Block with Real Data */}
       {/* <div className="bg-gradient-to-r from-orange-400 to-red-500 p-6 rounded-lg shadow-xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-3 bottom-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="white" stopOpacity={0.1}/>
                </linearGradient>
                <mask id="weekMask">
                  <rect width="100" height="30" fill="white"/>
                  <path
                    d={`${createProgressPath()} L 100 0 L 0 0 Z`}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                x={(currentWeek - 1) * (100 / (trainingBlock.total_weeks - 1)) - (100 / (trainingBlock.total_weeks - 1)) / 2}
                y="0"
                width={100 / (trainingBlock.total_weeks - 1)}
                height="30"
                fill="white"
                opacity="0.3"
                mask="url(#weekMask)"
              />
              <path
                d={`${createProgressPath()} L 100 30 L 0 30 Z`}
                fill="url(#progressGradient)"
              />
              <path
                d={createProgressPath()}
                stroke="white"
                strokeWidth="0.8"
                fill="none"
                opacity="0.6"
              />
            </svg>
          </div>
          
          <div className="relative z-10 text-center">
            <div className="text-4xl font-black text-white drop-shadow-lg">{getDaysToRace()}</div>
            <div className="text-white/90 font-medium tracking-wide">days to {trainingBlock.race_name}</div>
            <div className="text-xs text-white/70 mt-1">
              {trainingBlock.goal_time && (
                <span>Goal: {trainingBlock.goal_time} • </span>
              )}
              {getWeeksToTaper() > 0 ? (
                `${getWeeksToTaper()} weeks to taper`
              ) : (
                currentWeek >= trainingBlock.taper_start_week ? 'Taper time! 🎯' : 'Final preparations! 💪'
              )}
            </div>
          </div>
          
          <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-1">
            {Array.from({ length: trainingBlock.total_weeks }, (_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full transition-all duration-300 ${
                  i + 1 === currentWeek 
                    ? 'bg-white scale-150' 
                    : i + 1 < currentWeek 
                      ? 'bg-white/60' 
                      : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>*/}

<RaceOverview 
  trainingBlock={trainingBlock}
  currentWeek={currentWeek}
  onUpdate={(updatedBlock) => {
    setTrainingBlock(updatedBlock);
  }}
/>


        {/* Week Navigation */}
        <div className="py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => currentWeek > 1 && setCurrentWeek(prev => prev - 1)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${currentWeek > 1 ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/10 text-white/40'}`}
              disabled={currentWeek <= 1}
            >
              ←
            </button>
            <div className="text-center">
  <h3 className="font-bold text-xl text-white/90">Week {currentWeek}</h3>
  <div className="text-sm text-white/70">
    {(() => {
      const weekTotal = timelineData.reduce((total, day) => {
        if (day.stravaActivities && day.stravaActivities.length > 0) {
          return total + day.stravaActivities.reduce((dayTotal: number, act: any) => dayTotal + act.distance, 0);
        }
        return total;
      }, 0);
      const weekTotalKm = (weekTotal / 1000).toFixed(1);
      return weekTotal > 0 ? `${weekTotalKm}km this week` : 'Target 90km';
    })()}
  </div>
</div>
            <button 
              onClick={() => currentWeek < trainingBlock.total_weeks && setCurrentWeek(prev => prev + 1)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${currentWeek < trainingBlock.total_weeks ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/10 text-white/40'}`}
              disabled={currentWeek >= trainingBlock.total_weeks}
            >
              →
            </button>
          </div>
        </div>

        {/* Timeline with Real Data Context */}
        <div className="space-y-3">
          {timelineData.map((day, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className={`flex-shrink-0 w-10 text-center py-1.5 px-1 rounded text-xs ${
                isToday(day.date) ? 'bg-orange-200 text-orange-800' : 'bg-blue-50 text-blue-700'
              }`}>
                <div className="text-xs font-medium leading-tight">{new Date(day.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</div>
                <div className="text-sm font-black leading-tight">{new Date(day.date).getDate()}</div>
              </div>
              
              <div className={`flex-1 rounded p-4 shadow-md border transition-all duration-200 ${
                isToday(day.date) ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 shadow-lg' : 
                isPast(day.date) ? 'bg-gray-50/80 border-gray-200' : 'bg-white border-gray-100 hover:shadow-lg'
              }`}>
                
               
<div className="flex items-center justify-between mb-3">
  <div className={`flex items-center gap-2 ${
    isToday(day.date) ? 'text-orange-700' : 'text-gray-700'
  }`}>
    {day.stravaActivities && day.stravaActivities.length > 0 ? (
      // Show real Strava data when activities exist
      <>
        <span className="text-sm font-medium">
          {day.stravaActivities.length === 1 
            ? day.stravaActivities[0].name 
            : `${day.stravaActivities.length} runs`
          }
        </span>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
          {((day.stravaActivities.reduce((total: number, act: any) => total + act.distance, 0)) / 1000).toFixed(1)}km
        </span>
      </>
    ) : (
      
      // Show generic message when no activities
      <span className="text-sm font-medium text-gray-500">
        {isPast(day.date) ? 'Rest day' : 'Planned training'}
      </span>
    
    )}
  </div>
</div>

{/* Show planned details only when no Strava activities */}
{(!day.stravaActivities || day.stravaActivities.length === 0) && day.planned.pace && (
  <div className="text-xs text-gray-500 mb-2">{day.planned.pace}</div>
)}
{(!day.stravaActivities || day.stravaActivities.length === 0) && day.planned.details && (
  <div className="text-xs text-gray-500 mb-2 italic">{day.planned.details}</div>
)}

                {/*{day.planned.pace && (
                  <div className="text-xs text-gray-500 mb-2">{day.planned.pace}</div>
                )}
                {day.planned.details && (
                  <div className="text-xs text-gray-500 mb-2 italic">{day.planned.details}</div>
                )}*/}

{console.log(`🔍 Day ${day.date}:`, { 
  stravaActivities: day.stravaActivities, 
  length: day.stravaActivities?.length 
}) || null}
{day.stravaActivities && day.stravaActivities.length > 1 ? (
  <div className={`text-xs border-t pt-2 mt-2 ${
    isToday(day.date) ? 'border-orange-200' : 'border-gray-200'
  }`}>
    {day.stravaActivities.map((act: any) => (
      <div key={act.id} className="flex items-center gap-2 text-green-600 mb-1">
        <CheckCircle className="w-3 h-3" />
        <span className="font-medium">
          {act.name} • {(act.distance / 1000).toFixed(1)}km
        </span>
        <a 
          href={`https://www.strava.com/activities/${act.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500 hover:text-orange-600 text-xs font-medium"
        >
          Strava
        </a>
      </div>
    ))}
  </div>
) : day.stravaActivities && day.stravaActivities.length === 1 ? (
  <div className={`text-xs border-t pt-2 mt-2 ${
    isToday(day.date) ? 'border-orange-200' : 'border-gray-200'
  }`}>
    <div className="flex items-center gap-2 text-green-600">
      <CheckCircle className="w-3 h-3" />
      
        <a href={`https://www.strava.com/activities/${day.stravaActivities[0].id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-500 hover:text-orange-600 text-xs font-medium"
      >
        View on Strava
      </a>
    </div>
  </div>
) : null}

                {!day.completed && !isPast(day.date) && day.planned.type !== 'Rest' && !isToday(day.date) && (
                <div className="text-xs text-gray-400 border-t border-gray-200 pt-2 mt-2 italic">
                    {/* Planned session*/}
                  </div>
                )}

                {!day.stravaActivities?.length && isToday(day.date) && day.planned.type !== 'Rest' && (
  <div className="text-xs text-orange-600 border-t border-orange-200 pt-2 mt-2 italic">
    Today's session - connect Strava to sync!
  </div>
)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative overflow-hidden">
      {/* Background based on race location or keep Valencia theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-300/30 via-red-300/20 to-purple-300/30"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-orange-400 to-transparent"></div>
        <div className="absolute top-20 left-10 w-16 h-32 bg-white/40 rounded-sm"></div>
        <div className="absolute top-16 left-32 w-20 h-36 bg-white/50 rounded-sm"></div>
        <div className="absolute top-24 left-56 w-18 h-28 bg-white/40 rounded-sm"></div>
        <div className="absolute top-12 right-20 w-24 h-40 bg-white/60 rounded-sm"></div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/85 to-purple-900/90"></div>
      
      <div className="relative z-10">
        {/* Header */}
   
 <HeaderWithSync 
  onSync={async () => {
    await fetch('/api/strava/sync', { method: 'POST', credentials: 'include' });
    window.location.reload();
  }}
/>


        {/* Content */}
        <div className="p-6 pb-24">
          {activeTab === 'training' && <TrainingTimeline />}
          {activeTab === 'progress' && <div>Progress Dashboard (Coming Soon)</div>}
{activeTab === 'settings' && (
  <div className="space-y-6">
    {/* Reset Training Block Section - ADD THIS */}
    <ResetTrainingBlock 
      currentBlock={trainingBlock ? {
        id: trainingBlock.id,
        race_name: trainingBlock.race_name,
        race_date: trainingBlock.race_date,
        current_week: trainingBlock.current_week,
        total_weeks: trainingBlock.total_weeks
      } : undefined}
      onReset={() => {
        console.log('🔄 Training block reset - reloading page...');
        window.location.reload();
      }}
    />

    {/* Your existing Strava Connection Status - KEEP THIS */}
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Strava Integration</h3>
      
      {trainingBlock ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <p className="text-green-400 text-sm font-medium">
              Strava Connected
            </p>
          </div>
          <p className="text-white/80 text-sm mb-4">
            Your Strava activities are automatically syncing to your training plan.
          </p>
          <button
            onClick={() => window.location.href = '/api/auth/strava'}
            className="w-full bg-white/20 text-white px-4 py-3 rounded-md hover:bg-white/30 font-medium border border-white/30"
          >
            Reconnect Strava
          </button>
        </div>
      ) : (
        <div>
          <p className="text-white/80 text-sm mb-4">
            Connect your Strava account to automatically sync your runs.
          </p>
          <button
            onClick={() => window.location.href = '/api/auth/strava'}
            className="w-full bg-[#FC4C02] text-white px-4 py-3 rounded-md hover:bg-[E8440B] font-medium"
          >
            Connect Strava
          </button>
        </div>
      )}
    </div>

    {/* Your existing Logout Button - KEEP THIS */}
    <button
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/auth/login';
      }}
      className="w-full bg-gray-700 text-white px-4 py-3 rounded-md hover:bg-gray-800 font-medium"
    >
      Log Out
    </button>
  </div>
)}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/20 backdrop-blur-lg border-t border-white/30">
          <div className="max-w-md mx-auto flex">
            <button
              onClick={() => setActiveTab('training')}
              className={`flex-1 p-4 text-center transition-all duration-300 ${
                activeTab === 'training' ? 'bg-blue-500/90 text-white shadow-lg' : 'text-slate-700 hover:text-slate-900 hover:bg-white/20'
              }`}
            >
              <Calendar className="w-6 h-6 mx-auto mb-1" />
              <div className="text-xs font-medium">Training</div>
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex-1 p-4 text-center transition-all duration-300 ${
                activeTab === 'progress' ? 'bg-blue-500/90 text-white shadow-lg' : 'text-slate-700 hover:text-slate-900 hover:bg-white/20'
              }`}
            >
              <TrendingUp className="w-6 h-6 mx-auto mb-1" />
              <div className="text-xs font-medium">Progress</div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 p-4 text-center transition-all duration-300 ${
                activeTab === 'settings' ? 'bg-blue-500/90 text-white shadow-lg' : 'text-slate-700 hover:text-slate-900 hover:bg-white/20'
              }`}
            >
              <Settings className="w-6 h-6 mx-auto mb-1" />
              <div className="text-xs font-medium">Settings</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}