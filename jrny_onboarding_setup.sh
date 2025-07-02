#!/bin/bash

# JRNY Onboarding Setup Script
echo "🏃‍♂️ Setting up JRNY onboarding flow..."

# Navigate to your jrny project directory
cd jrny

# Create onboarding directory
echo "📁 Creating onboarding directory..."
mkdir -p src/components/onboarding

# Create the PlanImportInterface component
echo "📝 Creating PlanImportInterface.tsx..."
cat > src/components/onboarding/PlanImportInterface.tsx << 'EOF'
'use client';

import React, { useState } from 'react';
import { Camera, Upload, FileImage, Calendar, Target, Clock, MapPin, CheckCircle } from 'lucide-react';

const PlanImportInterface = ({ onPlanCreated }: { onPlanCreated?: () => void }) => {
  const [step, setStep] = useState(1); // 1: Setup, 2: Upload, 3: Processing
  const [blockData, setBlockData] = useState({
    race_name: '',
    race_date: '',
    goal_time: '',
    start_date: '',
    taper_weeks: 2
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Array<{id: number, name: string, url: string}>>([]);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBlockDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBlockData({
      ...blockData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles([...uploadedFiles, ...files]);
      
      // Create previews for new files
      const newPreviews: Array<{id: number, name: string, url: string}> = [];
      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          newPreviews.push({
            id: uploadedFiles.length + index,
            name: file.name,
            url: event.target?.result as string
          });
          
          if (newPreviews.length === files.length) {
            setPreviews([...previews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    setProcessing(true);
    
    try {
      // Calculate training plan length from start date to race date
      const startDate = new Date(blockData.start_date);
      const raceDate = new Date(blockData.race_date);
      const diffTime = raceDate.getTime() - startDate.getTime();
      const totalWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      
      // Create the training block
      const blockResponse = await fetch('/api/training/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${blockData.race_name} Training`,
          race_name: blockData.race_name,
          race_date: blockData.race_date,
          goal_time: blockData.goal_time,
          start_date: blockData.start_date,
          total_weeks: totalWeeks,
          taper_start_week: totalWeeks - (blockData.taper_weeks || 2),
        }),
      });
      
      if (!blockResponse.ok) {
        throw new Error('Failed to create training block');
      }
      
      const block = await blockResponse.json();
      console.log('Training block created:', block);
      
      // TODO: Process uploaded photos with OCR
      // For now, just log the files
      console.log(`${uploadedFiles.length} photos ready for OCR processing`);
      
      setSuccess(true);
      
      // Call the callback if provided
      if (onPlanCreated) {
        onPlanCreated();
      }
      
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to import plan. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Plan Imported Successfully!</h2>
        <p className="text-gray-600 mb-6">
          Your {blockData.race_name} training plan has been imported and is ready to sync with Strava.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
        >
          View Training Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6" />
            Import Training Plan
          </h1>
          <p className="text-orange-100 text-sm mt-2">
            Upload your coach's plan or training schedule
          </p>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-orange-100' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Race Details</span>
            </div>
            
            <div className={`flex items-center ${step >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-orange-100' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Upload Plan</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 mb-4">Tell us about your marathon</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Marathon Name
                </label>
                <input
                  type="text"
                  name="race_name"
                  value={blockData.race_name}
                  onChange={handleBlockDataChange}
                  placeholder="e.g., London Marathon, Boston Marathon"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Race Date
                </label>
                <input
                  type="date"
                  name="race_date"
                  value={blockData.race_date}
                  onChange={handleBlockDataChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Target className="w-4 h-4 inline mr-1" />
                  Goal Time (optional)
                </label>
                <input
                  type="text"
                  name="goal_time"
                  value={blockData.goal_time}
                  onChange={handleBlockDataChange}
                  placeholder="e.g., 3:30:00"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Block Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={blockData.start_date}
                    onChange={handleBlockDataChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taper Length
                  </label>
                  <select
                    name="taper_weeks"
                    value={blockData.taper_weeks || 2}
                    onChange={handleBlockDataChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={1}>1 week</option>
                    <option value={2}>2 weeks</option>
                    <option value={3}>3 weeks</option>
                    <option value={4}>4 weeks</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!blockData.race_name || !blockData.race_date || !blockData.start_date}
                className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
              >
                Next: Upload Plan
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-800">Upload your training plan photos</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                {previews.length === 0 ? (
                  <div>
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Upload multiple plan photos</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Monthly schedules, weekly breakdowns, or full plan pages
                    </p>
                    <label className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Choose Files
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={preview.url} 
                            alt={`Plan ${index + 1}`} 
                            className="w-full h-32 object-cover rounded border" 
                          />
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {preview.name}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <label className="inline-flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Add More Photos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-medium text-blue-800 mb-2">Multiple photo tips:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Upload photos in chronological order (week 1, week 2, etc.)</li>
                  <li>• Each photo can show different weeks or months</li>
                  <li>• Include any pace charts or key workout details</li>
                  <li>• Clear, well-lit photos work best for text recognition</li>
                </ul>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={processing}
                    className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50"
                  >
                    {processing ? `Processing ${uploadedFiles.length} photos...` : `Import ${uploadedFiles.length} Photo${uploadedFiles.length > 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanImportInterface;
EOF

# Backup existing dashboard page
echo "💾 Backing up existing dashboard page..."
cp src/app/dashboard/page.tsx src/app/dashboard/page.tsx.backup

# Create new dashboard page with onboarding logic
echo "📝 Creating new dashboard page with onboarding..."
cat > src/app/dashboard/page.tsx << 'EOF'
'use client';

import { useState, useEffect } from 'react';
import { Loader2, Target } from 'lucide-react';
import TrainingDashboard from '@/components/training/TrainingDashboard';
import PlanImportInterface from '@/components/onboarding/PlanImportInterface';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [hasTrainingPlan, setHasTrainingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkForExistingPlans();
  }, []);

  const checkForExistingPlans = async () => {
    try {
      const response = await fetch('/api/training/blocks');
      
      if (!response.ok) {
        throw new Error('Failed to check training plans');
      }
      
      const blocks = await response.json();
      
      // Check if user has any active training blocks
      const hasActivePlan = blocks && blocks.length > 0 && 
        blocks.some((block: any) => block.status === 'active');
      
      setHasTrainingPlan(hasActivePlan);
      
    } catch (err: any) {
      console.error('Error checking training plans:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanCreated = () => {
    // Called when user successfully creates a plan
    setHasTrainingPlan(true);
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
            {/* JRNY Logo */}
            <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg italic transform -skew-x-6 mb-8" 
                style={{fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.05em'}}>
              JRNY
            </h1>
            
            {/* Loading Animation */}
            <div className="flex items-center justify-center space-x-2 text-white/80">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg font-medium">Setting up your journey...</span>
            </div>
            
            {/* Subtitle */}
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

  // If no training plan, show onboarding
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
              <p className="text-white/80 text-sm leading-relaxed">
                Let's get your marathon training set up. Upload your coaching plan photos 
                and we'll sync them with your Strava activities to track your progress.
              </p>
            </div>
          </div>
        </div>

        {/* Plan Import Interface */}
        <div className="px-6 pb-24">
          <PlanImportInterface onPlanCreated={handlePlanCreated} />
        </div>
      </div>
    </div>
  );
}
EOF

echo ""
echo "✅ JRNY Onboarding setup complete!"
echo ""
echo "📋 What was created:"
echo "   • src/components/onboarding/PlanImportInterface.tsx"
echo "   • Updated src/app/dashboard/page.tsx (backup saved as .backup)"
echo ""
echo "🚀 Next steps:"
echo "   1. Run 'npm run dev' to start your app"
echo "   2. Login to JRNY"
echo "   3. You should see the onboarding flow!"
echo ""
echo "💡 The app will now:"
echo "   • Show onboarding if no training plans exist"
echo "   • Show your TrainingDashboard if plans exist"
echo "   • Handle loading and error states gracefully"
EOF

# Make the script executable
chmod +x jrny_onboarding_setup.sh

echo "🎯 Run this script with: ./jrny_onboarding_setup.sh"