// src/components/settings/ResetTrainingBlock.tsx
'use client';

import React, { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';

interface TrainingBlock {
  id: string;
  race_name: string;
  race_date: string;
  current_week: number;
  total_weeks: number;
}

interface ResetTrainingBlockProps {
  currentBlock?: TrainingBlock;
  onReset?: () => void;
}

export default function ResetTrainingBlock({ 
  currentBlock,
  onReset = () => console.log('Reset clicked')
}: ResetTrainingBlockProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!currentBlock) return;
    
    setIsResetting(true);
    try {
      console.log('🔄 Archiving training block:', currentBlock.id);
      
      // Archive current block using your existing API
      const response = await fetch(`/api/training/blocks/${currentBlock.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: 'completed'
        })
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const archivedBlock = await response.json();
        console.log('✅ Training block archived successfully:', archivedBlock);
        
        // Trigger the reset callback
        onReset();
        setShowConfirmation(false);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to archive block:', response.status, errorText);
        alert('Failed to reset training block. Please try again.');
      }
    } catch (error) {
      console.error('💥 Error resetting training block:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  if (showConfirmation) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Start New Training Block?</h3>
            <p className="text-sm text-gray-600">This will archive your current training plan</p>
          </div>
        </div>

        {currentBlock && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Current Training Block</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>📍 <strong>{currentBlock.race_name}</strong></div>
              <div>📅 Race Date: {new Date(currentBlock.race_date).toLocaleDateString()}</div>
              <div>📊 Progress: Week {currentBlock.current_week} of {currentBlock.total_weeks}</div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">What happens next:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your current plan will be archived (not deleted)</li>
            <li>• You'll set up a new marathon goal</li>
            <li>• Fresh training schedule will be generated</li>
            <li>• Strava will continue syncing automatically</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmation(false)}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            disabled={isResetting}
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResetting ? 'Archiving...' : 'Start New Block'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Plus className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Training Block</h3>
          <p className="text-sm text-gray-600">Manage your marathon training plan</p>
        </div>
      </div>

      <div className="space-y-4">
        {currentBlock ? (
          <>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Current Plan</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>📍 <strong>{currentBlock.race_name}</strong></div>
                <div>📅 {new Date(currentBlock.race_date).toLocaleDateString()}</div>
                <div>📊 Week {currentBlock.current_week} of {currentBlock.total_weeks}</div>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmation(true)}
              className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Start New Training Block
            </button>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">No active training block</p>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Create Training Block
            </button>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">
          Your training data will be safely archived
        </p>
      </div>
    </div>
  );
}