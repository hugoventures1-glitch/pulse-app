import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';

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
    <div className="w-full max-w-[375px] px-4 pt-8 pb-28 min-h-screen flex flex-col">
      <div className="pulse-glass rounded-3xl px-5 py-7 mb-8 shadow-xl border border-white/10">
        <h2 className="text-white font-bold text-2xl mb-3 text-center tracking-wide">Today's Workout</h2>
        <ul className="divide-y divide-white/10">
          {plan.map((item, i) => (
            <li key={item.name} className="py-4 flex gap-3 items-center">
              <div className="flex-1">
                <div className="text-white text-lg font-semibold">{item.name}</div>
                <div className="text-white/70 text-sm mt-1">
                  {item.sets} sets
                  {item.reps && <> × {item.reps} reps</>}
                  {item.weight && <>, {item.weight} kg</>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pb-8">
        <button
          className="w-full h-14 rounded-full bg-white text-slate-900 font-bold text-lg shadow-2xl active:scale-[0.99] transition"
          onClick={() => navigate('/focus')}
        >
          Begin Workout
        </button>
      </div>
    </div>
  );
}
