import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';

// Custom SVG icons
const PlayIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const EditIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const StarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const formatPreview = (exercises = []) => {
  const names = exercises.map((item) => item.name);
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')}...`;
};

const countSets = (exercises = []) => exercises.reduce((sum, exercise) => sum + (exercise.sets?.length || exercise.setTargets?.length || exercise.setsCount || 0), 0);

export default function SavedWorkouts() {
  const navigate = useNavigate();
  const {
    savedWorkouts,
    startWorkoutFromTemplate,
    deleteCustomWorkoutTemplate,
  } = useWorkout();

  const sortedWorkouts = useMemo(() => {
    return [...savedWorkouts].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [savedWorkouts]);

  const handleStart = (workoutId) => {
    const success = startWorkoutFromTemplate(workoutId);
    if (success) {
      navigate('/workout-preview', { state: { workoutId } });
      if (window?.__toast) window.__toast('Workout loaded');
    } else if (window?.__toast) {
      window.__toast('Workout could not be loaded');
    }
  };

  const handleEdit = (workoutId) => {
    navigate('/create-custom', { state: { editWorkoutId: workoutId } });
  };

  const handleDelete = (workoutId) => {
    if (!window.confirm('Delete this saved workout?')) return;
    deleteCustomWorkoutTemplate(workoutId);
    if (window?.__toast) window.__toast('Workout deleted');
  };

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-28 space-y-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/30 to-pink-400/20 flex items-center justify-center">
            <StarIcon className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold">My Workouts</h1>
            <p className="text-white/60 text-sm">{sortedWorkouts.length} saved workout{sortedWorkouts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/workout')}
          className="px-4 h-9 rounded-xl bg-white/10 text-white border border-white/15 text-sm transition-transform hover:scale-105 active:scale-95"
        >
          Back
        </button>
      </div>

      {sortedWorkouts.length === 0 ? (
        <div className="pulse-glass rounded-2xl p-8 text-center border border-white/15">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <StarIcon className="w-8 h-8 text-white/40" />
          </div>
          <div className="text-white/80 text-base font-semibold mb-2">No saved workouts yet</div>
          <div className="text-white/60 text-sm mb-6">Create a custom workout to save it here</div>
          <button
            onClick={() => navigate('/create-custom')}
            className="px-5 h-11 rounded-xl text-white font-semibold transition-transform hover:scale-105 active:scale-95 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
              boxShadow: '0 4px 16px rgba(255, 149, 0, 0.3)'
            }}
          >
            Build Workout
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedWorkouts.map((workout, idx) => {
            const sets = countSets(workout.exercises);
            const preview = formatPreview(workout.exercises);
            
            // Color gradients for variety
            const gradients = [
              ['#a855f7', '#9333ea'], // Purple
              ['#22d3ee', '#06b6d4'], // Cyan
              ['#22c55e', '#16a34a'], // Green
              ['#f59e0b', '#d97706'], // Orange
            ];
            const gradient = gradients[idx % gradients.length];
            
            return (
              <div 
                key={workout.id} 
                className="pulse-glass rounded-2xl border border-white/15 p-5 transition-all hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(135deg, ${gradient[0]}15, ${gradient[1]}08)`,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-lg font-bold mb-1 truncate">{workout.name}</div>
                    <div className="text-white/60 text-xs mb-1">
                      {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''} • {sets} set{sets !== 1 ? 's' : ''}
                    </div>
                    {workout.sourceProgramId && (
                      <div className="text-white/50 text-[10px] uppercase tracking-wide mt-1">
                        Modified from {workout.sourceProgramName || workout.sourceProgramId.replace(/-/g, ' ')}
                      </div>
                    )}
                  </div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wide flex-shrink-0">
                    {new Date(workout.updatedAt || workout.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {preview && (
                  <div className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-2">{preview}</div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleStart(workout.id)}
                    className="flex-1 h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
                      boxShadow: '0 4px 16px rgba(255, 149, 0, 0.3)'
                    }}
                  >
                    <PlayIcon className="w-4 h-4" />
                    Start
                  </button>
                  <button
                    onClick={() => handleEdit(workout.id)}
                    className="flex-1 h-11 rounded-xl bg-white/10 text-white border border-white/20 font-medium text-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
                  >
                    <EditIcon className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(workout.id)}
                    className="px-3 h-11 rounded-xl bg-rose-500/15 text-rose-200 border border-rose-400/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
