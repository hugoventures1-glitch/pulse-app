import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WORKOUT_PROGRAMS } from '../data/workoutPrograms';
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

const RotateIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

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
    <div className="w-full max-w-[375px] px-4 pt-6 pb-28 space-y-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-white text-2xl font-bold">Choose a Program</h1>
          <p className="text-white/60 text-sm mt-1">Select from proven workout routines</p>
        </div>
        <button
          onClick={() => navigate('/workout')}
          className="px-4 h-9 rounded-xl bg-white/10 text-white border border-white/15 text-sm transition-transform hover:scale-105 active:scale-95"
        >
          Back
        </button>
      </div>

      <div className="space-y-4">
        {WORKOUT_PROGRAMS.map((program, idx) => {
          const custom = customPrograms[program.id];
          const activeDefinition = getProgramDefinition(program.id) || program;
          const baseTemplate = getBaseProgram(program.id) || program;
          const displayName = custom ? (custom.name || `My ${baseTemplate.name}`) : program.name;
          const sampleExercises = activeDefinition.days?.[0]?.exercises || [];
          
          // Color gradients for variety
          const gradients = [
            ['#22d3ee', '#06b6d4'], // Cyan
            ['#a855f7', '#9333ea'], // Purple
            ['#22c55e', '#16a34a'], // Green
            ['#f59e0b', '#d97706'], // Orange
          ];
          const gradient = gradients[idx % gradients.length];

          return (
            <div 
              key={program.id} 
              className="pulse-glass rounded-2xl p-5 border border-white/15 transition-all hover:scale-[1.01]"
              style={{
                background: `linear-gradient(135deg, ${gradient[0]}15, ${gradient[1]}08)`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-white text-xl font-bold">{displayName}</h2>
                    {custom && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/40 font-medium">
                        Modified
                      </span>
                    )}
                  </div>
                  <div className="text-white/70 text-sm mb-2">{activeDefinition.daysPerWeek || program.daysPerWeek} days/week</div>
                  <p className="text-white/80 text-sm leading-relaxed mb-3">{activeDefinition.description || program.description}</p>
                </div>
              </div>

              <div className="mb-4 pt-4 border-t border-white/10">
                <div className="text-white/60 text-xs mb-2 font-medium uppercase tracking-wide">Sample Day</div>
                <div className="space-y-1.5">
                  {sampleExercises.slice(0, 3).map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between text-white/80 text-sm">
                      <span>{ex.name}</span>
                      <span className="text-white/60">{ex.sets}×{ex.reps}</span>
                    </div>
                  ))}
                  {sampleExercises.length > 3 && (
                    <div className="text-white/60 text-xs mt-1">+{sampleExercises.length - 3} more exercises</div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStartProgram(program.id)}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
                >
                  <PlayIcon className="w-4 h-4" />
                  Start
                </button>
                <button
                  onClick={() => handleCustomizeProgram(program.id)}
                  className="flex-1 h-11 rounded-xl bg-white/10 text-white border border-white/20 font-medium text-sm flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
                >
                  <EditIcon className="w-4 h-4" />
                  Customize
                </button>
                {custom && (
                  <button
                    onClick={() => handleResetProgram(program.id, baseTemplate.name)}
                    className="px-3 h-11 rounded-xl bg-rose-500/15 text-rose-200 border border-rose-400/30 text-sm flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                    title="Reset to Default"
                  >
                    <RotateIcon className="w-4 h-4" />
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

