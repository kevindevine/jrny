
'use client';

import { useState, useEffect } from 'react';
import { Loader2, Target } from 'lucide-react';
import TrainingDashboard from '@/components/training/TrainingDashboard';
import RaceOverview from '@/components/training/RaceOverview';

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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [hasTrainingPlan, setHasTrainingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkForExistingPlans();
  }, []);

  const checkForExistingPlans = async () => {
    try {
      console.log("🔍 Checking for existing training plans...");
      const response = await fetch("/api/training/blocks");
      
      console.log("📡 Response status:", response.status);
      
      if (response.status === 401) {
        // User not authenticated - redirect to login
        console.log("🔐 User not authenticated - redirecting to login");
        window.location.href = '/auth/login';
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", response.status, errorText);
        setError(`Failed to load training data: ${response.status}`);
        setLoading(false);
        return;
      }
      
      const blocks = await response.json();
      console.log("📊 Training blocks found:", blocks);
      
      const hasActivePlan = blocks && Array.isArray(blocks) && blocks.length > 0;
      
      console.log("✅ Has training plan:", hasActivePlan);
      setHasTrainingPlan(hasActivePlan);
      
    } catch (err: any) {
      console.error("💥 Error checking training plans:", err);
      setError("Network error - please check your connection");
    } finally {
      setLoading(false);
    }
  };

  const createTrainingBlock = async (blockData: TrainingBlock) => {
    try {
      console.log("📝 Creating new training block:", blockData);
      
      const response = await fetch('/api/training/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: blockData.name,
          race_name: blockData.race_name,
          race_date: blockData.race_date,
          goal_time: blockData.goal_time,
          start_date: blockData.start_date,
          total_weeks: blockData.total_weeks,
          taper_start_week: blockData.taper_start_week
        })
      });

      if (response.ok) {
        console.log("✅ Training block created successfully");
        setHasTrainingPlan(true);
        // Reload to show the dashboard with new data
        window.location.reload();
      } else {
        console.error("❌ Failed to create training block");
        setError("Failed to create training plan");
      }
    } catch (error) {
      console.error("💥 Error creating training block:", error);
      setError("Network error - please try again");
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen relative overflow-hidden">
        {/* Valencia Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-300/30 via-red-300/20 to-purple-300/30"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-orange-400 to-transparent"></div>
          <div className="absolute top-20 left-10 w-16 h-32 bg-white/40 rounded-sm"></div>
          <div className="absolute top-16 left-32 w-20 h-36 bg-white/50 rounded-sm"></div>
          <div className="absolute top-24 left-56 w-18 h-28 bg-white/40 rounded-sm"></div>
          <div className="absolute top-12 right-20 w-24 h-40 bg-white/60 rounded-sm"></div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/85 to-purple-900/90"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg italic transform -skew-x-6 mb-8" 
                style={{fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.05em'}}>
              JRNY
            </h1>
            
            <div className="flex items-center justify-center space-x-2 text-white/80">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg font-medium">Setting up your journey...</span>
            </div>
            
            <p className="text-white/60 mt-4 text-sm">
              Checking for existing training plans
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/85 to-purple-900/90"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg italic transform -skew-x-6 mb-8">
              JRNY
            </h1>
            
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 mb-6">
              <p className="text-red-200 mb-4">
                Unable to load your training data
              </p>
              <p className="text-red-300/80 text-sm mb-4">
                {error}
              </p>
              <button 
                onClick={checkForExistingPlans}
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

  // If user has a training plan, show the main dashboard
  if (hasTrainingPlan) {
    return <TrainingDashboard />;
  }

  // If no training plan, show setup form using existing RaceOverview component
  const defaultBlock: TrainingBlock = {
    id: 'new',
    name: 'My Training Block',
    race_name: '',
    race_date: '',
    goal_time: '',
    start_date: new Date().toISOString().split('T')[0], // Today
    total_weeks: 18,
    current_week: 1,
    taper_start_week: 16,
    status: 'active'
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative overflow-hidden">
      {/* Valencia Background */}
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
        <div className="sticky top-0 z-20">
          <div className="py-6 text-center">
            <h1 className="text-2xl font-black text-white tracking-tighter drop-shadow-lg italic transform -skew-x-6" 
                style={{fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.05em'}}>
              JRNY
            </h1>
            <p className="text-white/70 text-sm mt-2">
              Your marathon training companion
            </p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="px-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-center">
              <Target className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-3">
                Welcome to JRNY! 🏃‍♂️
              </h2>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                Let's set up your marathon training plan. First, connect your Strava account, 
                then fill in your race details to start tracking your progress.
              </p>
              
              {/* Strava Connection Button */}
              <button
                onClick={() => window.location.href = '/api/auth/strava'}
                className="w-full bg-[#FC4C02] hover:bg-[#E8440B] text-white px-4 py-3 rounded-md font-medium mb-4 flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.917"/>
                </svg>
                Connect Strava First
              </button>
            </div>
          </div>
        </div>

        {/* Race Setup Form - Reusing your existing component */}
        <div className="px-6 pb-24">
          <RaceOverview 
            trainingBlock={defaultBlock}
            currentWeek={1}
            onUpdate={createTrainingBlock}
          />
        </div>
      </div>
    </div>
  );
}