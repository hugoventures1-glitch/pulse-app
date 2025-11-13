import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { workoutPlan } = useWorkout();
  // Fallback if plan missing (shouldn't happen)
  const plan = (workoutPlan || []).length > 0 ? workoutPlan : [
    { name: 'Bench Press', sets: 3, reps: 10, weight: 60 },
    { name: 'Squat', sets: 3, reps: 10, weight: 80 },
    { name: 'Deadlift', sets: 3, reps: 8, weight: 90 },
    { name: 'Shoulder Press', sets: 3, reps: 8, weight: 35 }
  ];

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-28 min-h-screen flex flex-col space-y-5">
      <div>
        <h2 className="text-white text-2xl font-bold mb-1">Workout Preview</h2>
        <p className="text-white/60 text-sm">{plan.length} exercise{plan.length !== 1 ? 's' : ''} ready</p>
      </div>

      <div className="pulse-glass rounded-2xl p-5 border border-white/15 backdrop-blur-xl flex-1">
        <div className="space-y-3">
          {plan.map((item, i) => (
            <div 
              key={item.name || i} 
              className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400/30 to-purple-400/20 flex items-center justify-center text-white/70 text-sm font-bold flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <DumbbellIcon className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                  <div className="text-white font-semibold text-base truncate">{item.name}</div>
                </div>
                <div className="text-white/70 text-sm">
                  {item.sets || 0} set{(item.sets || 0) !== 1 ? 's' : ''}
                  {item.reps && <> × {item.reps} reps</>}
                  {item.weight && <>, {item.weight} kg</>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4">
        <button
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold text-lg shadow-lg shadow-cyan-400/30 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
          onClick={() => navigate('/focus')}
        >
          <PlayIcon className="w-6 h-6" />
          Begin Workout
        </button>
      </div>
    </div>
  );
}
