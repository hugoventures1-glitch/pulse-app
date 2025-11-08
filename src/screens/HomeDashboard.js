import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';

function ProgressRing({ percent = 65, size = 130, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <svg width={size} height={size} className="drop-shadow-xl">
      <defs>
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} fill="none" />
      <circle cx={size/2} cy={size/2} r={radius} stroke="url(#ringGradient)" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" fill="none" transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-white" style={{ fontFamily: 'Orbitron, ui-sans-serif', fontWeight: 700, fontSize: 26 }}>{clamped}%</text>
    </svg>
  );
}

const formatPreview = (exercises = []) => {
  const names = exercises.map((exercise) => exercise.name);
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')}...`;
};

const countSets = (exercises = []) => exercises.reduce((sum, exercise) => sum + (exercise.sets?.length || exercise.setTargets?.length || exercise.setsCount || 0), 0);

export default function HomeDashboard() {
  const { history = [], savedWorkouts = [], startWorkoutFromTemplate } = useWorkout();
  const navigate = useNavigate();

  // Get user profile from localStorage
  const userProfile = useMemo(() => {
    try {
      const profile = localStorage.getItem('userProfile');
      return profile ? JSON.parse(profile) : null;
    } catch(_) {
      return null;
    }
  }, []);

  const userName = userProfile?.name || null;

  const featuredWorkouts = useMemo(() => {
    return [...savedWorkouts]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 3);
  }, [savedWorkouts]);

  // Calculate stats from history
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // Group history by workout sessions (by date)
    const workoutsByDate = new Map();
    history.forEach(entry => {
      const date = new Date(entry.ts);
      const dateKey = date.toLocaleDateString();
      if (!workoutsByDate.has(dateKey)) {
        workoutsByDate.set(dateKey, { date, entries: [] });
      }
      workoutsByDate.get(dateKey).entries.push(entry);
    });

    // Calculate this week's stats
    const thisWeekWorkouts = Array.from(workoutsByDate.values()).filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= weekStart;
    });

    const lastWeekWorkouts = Array.from(workoutsByDate.values()).filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= lastWeekStart && workoutDate < weekStart;
    });

    const calculateVolume = (workouts) => {
      return workouts.reduce((total, workout) => {
        return total + workout.entries.reduce((vol, e) => vol + (e.reps * e.weight), 0);
      }, 0);
    };

    const calculateDuration = (workouts) => {
      // Estimate 45 min per workout session
      return workouts.length * 45;
    };

    const thisWeekVolume = calculateVolume(thisWeekWorkouts);
    const lastWeekVolume = calculateVolume(lastWeekWorkouts);
    const volumeChange = lastWeekVolume > 0 ? ((thisWeekVolume - lastWeekVolume) / lastWeekVolume * 100) : 0;

    // Calculate streak
    const sortedDates = Array.from(workoutsByDate.keys()).sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    const today = new Date().toLocaleDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString();

    if (sortedDates.includes(today)) {
      streak = 1;
      let checkDate = new Date(yesterday);
      for (let i = 0; i < 30; i++) {
        const checkStr = checkDate.toLocaleDateString();
        if (sortedDates.includes(checkStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else if (sortedDates.includes(yesterdayStr)) {
      streak = 1;
      let checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 2);
      for (let i = 0; i < 30; i++) {
        const checkStr = checkDate.toLocaleDateString();
        if (sortedDates.includes(checkStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Find most trained muscle group (simplified - group by exercise names)
    const exerciseCounts = new Map();
    thisWeekWorkouts.forEach(workout => {
      workout.entries.forEach(e => {
        const count = exerciseCounts.get(e.exercise) || 0;
        exerciseCounts.set(e.exercise, count + 1);
      });
    });
    const mostTrained = Array.from(exerciseCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    // Find recent PRs (simplified - check if any recent entry is higher than previous)
    const exercisePRs = new Map();
    history.slice().sort((a, b) => b.ts - a.ts).forEach(entry => {
      const key = entry.exercise;
      const currentMax = exercisePRs.get(key) || { weight: 0, reps: 0, volume: 0 };
      const volume = entry.weight * entry.reps;
      const currentVolume = currentMax.weight * currentMax.reps;
      
      if (volume > currentVolume) {
        exercisePRs.set(key, { weight: entry.weight, reps: entry.reps, volume });
      }
    });

    const recentPR = Array.from(exercisePRs.entries())
      .map(([name, pr]) => ({ name, ...pr }))
      .sort((a, b) => b.volume - a.volume)[0];

    // Weekly goal (default to 4 workouts per week)
    const weeklyGoal = 4;
    const weeklyProgress = Math.min(thisWeekWorkouts.length, weeklyGoal);

    // Recent workouts (last 5)
    const recentWorkouts = Array.from(workoutsByDate.values())
      .sort((a, b) => b.date - a.date)
      .slice(0, 5)
      .map(workout => {
        const volume = workout.entries.reduce((sum, e) => sum + (e.reps * e.weight), 0);
        const exercises = [...new Set(workout.entries.map(e => e.exercise))];
        return {
          date: workout.date,
          dateStr: workout.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          volume,
          exerciseCount: exercises.length,
          exercises: exercises.slice(0, 2).join(', ') + (exercises.length > 2 ? '...' : ''),
          duration: 45 // estimated
        };
      });

    return {
      streak,
      weeklyProgress,
      weeklyGoal,
      thisWeekVolume,
      lastWeekVolume,
      volumeChange,
      thisWeekDuration: calculateDuration(thisWeekWorkouts),
      mostTrained,
      recentPR,
      recentWorkouts,
      weeklyCompletion: Math.round((weeklyProgress / weeklyGoal) * 100)
    };
  }, [history]);

  return (
    <div className="w-full max-w-[375px] px-4 pt-5 pb-28">
      {/* Welcome Banner */}
      <div className="mb-6 pt-2">
        <h1 className="text-white text-3xl font-bold">
          {userName ? `Welcome back, ${userName}! 👋` : 'Welcome back! 👋'}
        </h1>
      </div>

      {/* Progress Ring */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="rounded-full p-3 bg-white/5 border border-white/10 backdrop-blur-md">
          <ProgressRing percent={stats.weeklyCompletion} />
        </div>
        <p className="text-white/80 text-sm">Weekly Goal Completion</p>
      </div>

      {/* Streak Counter */}
      <div className="pulse-glass rounded-3xl p-6 mb-5 text-center">
        {stats.streak > 0 ? (
          <>
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-white text-2xl font-bold">{stats.streak} Day Streak!</div>
            <div className="text-white/70 text-sm mt-1">Keep it going!</div>
          </>
        ) : (
          <>
            <div className="text-4xl mb-2">💪</div>
            <div className="text-white text-xl font-semibold">Start your streak today!</div>
            <div className="text-white/70 text-sm mt-1">Log your first workout to begin</div>
          </>
        )}
      </div>

      {/* This Week Summary */}
      <div className="pulse-glass rounded-3xl p-5 mb-5">
        <div className="text-white text-lg font-bold mb-4">This Week</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Workouts</span>
            <span className="text-white font-semibold">{stats.weeklyProgress} of {stats.weeklyGoal} complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Total Volume</span>
            <span className="text-white font-semibold">{stats.thisWeekVolume.toLocaleString()} kg</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm">Total Time</span>
            <span className="text-white font-semibold">{stats.thisWeekDuration} min</span>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="pulse-glass rounded-2xl p-4 text-center">
          <div className="text-white/70 text-xs mb-1">Volume</div>
          <div className={`text-lg font-bold ${stats.volumeChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.volumeChange >= 0 ? '↑' : '↓'} {Math.abs(Math.round(stats.volumeChange))}%
          </div>
          <div className="text-white/60 text-xs mt-1">vs last week</div>
        </div>
        <div className="pulse-glass rounded-2xl p-4 text-center">
          <div className="text-white/70 text-xs mb-1">Top Exercise</div>
          <div className="text-white text-sm font-semibold truncate">{stats.mostTrained}</div>
        </div>
        <div className="pulse-glass rounded-2xl p-4 text-center">
          <div className="text-white/70 text-xs mb-1">Latest PR</div>
          {stats.recentPR ? (
            <>
              <div className="text-white text-sm font-semibold truncate">{stats.recentPR.name}</div>
              <div className="text-white/60 text-xs mt-1">{stats.recentPR.weight}kg × {stats.recentPR.reps}</div>
            </>
          ) : (
            <div className="text-white/60 text-xs mt-1">None yet</div>
          )}
        </div>
      </div>

      {/* My Workouts */}
      {featuredWorkouts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white text-lg font-bold">My Workouts</div>
            <button
              onClick={() => navigate('/my-workouts')}
              className="text-cyan-300 text-xs font-semibold"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {featuredWorkouts.map((workout) => {
              const exercises = workout.exercises || [];
              const preview = formatPreview(exercises);
              const sets = countSets(exercises);
              return (
                <div key={workout.id} className="pulse-glass rounded-2xl p-4 border border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-white text-base font-semibold">{workout.name}</div>
                      <div className="text-white/60 text-xs mt-1">
                        {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} • {sets} set{sets !== 1 ? 's' : ''}
                      </div>
                      <div className="text-white/60 text-xs mt-2">{preview}</div>
                    </div>
                    <button
                      onClick={() => {
                        if (startWorkoutFromTemplate(workout.id)) {
                          if (window?.__toast) window.__toast('Workout loaded');
                          navigate('/focus');
                        } else if (window?.__toast) {
                          window.__toast('Workout could not be loaded');
                        }
                      }}
                      className="px-3 h-9 rounded-full bg-white text-slate-900 text-xs font-semibold"
                    >
                      Start
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mb-5">
        <div className="text-white text-lg font-bold mb-3">Recent Activity</div>
        {stats.recentWorkouts.length > 0 ? (
          <div className="no-scrollbar -mx-4 px-4 overflow-x-auto">
            <div className="flex gap-3 w-max">
              {stats.recentWorkouts.map((workout, idx) => (
                <div key={idx} className="pulse-glass rounded-2xl p-4 min-w-[200px]">
                  <div className="text-white/70 text-xs mb-2">{workout.dateStr}</div>
                  <div className="text-white font-semibold text-sm mb-2">{workout.exercises}</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">{workout.volume.toLocaleString()} kg</span>
                    <span className="text-white/60">{workout.duration} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="pulse-glass rounded-2xl p-6 text-center">
            <div className="text-white/60 text-sm">No workouts yet</div>
            <div className="text-white/40 text-xs mt-1">Start your first workout to see activity here</div>
          </div>
        )}
      </div>
    </div>
  );
}
