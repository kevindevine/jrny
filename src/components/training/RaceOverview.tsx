import React, { useState } from 'react';
import { Edit3, X } from 'lucide-react';

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

interface RaceOverviewProps {
  trainingBlock?: TrainingBlock;
  currentWeek?: number;
  onUpdate?: (updatedBlock: TrainingBlock) => void;
}

export default function RaceOverview({ 
  trainingBlock = {
    id: '1',
    name: 'Test Block',
    race_name: 'Valencia Marathon',
    race_date: '2025-12-07',
    goal_time: '3:15:00',
    start_date: '2025-07-01',
    total_weeks: 18,
    current_week: 10,
    taper_start_week: 16,
    status: 'active'
  }, 
  currentWeek = 10, 
  onUpdate = () => {}
}: RaceOverviewProps) {
  // Check if this is onboarding (empty race name indicates new setup)
  const isOnboarding = !trainingBlock.race_name || trainingBlock.race_name === '';
  
  const [isEditing, setIsEditing] = useState(isOnboarding); // Start in edit mode if onboarding
  const [editForm, setEditForm] = useState<TrainingBlock>(trainingBlock);
  const [isSaving, setIsSaving] = useState(false);

  const calculateTotalWeeks = (): number => {
    const startDate = new Date(editForm.start_date);
    const raceDate = new Date(editForm.race_date);
    
    // Handle invalid dates
    if (isNaN(startDate.getTime()) || isNaN(raceDate.getTime())) {
      return 18; // Default fallback
    }
    
    const diffTime = raceDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(diffDays / 7));
  };

  const actualTotalWeeks = calculateTotalWeeks();

  const getDaysToRace = (): number => {
    const today = new Date();
    const raceDate = new Date(editForm.race_date);
    
    // Handle invalid race date
    if (isNaN(raceDate.getTime())) {
      return 0; // Default fallback
    }
    
    const diffTime = raceDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getWeeksToTaper = (): number => {
    return Math.max(0, editForm.taper_start_week - currentWeek);
  };

  const createProgressPath = (): string => {
    const width = 100;
    const height = 30;
    const totalWeeks = actualTotalWeeks;
    const stepX = width / Math.max(1, totalWeeks - 1);
    
    let pathData = '';
    for (let week = 0; week < totalWeeks; week++) {
      const x = week * stepX;
      let mileage;
      if (week <= 4) mileage = 40 + week * 5;
      else if (week <= 8) mileage = 55 + (week - 4) * 3;
      else if (week <= 12) mileage = 65 + (week - 8) * 2;
      else if (week <= 15) mileage = 70 - (week - 12) * 2;
      else mileage = 60 - (week - 15) * 15;
      
      const maxMileage = 75;
      const y = height - (Math.max(mileage, 20) / maxMileage) * height;
      
      if (week === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    }
    return pathData;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate required fields
      if (!editForm.race_name || !editForm.race_date) {
        alert('Please fill in both race name and race date before saving.');
        setIsSaving(false);
        return;
      }

      // Calculate the new total weeks based on the dates
      const actualTotalWeeks = calculateTotalWeeks();
      
      // Create the updated training block with new week count
      const updatedBlock = {
        ...editForm,
        total_weeks: actualTotalWeeks  // This is the key update!
      };

      if (isOnboarding) {
        // CREATE new training block for onboarding
        console.log('🚀 Creating training block with data:', {
          name: updatedBlock.name,
          race_name: updatedBlock.race_name,
          race_date: updatedBlock.race_date,
          goal_time: updatedBlock.goal_time,
          start_date: updatedBlock.start_date,
          total_weeks: updatedBlock.total_weeks,
          taper_start_week: updatedBlock.taper_start_week
        });

        const response = await fetch('/api/training/blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: updatedBlock.name,
            race_name: updatedBlock.race_name,
            race_date: updatedBlock.race_date,
            goal_time: updatedBlock.goal_time || null, // Handle empty goal time
            start_date: updatedBlock.start_date,
            total_weeks: updatedBlock.total_weeks,
            taper_start_week: updatedBlock.taper_start_week
          })
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (response.ok) {
          const createdBlock = await response.json();
          console.log('✅ Created block:', createdBlock);
          // Update the parent component with the new block data
          onUpdate(updatedBlock);
          setIsEditing(false);
        } else {
          const errorText = await response.text();
          console.error('❌ API Error:', response.status, errorText);
          alert('Failed to create training plan. Please check all fields and try again.');
        }
      } else {
        // UPDATE existing training block
        const response = await fetch(`/api/training/blocks/${editForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            race_name: updatedBlock.race_name,
            race_date: updatedBlock.race_date,
            goal_time: updatedBlock.goal_time || null,
            start_date: updatedBlock.start_date,
            total_weeks: updatedBlock.total_weeks,
            taper_start_week: updatedBlock.taper_start_week
          })
        });

        if (response.ok) {
          // Update the parent component with the new block data
          onUpdate(updatedBlock);
          setIsEditing(false);
        } else {
          const errorText = await response.text();
          console.error('❌ API Error:', response.status, errorText);
          alert('Failed to update training plan. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving training block:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(trainingBlock);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-gradient-to-r from-orange-400 to-red-500 p-6 rounded-lg shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold text-xl">
              {isOnboarding ? 'Set Up Your Race' : 'Edit Target Race'}
            </h3>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Race Name
              </label>
              <input
                type="text"
                value={editForm.race_name}
                onChange={(e) => setEditForm({ ...editForm, race_name: e.target.value })}
                className="w-full h-12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="e.g. Valencia Marathon"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Race Date
                </label>
                <input
                  type="date"
                  value={editForm.race_date}
                  onChange={(e) => setEditForm({ ...editForm, race_date: e.target.value })}
                  className="w-full h-12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Goal Time
                </label>
                <input
                  type="text"
                  value={editForm.goal_time || ''}
                  onChange={(e) => setEditForm({ ...editForm, goal_time: e.target.value })}
                  className="w-full h-12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="3:15:00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  className="w-full h-12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  Taper Length
                </label>
                <select
                  value={editForm.total_weeks - editForm.taper_start_week + 1}
                  onChange={(e) => {
                    const taperWeeks = parseInt(e.target.value);
                    setEditForm({ 
                      ...editForm, 
                      taper_start_week: actualTotalWeeks - taperWeeks + 1 
                    });
                  }}
                  className="w-full h-12 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value={1}>1 week taper</option>
                  <option value={2}>2 weeks taper</option>
                  <option value={3}>3 weeks taper</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 bg-white text-orange-600 font-semibold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
                        {isSaving ? 'Creating...' : (isOnboarding ? 'Create Training Plan' : 'Update Target Race')}
          </button>

          {isSaving && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
              <div className="text-white font-medium">Updating...</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Normal view - exactly matches your existing design with just an edit button added
  return (
    <div className="bg-gradient-to-r from-orange-400 to-red-500 p-6 rounded-lg shadow-xl relative overflow-hidden">
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
            x={Math.max(0, (currentWeek - 1) * (100 / Math.max(1, actualTotalWeeks - 1)) - (100 / Math.max(1, actualTotalWeeks - 1)) / 2)}
            y="0"
            width={Math.max(0, 100 / Math.max(1, actualTotalWeeks - 1))}
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
      
      
        {/* Edit button in top-right - MADE MORE VISIBLE FOR DEBUGGING */}
<button
  onClick={() => {
    console.log('Edit button clicked!');
    setIsEditing(true);
  }}
  className="absolute top-4 right-6 px-2 py-1 text-white/50 hover:text-white/80 text-xs font-medium uppercase tracking-wider transition-all duration-200 hover:bg-white/10 rounded z-20"
  title="Edit race details"
>
  Edit
</button>
<div className="relative z-10 text-center">
        {/* Your EXACT original content */}
        <div className="text-4xl font-black text-white drop-shadow-lg">{getDaysToRace()}</div>
        <div className="text-white/90 font-medium tracking-wide">days to {editForm.race_name}</div>
        <div className="text-xs text-white/70 mt-1">
          {editForm.goal_time && (
            <span>Goal: {editForm.goal_time} • </span>
          )}
          {getWeeksToTaper() > 0 ? (
            `${getWeeksToTaper()} weeks to taper`
          ) : (
            currentWeek >= editForm.taper_start_week ? 'Taper time! 🎯' : 'Final preparations! 💪'
          )}
        </div>
      </div>
      
      {/* Progress dots now reflect actual weeks between start and race date */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-1">
        {Array.from({ length: actualTotalWeeks }, (_, i) => (
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
    </div>
  );
}