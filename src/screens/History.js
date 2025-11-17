import React, { useMemo } from 'react';
import { useWorkout } from '../state/WorkoutContext';
import { formatWorkoutDate } from '../utils/dateFormatter';
import { BODYWEIGHT_EXERCISES } from '../data/exerciseLibrary';

// Custom SVG icons
const ClockIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DumbbellIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default function History() {
  const { history = [] } = useWorkout();
  const groups = useMemo(() => {
    const byDay = new Map();
    (history || []).slice()
      .filter(e => {
        // Filter out entries with invalid dates
        if (!e.ts) return false;
        const d = new Date(e.ts);
        return !isNaN(d.getTime());
      })
      .sort((a,b)=>b.ts-a.ts)
      .forEach(e => {
        const d = new Date(e.ts);
        // Group by actual date (normalize to start of day) but display formatted string
        const dateKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        if (!byDay.has(dateKey)) {
          const displayLabel = formatWorkoutDate(d);
          // Double check that formatWorkoutDate didn't return "Invalid date"
          if (displayLabel && displayLabel.toLowerCase().includes('invalid')) {
            return; // Skip invalid dates
          }
          byDay.set(dateKey, { date: d, displayLabel, entries: [] });
        }
        byDay.get(dateKey).entries.push(e);
      });
    // Convert to array, filter out invalid dates, and sort by date (most recent first)
    return Array.from(byDay.values())
      .filter(group => {
        const label = group.displayLabel;
        return label && !label.toLowerCase().includes('invalid');
      })
      .sort((a, b) => b.date - a.date)
      .map(group => [group.displayLabel, group.entries]);
  }, [history]);

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-28 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/30 to-blue-400/20 flex items-center justify-center">
          <ClockIcon className="w-5 h-5 text-cyan-300" />
        </div>
        <div>
          <h2 className="text-white text-2xl font-bold">History</h2>
          <p className="text-white/60 text-sm">{groups.length} day{groups.length !== 1 ? 's' : ''} of activity</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {groups.map(([day, entries], dayIdx) => (
          <div 
            key={day} 
            className="pulse-glass rounded-2xl p-5 border border-white/15 backdrop-blur-xl"
            style={{
              background: `linear-gradient(135deg, rgba(34, 211, 238, ${0.08 - dayIdx * 0.01}), rgba(6, 182, 212, ${0.05 - dayIdx * 0.01}))`,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="text-white font-bold text-lg">{day}</div>
              <div className="flex-1 h-px bg-white/10"></div>
              <div className="text-white/60 text-xs font-medium">{entries.length} set{entries.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="space-y-2">
              {entries.map((e, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <DumbbellIcon className="w-4 h-4 text-cyan-300 flex-shrink-0" />
                    <span className="text-white font-medium text-sm truncate">{e.exercise}</span>
                  </div>
                  <span className="text-white/80 text-sm font-semibold ml-3">
                    {e.isBodyweight || (e.weight === 0 && BODYWEIGHT_EXERCISES.has(e.exercise)) 
                      ? 'bodyweight' 
                      : `${e.weight} kg`} × {e.reps}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="pulse-glass rounded-2xl p-8 text-center border border-white/15">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-8 h-8 text-white/40" />
            </div>
            <div className="text-white/80 text-base font-semibold mb-2">No history yet</div>
            <div className="text-white/60 text-sm">Log a set to see it here</div>
          </div>
        )}
      </div>
    </div>
  );
}
