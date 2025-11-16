import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';

// Custom SVG icons
const PlayIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const DumbbellIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default function WorkoutPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { workoutPlan, getSavedWorkoutById, selectedProgramId, getProgramDefinition } = useWorkout();
  
  // Get workout source info from location state
  const workoutSource = location.state || {};
  const isQuickStart = workoutSource.mode === 'quick';
  const workoutId = workoutSource.workoutId || workoutSource.editWorkoutId;
  const savedWorkout = workoutId ? getSavedWorkoutById(workoutId) : null;
  const program = selectedProgramId ? getProgramDefinition(selectedProgramId) : null;
  
  // Get workout name
  const workoutName = useMemo(() => {
    if (isQuickStart) return 'Quick Start';
    if (savedWorkout) return savedWorkout.name || 'My Workout';
    if (program) {
      // For programs, show the current day name if available
      const currentDay = program.days?.[0]; // Get first day for preview
      if (currentDay?.name && program.days.length > 1) {
        return `${program.name} - ${currentDay.name}`;
      }
      return program.name || 'Workout';
    }
    return workoutSource.workoutName || 'Workout';
  }, [isQuickStart, savedWorkout, program, workoutSource.workoutName]);
  
  // Get workout plan - use current plan from context
  const plan = (workoutPlan || []).length > 0 ? workoutPlan : [];
  
  // Calculate stats
  const stats = useMemo(() => {
    const exerciseCount = plan.length;
    const totalSets = plan.reduce((sum, ex) => sum + (ex.sets || 1), 0);
    
    // Estimate duration: ~45 seconds per set (rest + execution)
    const estimatedMinutes = Math.round((totalSets * 0.75) + (exerciseCount * 1)); // 45s per set + 1min per exercise transition
    
    return {
      exerciseCount,
      totalSets,
      estimatedMinutes: Math.max(10, estimatedMinutes) // Minimum 10 minutes
    };
  }, [plan]);
  
  const handleBeginWorkout = () => {
    // Navigate to focus mode with workout source info
    navigate('/focus', { 
      state: { 
        mode: isQuickStart ? 'quick' : undefined,
        workoutId: workoutId || undefined
      } 
    });
  };

  return (
    <div 
      className="w-full max-w-[375px] px-6 pt-8 pb-32 min-h-screen flex flex-col" 
      style={{ background: '#000000' }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white text-3xl font-bold mb-1" style={{ fontSize: '32px', fontWeight: 700 }}>
          {workoutName}
        </h1>
        <p className="text-white/60 text-sm">
          {stats.exerciseCount} exercise{stats.exerciseCount !== 1 ? 's' : ''} • {stats.totalSets} set{stats.totalSets !== 1 ? 's' : ''}
          {stats.estimatedMinutes && ` • ~${stats.estimatedMinutes} min`}
        </p>
      </div>

      {/* Exercises List */}
      {isQuickStart ? (
        <div 
          className="rounded-2xl p-6 border backdrop-blur-xl flex-1 mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="text-center py-8">
            <div className="text-white/80 text-base mb-2">Ready to start logging</div>
            <div className="text-white/60 text-sm">Say exercise names and weights as you go</div>
          </div>
        </div>
      ) : plan.length > 0 ? (
        <div 
          className="rounded-2xl p-5 border backdrop-blur-xl flex-1 mb-6 overflow-y-auto"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="space-y-3">
            {plan.map((item, i) => (
              <div 
                key={item.name || i} 
                className="flex items-start gap-3 p-4 rounded-xl border hover:bg-white/10 transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Exercise Number Badge */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400/30 to-purple-400/20 flex items-center justify-center text-white/70 text-sm font-bold flex-shrink-0">
                  {i + 1}
                </div>
                {/* Exercise Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <DumbbellIcon className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                    <div className="text-white font-semibold text-base truncate">{item.name}</div>
                  </div>
                  <div className="text-white/70 text-sm">
                    {item.sets || 1} set{(item.sets || 1) !== 1 ? 's' : ''}
                    {item.reps && <> × {item.reps} reps</>}
                    {item.weight && item.weight > 0 && <>, {item.weight} kg</>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div 
          className="rounded-2xl p-6 border backdrop-blur-xl flex-1 mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="text-center py-8">
            <div className="text-white/60 text-sm">No exercises in workout</div>
          </div>
        </div>
      )}

      {/* Begin Workout Button */}
      <div className="mt-auto pt-4">
        <button
          className="w-full h-14 rounded-2xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
          onClick={handleBeginWorkout}
          style={{
            background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
            boxShadow: '0 6px 24px rgba(255, 149, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.1)'
          }}
        >
          <PlayIcon className="w-6 h-6" />
          Begin Workout
        </button>
      </div>
    </div>
  );
}
