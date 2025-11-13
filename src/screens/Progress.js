import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useWorkout } from '../state/WorkoutContext';
import { formatWorkoutDate } from '../utils/dateFormatter';

function Sparkline({ points = [] }) {
  const gradientIdRef = useRef(`sparklineGradient-${Math.random().toString(36).substr(2, 9)}`);
  
  if (!points.length) return <svg width="120" height="40" />;
  const w = 140, h = 40; const pad = 4;
  const xs = points.map((_, i) => pad + (i * (w - pad*2)) / Math.max(points.length - 1, 1));
  const min = Math.min(...points), max = Math.max(...points);
  const ys = points.map(v => h - pad - (max===min ? 0.5 : (v-min)/(max-min))*(h-pad*2));
  
  // Create smooth, readable curve path (gentle and trend-focused)
  const createSmoothPath = () => {
    if (points.length === 1) {
      return `M ${xs[0]},${ys[0]}`;
    }
    if (points.length === 2) {
      return `M ${xs[0]},${ys[0]} L ${xs[1]},${ys[1]}`;
    }
    
    // Use gentle, readable curves that clearly show trends
    // Minimize waviness while maintaining smoothness
    let path = `M ${xs[0]},${ys[0]}`;
    
    // Very gentle smoothing - just smooths corners, stays close to linear
    const smoothing = 0.15;
    
    for (let i = 0; i < xs.length - 1; i++) {
      const x0 = xs[i];
      const y0 = ys[i];
      const x1 = xs[i + 1];
      const y1 = ys[i + 1];
      
      const dx = x1 - x0;
      const dy = y1 - y0;
      
      // Simple control points that create gentle curves
      // Stay very close to linear interpolation for readability
      let cp1x, cp1y, cp2x, cp2y;
      
      if (points.length === 3) {
        // For exactly 3 points, use very simple curves
        cp1x = x0 + dx * 0.33;
        cp1y = y0 + dy * 0.1;
        cp2x = x1 - dx * 0.33;
        cp2y = y1 - dy * 0.1;
      } else if (i === 0) {
        // First segment: gentle start
        const nextDy = i + 2 < ys.length ? (ys[i + 2] - y1) : dy;
        const avgSlope = (dy + nextDy) / 2;
        cp1x = x0 + dx * 0.33;
        cp1y = y0;
        cp2x = x1 - dx * 0.33;
        cp2y = y1 - avgSlope * smoothing;
      } else if (i === xs.length - 2) {
        // Last segment: gentle end
        const prevDy = y0 - (i > 0 ? ys[i - 1] : y0);
        const avgSlope = (dy + prevDy) / 2;
        cp1x = x0 + dx * 0.33;
        cp1y = y0 + avgSlope * smoothing;
        cp2x = x1 - dx * 0.33;
        cp2y = y1;
      } else {
        // Middle segments: gentle curves based on local slope
        const prevDy = y0 - ys[i - 1];
        const nextDy = ys[i + 2] - y1;
        const avgSlope1 = (dy + prevDy) / 2;
        const avgSlope2 = (dy + nextDy) / 2;
        
        cp1x = x0 + dx * 0.33;
        cp1y = y0 + avgSlope1 * smoothing;
        cp2x = x1 - dx * 0.33;
        cp2y = y1 - avgSlope2 * smoothing;
      }
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`;
    }
    
    return path;
  };
  
  const pathData = createSmoothPath();
  
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientIdRef.current} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path 
        d={pathData} 
        fill="none" 
        stroke={`url(#${gradientIdRef.current})`} 
        strokeWidth="2" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Progress() {
  const { history = [] } = useWorkout();
  // Load workoutHistory from localStorage to include completed workout data
  const [workoutHistory, setWorkoutHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('workoutHistory');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  // Refresh workoutHistory on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('workoutHistory');
      setWorkoutHistory(stored ? JSON.parse(stored) : []);
    } catch (_) {
      setWorkoutHistory([]);
    }
  }, []);

  const data = useMemo(() => {
    // group by exercise - combine history and workoutHistory data
    const map = new Map();
    
    // Add entries from old history format
    (history || []).forEach(e => {
      if (!e.exercise) return;
      const key = e.exercise;
      const arr = map.get(key) || [];
      arr.push({
        exercise: e.exercise,
        weight: e.weight || 0,
        reps: e.reps || 0,
        ts: e.ts || Date.now()
      });
      map.set(key, arr);
    });
    
    // Add entries from workoutHistory (completed workouts)
    (workoutHistory || []).forEach(workout => {
      if (!workout.exercises || !Array.isArray(workout.exercises)) return;
      
      workout.exercises.forEach(exercise => {
        if (!exercise.exerciseName && !exercise.name) return;
        const exerciseName = exercise.exerciseName || exercise.name;
        const key = exerciseName;
        const arr = map.get(key) || [];
        
        // Add each set as a separate entry
        if (exercise.sets && Array.isArray(exercise.sets)) {
          exercise.sets.forEach(set => {
            if (set.weight && set.reps) {
              arr.push({
                exercise: exerciseName,
                weight: Number(set.weight) || 0,
                reps: Number(set.reps) || 0,
                ts: set.timestamp ? new Date(set.timestamp).getTime() : (workout.startTime ? new Date(workout.startTime).getTime() : Date.now())
              });
            }
          });
        }
        
        if (arr.length > 0) {
          map.set(key, arr);
        }
      });
    });
    
    // sort each by ts asc
    const entries = Array.from(map.entries()).map(([name, arr]) => {
      const sorted = arr.slice().sort((a,b)=>a.ts-b.ts);
      const last = sorted[sorted.length-1];
      // PR by weight*reps simple metric
      const pr = sorted.reduce((best, cur) => (cur.weight*cur.reps) > (best.weight*best.reps) ? cur : best, {weight:0,reps:0});
      const last5 = sorted.slice(-5).map(e => e.weight);
      const trend = last5.length>=2 ? Math.sign(last5[last5.length-1]-last5[last5.length-2]) : 0;
      return { name, sorted, last, pr, last5, trend };
    });
    // sort by most recent activity
    entries.sort((a,b)=> (b.last?.ts||0) - (a.last?.ts||0));
    return entries;
  }, [history, workoutHistory]);

  const [open, setOpen] = useState({});

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-28">
      <h2 className="text-white text-2xl font-bold mb-3">Progress</h2>
      <div className="space-y-3">
        {(data || []).map(item => (
          <div key={item.name} className="pulse-glass rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white font-semibold text-lg">{item.name}</div>
                <div className="text-white/70 text-sm mt-1">
                  {item.last ? `${formatWorkoutDate(item.last.ts)}: ${item.last.weight}kg × ${item.last.reps}` : 'No data yet'}
                </div>
                {item.pr && (item.pr.weight>0) && (
                  <div className="mt-1 text-emerald-300 text-xs font-semibold">PR: {item.pr.weight}kg × {item.pr.reps}</div>
                )}
              </div>
              <div className="text-right">
                <div className={`text-sm ${item.trend>0?'text-emerald-400':item.trend<0?'text-rose-400':'text-white/60'}`}>
                  {item.trend>0?'↑':item.trend<0?'↓':'→'}
                </div>
                <Sparkline points={item.last5} />
              </div>
            </div>
            {open[item.name] && (
              <div className="mt-3 space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                {item.sorted.slice().reverse().map((e,i)=>(
                  <div key={i} className="flex items-center justify-between text-white/80 text-sm">
                    <span>{formatWorkoutDate(e.ts)}</span>
                    <span>{e.weight}kg × {e.reps}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button onClick={()=>setOpen(o=>({...o,[item.name]:!o[item.name]}))} className="px-3 py-1 rounded-xl bg-white/10 text-white border border-white/10 text-xs">
                {open[item.name] ? 'Hide' : 'View History'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
