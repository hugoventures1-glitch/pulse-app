import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WORKOUT_PROGRAMS } from '../data/workoutPrograms';
import { useWorkout } from '../state/WorkoutContext';

export default function ChooseProgram() {
  const navigate = useNavigate();
  const {
    selectProgram,
    getProgramDefinition,
    getBaseProgram,
    customPrograms,
    resetCustomProgram,
  } = useWorkout();

  const handleStartProgram = (programId) => {
    selectProgram(programId);
    navigate('/workout-preview');
    if (window?.__toast) window.__toast('Program loaded');
  };

  const handleCustomizeProgram = (programId) => {
    navigate('/customize-program', { state: { programId } });
  };

  const handleResetProgram = (programId, baseName) => {
    resetCustomProgram(programId);
    if (window?.__toast) window.__toast(`${baseName} reset to default`);
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
        {WORKOUT_PROGRAMS.map((program) => {
          const custom = customPrograms[program.id];
          const activeDefinition = getProgramDefinition(program.id) || program;
          const baseTemplate = getBaseProgram(program.id) || program;
          const displayName = custom ? (custom.name || `My ${baseTemplate.name}`) : program.name;
          const sampleExercises = activeDefinition.days?.[0]?.exercises || [];

          return (
            <div key={program.id} className="pulse-glass rounded-3xl p-6 border border-white/15">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-2">
                  <h2 className="text-white text-2xl font-bold mb-1 flex items-center gap-2">
                    <span>{displayName}</span>
                    {custom && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/40">
                        Modified
                      </span>
                    )}
                  </h2>
                  <div className="text-white/70 text-sm mb-2">{activeDefinition.daysPerWeek || program.daysPerWeek} days/week</div>
                  <p className="text-white/80 text-sm leading-relaxed">{activeDefinition.description || program.description}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-white/60 text-xs mb-2">Sample Day:</div>
                <div className="space-y-1">
                  {sampleExercises.slice(0, 3).map((ex, idx) => (
                    <div key={idx} className="text-white/80 text-sm">
                      {ex.name} • {ex.sets}×{ex.reps}
                    </div>
                  ))}
                  {sampleExercises.length > 3 && (
                    <div className="text-white/60 text-xs">+{sampleExercises.length - 3} more exercises</div>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleStartProgram(program.id)}
                  className="w-full h-12 rounded-2xl bg-white text-slate-900 font-semibold active:scale-[0.99] transition"
                >
                  Start Program
                </button>
                <button
                  onClick={() => handleCustomizeProgram(program.id)}
                  className="w-full h-12 rounded-2xl bg-white/10 text-white border border-white/15 font-medium active:scale-[0.99] transition"
                >
                  Customize Program
                </button>
                {custom && (
                  <button
                    onClick={() => handleResetProgram(program.id, baseTemplate.name)}
                    className="w-full h-11 rounded-2xl bg-rose-500/15 text-rose-200 border border-rose-400/30 text-sm active:scale-[0.99] transition"
                  >
                    Reset to Default
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

