import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WORKOUT_PROGRAMS } from '../data/workoutPrograms';
import { useWorkout } from '../state/WorkoutContext';

export default function ChooseProgram() {
  const navigate = useNavigate();
  const { selectProgram } = useWorkout();

  const handleSelectProgram = (program) => {
    selectProgram(program);
    navigate('/workout-preview');
  };

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-28">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-3xl font-bold">Choose a Program</h1>
        <button 
          onClick={() => navigate('/workout')}
          className="px-4 h-9 rounded-full bg-white/10 text-white border border-white/10 text-sm"
        >
          Back
        </button>
      </div>

      <div className="space-y-4">
        {WORKOUT_PROGRAMS.map((program) => (
          <div key={program.id} className="pulse-glass rounded-3xl p-6 border border-white/15">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h2 className="text-white text-2xl font-bold mb-1">{program.name}</h2>
                <div className="text-white/70 text-sm mb-2">{program.daysPerWeek} days/week</div>
                <p className="text-white/80 text-sm leading-relaxed">{program.description}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-white/60 text-xs mb-2">Sample Day:</div>
              <div className="space-y-1">
                {program.days[0].exercises.slice(0, 3).map((ex, idx) => (
                  <div key={idx} className="text-white/80 text-sm">
                    {ex.name} • {ex.sets}×{ex.reps}
                  </div>
                ))}
                {program.days[0].exercises.length > 3 && (
                  <div className="text-white/60 text-xs">+{program.days[0].exercises.length - 3} more exercises</div>
                )}
              </div>
            </div>

            <button
              onClick={() => handleSelectProgram(program)}
              className="w-full mt-4 h-12 rounded-2xl bg-white text-slate-900 font-semibold active:scale-[0.99] transition"
            >
              Select Program
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

