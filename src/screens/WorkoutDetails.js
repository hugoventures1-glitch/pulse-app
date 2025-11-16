import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';
import { FLAT_EXERCISES } from '../data/exerciseLibrary';

// Muscle Group Diagram Component
function MuscleGroupDiagram({ stats }) {
  // Filter out groups with 0% and sort by percentage (highest first)
  const activeGroups = Object.entries(stats || {})
    .filter(([_, percentage]) => percentage > 0)
    .sort(([_, a], [__, b]) => b - a);

  if (activeGroups.length === 0) {
    return (
      <div className="text-white/60 text-sm text-center py-4">
        No muscle group data available
      </div>
    );
  }

  // Position mappings for labels (x, y coordinates and connection point)
  const positions = {
    chest: { x: 50, y: 28, connectX: 50, connectY: 40, label: 'Chest' },
    shoulders: { x: 80, y: 20, connectX: 65, connectY: 30, label: 'Shoulders' },
    back: { x: 20, y: 35, connectX: 35, connectY: 40, label: 'Back' },
    arms: { x: 88, y: 45, connectX: 70, connectY: 55, label: 'Arms' },
    core: { x: 50, y: 62, connectX: 50, connectY: 58, label: 'Core' },
    legs: { x: 50, y: 92, connectX: 50, connectY: 75, label: 'Legs' }
  };

  return (
    <div className="relative w-full" style={{ height: '280px' }}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Simple human body outline */}
        {/* Head */}
        <circle cx="50" cy="12" r="4" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
        
        {/* Torso */}
        <ellipse cx="50" cy="40" rx="8" ry="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        
        {/* Arms */}
        <ellipse cx="70" cy="48" rx="3" ry="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <ellipse cx="30" cy="48" rx="3" ry="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        
        {/* Legs */}
        <ellipse cx="45" cy="72" rx="4" ry="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <ellipse cx="55" cy="72" rx="4" ry="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        
        {/* Highlight active muscle groups with color intensity */}
        {activeGroups.map(([group, percentage]) => {
          const pos = positions[group];
          if (!pos) return null;
          
          // Color intensity based on percentage
          const intensity = Math.min(percentage / 50, 1); // Cap at 50% for max intensity
          const opacity = 0.2 + (intensity * 0.3);
          
          // Highlight the body part area
          if (group === 'chest') {
            return (
              <ellipse key={`highlight-${group}`} cx={pos.connectX} cy={pos.connectY} rx="6" ry="4" fill={`rgba(34, 211, 238, ${opacity})`} />
            );
          } else if (group === 'shoulders') {
            return (
              <g key={`highlight-${group}`}>
                <circle cx="65" cy="30" r="3" fill={`rgba(34, 211, 238, ${opacity})`} />
                <circle cx="35" cy="30" r="3" fill={`rgba(34, 211, 238, ${opacity})`} />
              </g>
            );
          } else if (group === 'back') {
            return (
              <ellipse key={`highlight-${group}`} cx={pos.connectX} cy={pos.connectY} rx="6" ry="4" fill={`rgba(34, 211, 238, ${opacity})`} />
            );
          } else if (group === 'arms') {
            return (
              <g key={`highlight-${group}`}>
                <ellipse cx="70" cy="55" rx="3" ry="8" fill={`rgba(34, 211, 238, ${opacity})`} />
                <ellipse cx="30" cy="55" rx="3" ry="8" fill={`rgba(34, 211, 238, ${opacity})`} />
              </g>
            );
          } else if (group === 'core') {
            return (
              <ellipse key={`highlight-${group}`} cx={pos.connectX} cy={pos.connectY} rx="5" ry="3" fill={`rgba(34, 211, 238, ${opacity})`} />
            );
          } else if (group === 'legs') {
            return (
              <g key={`highlight-${group}`}>
                <ellipse cx="45" cy="75" rx="4" ry="10" fill={`rgba(34, 211, 238, ${opacity})`} />
                <ellipse cx="55" cy="75" rx="4" ry="10" fill={`rgba(34, 211, 238, ${opacity})`} />
              </g>
            );
          }
          
          return null;
        })}
        
        {/* Labels with connecting lines */}
        {activeGroups.map(([group, percentage]) => {
          const pos = positions[group];
          if (!pos) return null;
          
          return (
            <g key={group}>
              {/* Connecting line */}
              <line
                x1={pos.x}
                y1={pos.y}
                x2={pos.connectX}
                y2={pos.connectY}
                stroke="rgba(34, 211, 238, 0.4)"
                strokeWidth="0.3"
                strokeDasharray="0.5 0.5"
              />
              
              {/* Percentage label */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="6"
                fill="rgba(34, 211, 238, 0.2)"
                stroke="rgba(34, 211, 238, 0.6)"
                strokeWidth="0.5"
              />
              <text
                x={pos.x}
                y={pos.y + 0.8}
                textAnchor="middle"
                fontSize="3.5"
                fill="rgba(34, 211, 238, 0.9)"
                fontWeight="bold"
              >
                {percentage}%
              </text>
              
              {/* Group name label */}
              <text
                x={pos.x}
                y={pos.y + (pos.y < 50 ? -4 : 4)}
                textAnchor="middle"
                fontSize="2.5"
                fill="rgba(255, 255, 255, 0.7)"
              >
                {pos.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function WorkoutDetails() {
  const navigate = useNavigate();
  const { workoutPlan = [], setProgress = {}, workoutStartAt, additionalExercises = [], endWorkout } = useWorkout();

  const { exerciseList, totals, muscleGroupStats } = useMemo(() => {
    const exercises = [];
    let totalSets = 0;
    let totalVolume = 0;
    
    // Map to track volume per muscle group
    const muscleGroupVolume = {
      chest: 0,
      back: 0,
      legs: 0,
      shoulders: 0,
      arms: 0,
      core: 0
    };

    // Helper function to find muscle group for an exercise
    const findMuscleGroup = (exerciseName) => {
      const normalizedName = exerciseName.toLowerCase().trim();
      const exercise = FLAT_EXERCISES.find(ex => 
        ex.name.toLowerCase() === normalizedName ||
        ex.aliases?.some(alias => alias.toLowerCase() === normalizedName)
      );
      return exercise?.groupId || null;
    };

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

        // Add to muscle group volume
        const muscleGroup = findMuscleGroup(ex.name);
        if (muscleGroup && muscleGroupVolume.hasOwnProperty(muscleGroup)) {
          muscleGroupVolume[muscleGroup] += exerciseVolume;
        }

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

        // Add to muscle group volume
        const muscleGroup = findMuscleGroup(ex.name);
        if (muscleGroup && muscleGroupVolume.hasOwnProperty(muscleGroup)) {
          muscleGroupVolume[muscleGroup] += exerciseVolume;
        }

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

    // Calculate percentages for each muscle group
    const muscleGroupPercentages = {};
    Object.keys(muscleGroupVolume).forEach(group => {
      const percentage = totalVolume > 0 
        ? Math.round((muscleGroupVolume[group] / totalVolume) * 100) 
        : 0;
      muscleGroupPercentages[group] = percentage;
    });

    return {
      exerciseList: exercises,
      totals: {
        sets: totalSets,
        volume: totalVolume,
        duration: durationMin,
        exercises: exercises.length
      },
      muscleGroupStats: muscleGroupPercentages
    };
  }, [workoutPlan, setProgress, workoutStartAt, additionalExercises]);

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-28">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-2xl font-bold">Workout Details</h2>
        <button 
          onClick={() => { endWorkout(); navigate('/'); }}
          className="px-6 h-11 rounded-full font-bold text-base shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          style={{ 
            background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
            boxShadow: '0 4px 16px rgba(255, 149, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            color: 'white'
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span style={{ fontWeight: 700 }}>Done</span>
        </button>
      </div>

      {/* Muscle Group Diagram */}
      {exerciseList.length > 0 && (
        <div className="pulse-glass rounded-3xl p-5 mb-6">
          <h3 className="text-white/90 text-lg font-semibold mb-4 text-center">Muscle Groups Worked</h3>
          <MuscleGroupDiagram stats={muscleGroupStats} />
        </div>
      )}

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

