import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';

// Custom sophisticated SVG icons
const LightningIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ClipboardIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const StarIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const EditIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export default function WorkoutSelection() {
  const navigate = useNavigate();
  const { isPaused, isWorkoutActive, workoutPlan, currentPlanIdx, setProgress, getElapsedMs, endWorkout, savedWorkouts } = useWorkout();
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  
  const savedWorkoutsCount = savedWorkouts?.length || 0;

  // Calculate workout stats
  const currentEx = workoutPlan[currentPlanIdx] || null;
  const progress = currentEx ? (setProgress?.[currentEx.name]?.progress || 0) : 0;
  const elapsedMin = Math.floor(getElapsedMs() / 60000);

  const handleEndWorkout = () => {
    endWorkout();
    setShowEndConfirm(false);
    navigate('/');
  };

  // If workout is active, show Resume/End UI
  if (isWorkoutActive) {
    return (
      <div className="w-full max-w-[375px] px-4 pt-8 pb-28 space-y-6">
        <h1 className="text-white text-3xl font-bold mb-6">Active Workout</h1>

        {/* Current workout info */}
        <div className="pulse-glass rounded-3xl p-6 space-y-4">
          {currentEx ? (
            <>
              <div>
                <div className="text-white/70 text-sm mb-1">Current Exercise</div>
                <div className="text-white text-2xl font-bold">{currentEx.name}</div>
                <div className="text-white/80 text-sm mt-1">Set {progress}/{currentEx.sets}</div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <div className="text-white/70 text-sm mb-1">Elapsed Time</div>
                <div className="text-white text-xl font-semibold">{elapsedMin} minutes</div>
              </div>
            </>
          ) : (
            <div className="text-white/80 text-center py-4">Workout in progress</div>
          )}
        </div>

        {/* Resume button */}
        <button
          onClick={() => navigate('/focus')}
          className="w-full h-14 rounded-2xl bg-white text-slate-900 font-bold text-lg active:scale-[0.99] transition"
        >
          Resume Workout
        </button>

        {/* End workout button */}
        <button
          onClick={() => setShowEndConfirm(true)}
          className="w-full h-12 rounded-2xl bg-white/10 text-white border border-white/20 font-medium active:scale-[0.99] transition"
        >
          End Workout
        </button>

        {/* End workout confirmation modal */}
        {showEndConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowEndConfirm(false)} />
            <div className="pulse-glass rounded-3xl p-6 max-w-sm w-full relative z-10">
              <h3 className="text-white text-xl font-bold mb-2">End Workout?</h3>
              <p className="text-white/80 text-sm mb-6">Your progress will be saved. You can resume later.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 h-12 rounded-2xl bg-white/10 text-white border border-white/20 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndWorkout}
                  className="flex-1 h-12 rounded-2xl bg-white text-slate-900 font-semibold"
                >
                  End Workout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Normal workout selection UI
  const OptionCard = ({ icon: IconComponent, title, subtitle, onClick, accentColor, accentGradient }) => (
    <button
      onClick={() => {
        if (isPaused) {
          if (window.__toast) window.__toast('You have a paused workout. Resume or end it first.');
          return;
        }
        onClick();
      }}
      className={`group relative w-full text-left pulse-glass rounded-2xl p-5 border border-white/15 backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${isPaused ? 'opacity-60' : ''}`}
      style={{
        background: accentGradient ? `linear-gradient(135deg, ${accentGradient[0]}20, ${accentGradient[1]}10)` : 'rgba(255, 255, 255, 0.05)',
      }}
      aria-disabled={isPaused}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div 
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{
            background: accentColor ? `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)` : 'rgba(255, 255, 255, 0.1)',
            color: accentColor || 'rgba(255, 255, 255, 0.9)',
          }}
        >
          <IconComponent className="w-6 h-6" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-lg mb-1">{title}</div>
          <div className="text-white/60 text-sm">{subtitle}</div>
        </div>
        
        {/* Arrow */}
        <div className="flex-shrink-0 text-white/40 group-hover:text-white/70 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-28 space-y-5">
      <div className="mb-2">
        <h1 className="text-white text-2xl font-bold">Choose Workout</h1>
        <p className="text-white/60 text-sm mt-1">Pick your path to crushing it today</p>
      </div>

      {/* Quick Start - Hero Card */}
      <button
        onClick={() => {
          if (isPaused) {
            if (window.__toast) window.__toast('You have a paused workout. Resume or end it first.');
            return;
          }
          navigate('/focus', { state: { mode: 'quick' } });
        }}
        className={`group relative w-full pulse-glass rounded-3xl p-7 border-2 border-orange-400/30 backdrop-blur-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${isPaused ? 'opacity-60' : ''}`}
        style={{
          background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(251, 191, 36, 0.1))',
          boxShadow: '0 8px 32px rgba(251, 146, 60, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Pulse animation overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-400/0 via-orange-400/10 to-orange-400/0 pulse-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400/30 to-yellow-400/20 flex items-center justify-center text-orange-300">
              <LightningIcon className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="text-white text-3xl font-bold mb-1">Quick Start</div>
              <div className="text-white/80 text-sm">No planning, just lift</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-5">
            <span className="text-white/70 text-sm">Jump right in and log sets as you go</span>
            <div className="px-6 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-500/30 transition-transform group-hover:scale-105" style={{ 
              background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
              borderRadius: '16px'
            }}>
              START
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>
      </button>

      {/* Other Options - Compact Cards */}
      <div className="space-y-3 pt-1">
        <OptionCard
          icon={ClipboardIcon}
          title="Choose a Program"
          subtitle="4 proven programs"
          onClick={() => navigate('/choose-program')}
          accentColor="rgb(34, 211, 238)"
          accentGradient={['#22d3ee', '#06b6d4']}
        />
        
        <OptionCard
          icon={StarIcon}
          title="My Saved Workouts"
          subtitle={savedWorkoutsCount > 0 ? `${savedWorkoutsCount} saved workout${savedWorkoutsCount !== 1 ? 's' : ''}` : "Your routines"}
          onClick={() => navigate('/my-workouts')}
          accentColor="rgb(168, 85, 247)"
          accentGradient={['#a855f7', '#9333ea']}
        />
        
        <OptionCard
          icon={EditIcon}
          title="Create Custom Workout"
          subtitle="Build your own"
          onClick={() => navigate('/create-custom')}
          accentColor="rgb(34, 197, 94)"
          accentGradient={['#22c55e', '#16a34a']}
        />
      </div>
    </div>
  );
}
