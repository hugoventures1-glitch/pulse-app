import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';

export default function WorkoutSelection() {
  const navigate = useNavigate();
  const { isPaused, isWorkoutActive, workoutPlan, currentPlanIdx, setProgress, getElapsedMs, endWorkout } = useWorkout();
  const [showEndConfirm, setShowEndConfirm] = useState(false);

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
  const Card = ({ title, desc, onClick }) => (
    <button
      onClick={() => {
        if (isPaused) {
          if (window.__toast) window.__toast('You have a paused workout. Resume or end it first.');
          return;
        }
        onClick();
      }}
      className={`w-full text-left pulse-glass rounded-3xl py-12 px-8 border-2 border-white/20 backdrop-blur-2xl shadow-2xl transition min-h-[160px] flex flex-col justify-center ${isPaused ? 'opacity-60 pointer-events-auto' : 'active:scale-[0.98]'}`}
      aria-disabled={isPaused}
    >
      <div className="text-white text-3xl font-bold mb-3">{title}</div>
      <div className="text-white/90 text-lg leading-relaxed">{desc}</div>
    </button>
  );

  return (
    <div className="w-full max-w-[375px] px-4 pt-8 pb-28 space-y-6">
      <h1 className="text-white text-3xl font-bold mb-6">Choose Workout</h1>
      <Card
        title="Start Today's Workout"
        desc="Follow your predefined plan for today."
        onClick={() => navigate('/workout-preview')}
      />
      <Card
        title="Choose a Program"
        desc="Select from 4 proven workout programs."
        onClick={() => navigate('/choose-program')}
      />
      <Card
        title="Create Custom Workout"
        desc="Build a session from scratch with your own exercises."
        onClick={() => navigate('/create-custom')}
      />
      <Card
        title="Quick Start"
        desc="Jump right in and log sets without a plan."
        onClick={() => navigate('/focus', { state: { mode: 'quick' } })}
      />
    </div>
  );
}
