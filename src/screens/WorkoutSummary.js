import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';

function ProgressRing({ percent = 100, size = 140, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} fill="none" />
      <circle cx={size/2} cy={size/2} r={radius} stroke="#22c55e" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" fill="none" transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-white" style={{fontWeight:700,fontSize:22}}>{clamped}%</text>
    </svg>
  );
}

export default function WorkoutSummary() {
  const navigate = useNavigate();
  const { workoutPlan = [], setProgress = {}, workoutStartAt, endWorkout } = useWorkout();

  const stats = useMemo(() => {
    // Total sets and completed
    let plannedSets = 0, completedSets = 0, volume = 0;
    let completedExercises = 0;
    workoutPlan.forEach(ex => {
      const sets = ex.sets || 1;
      plannedSets += sets;
      const prog = setProgress?.[ex.name]?.progress || 0;
      completedSets += Math.min(prog, sets);
      if (prog >= sets) completedExercises += 1;
      const values = setProgress?.[ex.name]?.values || [];
      values.forEach(v => {
        const r = parseInt(v?.reps || 0, 10) || 0;
        const w = parseInt(v?.weight || 0, 10) || 0;
        volume += r * w;
      });
    });
    const percent = workoutPlan.length ? Math.round((completedExercises / workoutPlan.length) * 100) : 0;
    const durationMs = workoutStartAt ? Date.now() - workoutStartAt : 0;
    const durationMin = Math.max(1, Math.round(durationMs / 60000));
    return { plannedSets, completedSets, volume, percent, completedExercises };
  }, [workoutPlan, setProgress, workoutStartAt]);

  const isComplete = stats.percent >= 100;

  return (
    <div className="fixed inset-0 z-40 flex justify-center pt-safe pb-safe">
      {/* celebration confetti */}
      {isComplete && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(40)].map((_,i)=> (
            <div key={i} className="absolute text-2xl" style={{
              left: `${Math.random()*100}%`,
              top: `-${Math.random()*20}%`,
              animation: `fall ${4+Math.random()*3}s linear ${Math.random()*1.5}s infinite`,
              color: ['#22c55e','#a78bfa','#f472b6','#f59e0b'][i%4]
            }}>★</div>
          ))}
        </div>
      )}
      <style>{`
        @keyframes fall { to { transform: translateY(120vh) rotate(360deg); opacity: 0.9; } }
      `}</style>
      <div className="w-full max-w-[375px] px-4 py-6">
        <div className="pulse-glass rounded-3xl p-6 text-center mb-4">
          <h2 className="text-white text-3xl font-bold">Workout Complete!</h2>
          <div className="mt-4 flex justify-center"><ProgressRing percent={stats.percent} /></div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="pulse-glass rounded-2xl p-4 text-center">
            <div className="text-white/70 text-xs">Total Sets</div>
            <div className="text-white text-xl font-semibold">{stats.completedSets} sets</div>
          </div>
          <div className="pulse-glass rounded-2xl p-4 text-center">
            <div className="text-white/70 text-xs">Volume</div>
            <div className="text-white text-xl font-semibold">{stats.volume.toLocaleString()} kg</div>
          </div>
          <div className="pulse-glass rounded-2xl p-4 text-center">
            <div className="text-white/70 text-xs">Duration</div>
            <div className="text-white text-xl font-semibold">~{Math.max(1, Math.round(((Date.now() - (workoutStartAt||Date.now()))/60000)))} min</div>
          </div>
          <div className="pulse-glass rounded-2xl p-4 text-center">
            <div className="text-white/70 text-xs">Exercises</div>
            <div className="text-white text-xl font-semibold">{stats.completedExercises}/{workoutPlan.length} ✓</div>
          </div>
        </div>

        <div className="grid gap-4 mb-6">
          <button 
            className="h-12 rounded-2xl bg-white/10 text-white border border-white/20 font-medium transition-all hover:bg-white/15 active:scale-95" 
            onClick={()=>navigate('/workout-details')}
          >
            View Details
          </button>
          
          {/* Prominent Done Button */}
          <button 
            className="w-full rounded-2xl text-white font-bold text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 relative overflow-hidden" 
            onClick={()=>{ endWorkout(); navigate('/'); }}
            style={{ 
              height: '64px',
              background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(255, 149, 0, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px' }}>DONE</span>
            </div>
          </button>
        </div>
        
        {/* Helper text - More prominent */}
        <div className="text-center mb-4 px-4">
          <p className="text-white/80 text-base font-medium">Tap "DONE" to finish and return home</p>
        </div>
      </div>
    </div>
  );
}
