import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';

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
      navigate('/focus');
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
    <div className="w-full max-w-[375px] px-4 pt-6 pb-28 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-3xl font-bold">My Workouts</h1>
        <button
          onClick={() => navigate('/workout')}
          className="px-4 h-9 rounded-full bg-white/10 text-white border border-white/10 text-sm"
        >
          Back
        </button>
      </div>

      {sortedWorkouts.length === 0 ? (
        <div className="pulse-glass rounded-3xl p-6 text-center">
          <div className="text-white/70 text-sm">No saved workouts yet</div>
          <div className="text-white/40 text-xs mt-1">Create a custom workout to save it here</div>
          <button
            onClick={() => navigate('/create-custom')}
            className="mt-4 px-4 h-10 rounded-2xl bg-white text-slate-900 font-semibold"
          >
            Build Workout
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedWorkouts.map((workout) => {
            const sets = countSets(workout.exercises);
            const preview = formatPreview(workout.exercises);
            return (
              <div key={workout.id} className="pulse-glass rounded-3xl border border-white/15 p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white text-xl font-semibold">{workout.name}</div>
                    <div className="text-white/60 text-xs mt-1">
                      {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''} • {sets} set{sets !== 1 ? 's' : ''}
                    </div>
                    {workout.sourceProgramId && (
                      <div className="text-white/40 text-[10px] uppercase tracking-wide mt-1">
                        Modified from {workout.sourceProgramName || workout.sourceProgramId.replace(/-/g, ' ')}
                      </div>
                    )}
                  </div>
                  <div className="text-white/40 text-[10px] uppercase tracking-wide">
                    {new Date(workout.updatedAt || workout.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>

                <div className="text-white/70 text-sm leading-relaxed">{preview}</div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleStart(workout.id)}
                    className="flex-1 h-11 rounded-2xl bg-white text-slate-900 font-semibold active:scale-[0.99] transition"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => handleEdit(workout.id)}
                    className="flex-1 h-11 rounded-2xl bg-white/10 text-white border border-white/20 font-medium active:scale-[0.99] transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(workout.id)}
                    className="px-4 h-11 rounded-2xl bg-rose-500/15 text-rose-200 border border-rose-400/30 text-sm active:scale-[0.99] transition"
                  >
                    Delete
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
