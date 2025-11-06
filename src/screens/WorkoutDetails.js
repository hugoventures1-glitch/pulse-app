import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';

export default function WorkoutDetails() {
  const navigate = useNavigate();
  const { workoutPlan = [], setProgress = {}, workoutStartAt, additionalExercises = [], endWorkout } = useWorkout();

  const { exerciseList, totals } = useMemo(() => {
    const exercises = [];
    let totalSets = 0;
    let totalVolume = 0;

    // Process planned exercises
    workoutPlan.forEach(ex => {
      const prog = setProgress?.[ex.name] || {};
      const completedSets = prog.progress || 0;
      const values = prog.values || [];
      
      if (completedSets > 0) {
        totalSets += completedSets;
        
        // Calculate volume for this exercise
        let exerciseVolume = 0;
        values.forEach(v => {
          const r = parseInt(v?.reps || 0, 10) || 0;
          const w = parseInt(v?.weight || 0, 10) || 0;
          exerciseVolume += r * w;
        });
        totalVolume += exerciseVolume;

        // Get all sets logged for this exercise
        const sets = values.map((v, i) => ({
          setNumber: i + 1,
          reps: v.reps || ex.reps || 0,
          weight: v.weight || ex.weight || 0
        }));

        exercises.push({
          name: ex.name,
          sets: sets,
          totalSets: completedSets,
          volume: exerciseVolume
        });
      }
    });

    // Process additional exercises
    additionalExercises.forEach(ex => {
      if (ex.complete && ex.sets && ex.reps && ex.weight) {
        const exerciseVolume = ex.sets * ex.reps * ex.weight;
        totalSets += ex.sets;
        totalVolume += exerciseVolume;

        exercises.push({
          name: ex.name,
          sets: Array.from({ length: ex.sets }, (_, i) => ({
            setNumber: i + 1,
            reps: ex.reps,
            weight: ex.weight
          })),
          totalSets: ex.sets,
          volume: exerciseVolume
        });
      }
    });

    // Calculate duration
    const durationMs = workoutStartAt ? Date.now() - workoutStartAt : 0;
    const durationMin = Math.max(1, Math.round(durationMs / 60000));

    return {
      exerciseList: exercises,
      totals: {
        sets: totalSets,
        volume: totalVolume,
        duration: durationMin,
        exercises: exercises.length
      }
    };
  }, [workoutPlan, setProgress, workoutStartAt, additionalExercises]);

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-28">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-2xl font-bold">Workout Details</h2>
        <button 
          onClick={() => { endWorkout(); navigate('/'); }}
          className="px-4 h-9 rounded-full bg-white/10 text-white border border-white/10 text-sm"
        >
          Done
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="pulse-glass rounded-2xl p-4 text-center">
          <div className="text-white/70 text-xs mb-1">Total Sets</div>
          <div className="text-white text-2xl font-bold">{totals.sets}</div>
        </div>
        <div className="pulse-glass rounded-2xl p-4 text-center">
          <div className="text-white/70 text-xs mb-1">Total Volume</div>
          <div className="text-white text-2xl font-bold">{totals.volume.toLocaleString()} kg</div>
        </div>
        <div className="pulse-glass rounded-2xl p-4 text-center">
          <div className="text-white/70 text-xs mb-1">Duration</div>
          <div className="text-white text-2xl font-bold">{totals.duration} min</div>
        </div>
        <div className="pulse-glass rounded-2xl p-4 text-center">
          <div className="text-white/70 text-xs mb-1">Exercises</div>
          <div className="text-white text-2xl font-bold">{totals.exercises}</div>
        </div>
      </div>

      {/* Exercise Breakdown */}
      <div className="space-y-3">
        <h3 className="text-white/90 text-lg font-semibold mb-2">Exercises Completed</h3>
        
        {exerciseList.length === 0 ? (
          <div className="pulse-glass rounded-2xl p-6 text-center">
            <div className="text-white/60 text-sm">No exercises logged yet</div>
          </div>
        ) : (
          exerciseList.map((exercise, idx) => (
            <div key={idx} className="pulse-glass rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-white text-lg font-semibold">{exercise.name}</div>
                  <div className="text-white/60 text-xs mt-1">
                    {exercise.totalSets} set{exercise.totalSets !== 1 ? 's' : ''} • {exercise.volume.toLocaleString()} kg total
                  </div>
                </div>
              </div>
              
              {/* Sets breakdown */}
              <div className="space-y-2">
                {exercise.sets.map((set, setIdx) => (
                  <div 
                    key={setIdx} 
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10"
                  >
                    <span className="text-white/70 text-sm">Set {set.setNumber}</span>
                    <span className="text-white font-semibold">
                      {set.weight} kg × {set.reps} reps
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

