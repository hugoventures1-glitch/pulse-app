import React, { useMemo } from 'react';
import { useWorkout } from '../state/WorkoutContext';

export default function History() {
  const { history = [] } = useWorkout();
  const groups = useMemo(() => {
    const byDay = new Map();
    (history || []).slice().sort((a,b)=>b.ts-a.ts).forEach(e => {
      const d = new Date(e.ts);
      const key = d.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'2-digit' });
      const arr = byDay.get(key) || [];
      arr.push(e); byDay.set(key, arr);
    });
    return Array.from(byDay.entries());
  }, [history]);

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-28">
      <h2 className="text-white text-2xl font-bold mb-3">History</h2>
      <div className="space-y-4">
        {groups.map(([day, entries]) => (
          <div key={day} className="pulse-glass rounded-2xl p-4 border border-white/15 backdrop-blur-2xl">
            <div className="text-white/90 font-semibold mb-2">{day}</div>
            <div className="space-y-1">
              {entries.map((e, idx) => (
                <div key={idx} className="flex items-center justify-between text-white/85 text-sm">
                  <span>{e.exercise}</span>
                  <span>{e.weight} kg × {e.reps}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="text-white/70">No history yet. Log a set to see it here.</div>
        )}
      </div>
    </div>
  );
}
