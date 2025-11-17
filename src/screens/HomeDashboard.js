import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';
import { formatWorkoutDate } from '../utils/dateFormatter';

// Custom SVG icons
const FireIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
  </svg>
);

const MuscleIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TrendingUpIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const DumbbellIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const PlayIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

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
  const { history = [], savedWorkouts = [], startWorkoutFromTemplate, userProfile, userStats, prefs } = useWorkout();
  const navigate = useNavigate();
  const location = useLocation();

  // Load workout history from localStorage - refresh on component mount and when navigating back
  const [workoutHistory, setWorkoutHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('workoutHistory');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  // Refresh workout history when component mounts or when navigating back to page
  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem('workoutHistory');
        setWorkoutHistory(stored ? JSON.parse(stored) : []);
      } catch (_) {
        setWorkoutHistory([]);
      }
    };

    // Load on mount and whenever location changes (navigating to this page)
    loadHistory();

    // Refresh when window gains focus (user navigated back)
    const handleFocus = () => loadHistory();
    window.addEventListener('focus', handleFocus);

    // Listen for storage events (if workout is saved in another tab/window)
    window.addEventListener('storage', loadHistory);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', loadHistory);
    };
  }, [location.pathname]); // Reload when route changes

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

    const countBodyweightInVolume = prefs?.countBodyweightInVolume || false;
    const userBodyWeight = prefs?.userBodyWeight || 0;
    const calculateVolume = (workouts) => {
      return workouts.reduce((total, workout) => {
        return total + workout.entries.reduce((vol, e) => {
          if (e.isBodyweight) {
            // If setting is enabled and user body weight is set, use it for volume calculation
            if (countBodyweightInVolume && userBodyWeight > 0) {
              return vol + (e.reps * userBodyWeight);
            }
            // Otherwise, skip (count as 0)
            return vol;
          }
          return vol + (e.reps * e.weight);
        }, 0);
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

    // Recent workouts (last 5) - with proper error handling
    const recentWorkouts = Array.from(workoutsByDate.values())
      .sort((a, b) => b.date - a.date)
      .slice(0, 5)
      .map(workout => {
        // Calculate volume properly: sum of (weight × reps) for each entry
        const volume = workout.entries.reduce((sum, e) => {
          const weight = Number(e.weight) || 0;
          const reps = Number(e.reps) || 0;
          return sum + (weight * reps);
        }, 0);
        
        const exercises = [...new Set(workout.entries.map(e => e.exercise).filter(Boolean))];
        
        // Format date safely
        let dateStr = 'Unknown';
        try {
          if (workout.date instanceof Date && !isNaN(workout.date.getTime())) {
            dateStr = workout.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          }
        } catch (e) {
          dateStr = 'Unknown';
        }
        
        return {
          date: workout.date,
          dateStr,
          volume: Math.round(volume), // Round to whole number
          exerciseCount: exercises.length,
          exercises: exercises.slice(0, 2).join(', ') + (exercises.length > 2 ? '...' : ''),
          duration: 45 // estimated
        };
      })
      .filter(workout => workout.volume > 0 || workout.exerciseCount > 0); // Filter out invalid entries

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
  }, [history, workoutHistory, prefs]);

  // Get personalized stats from userStats or fallback to calculated stats
  const personalStreak = userStats?.currentStreak || stats.streak || 0;
  const totalWorkouts = userStats?.totalWorkouts || workoutHistory.length || 0;
  const totalVolume = userStats?.totalVolume || 0;
  const longestStreak = userStats?.longestStreak || 0;
  
  // Get current month workout count
  const currentMonth = new Date();
  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthWorkouts = userStats?.workoutCountsByMonth?.[monthKey] || 0;

  // Get personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return userName ? `Good morning, ${userName}!` : 'Good morning!';
    if (hour < 18) return userName ? `Good afternoon, ${userName}!` : 'Good afternoon!';
    return userName ? `Good evening, ${userName}!` : 'Good evening!';
  };

  return (
    <div className="w-full max-w-[375px] px-6 pt-8 pb-32" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 120px)' }}>
      {/* Top Section - Clean Header */}
      <div className="mb-8">
        {userName && (
          <div className="text-white/70 text-lg mb-2">Hey {userName}</div>
        )}
        <h1 className="text-white text-3xl font-bold mb-1" style={{ fontSize: '32px' }}>
          {!userName && getGreeting()}
          {userName && 'Your Workouts'}
        </h1>
      </div>

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="pulse-glass rounded-xl p-5 text-center" style={{ borderRadius: '20px' }}>
          <div className="text-white/60 text-xs uppercase tracking-wide mb-2" style={{ fontSize: '12px' }}>
            Total Workouts
          </div>
          <div className="text-white text-3xl font-bold mb-1" style={{ fontSize: '32px' }}>
            {totalWorkouts}
        </div>
          {thisMonthWorkouts > 0 && (
            <div className="text-white/50 text-xs" style={{ fontSize: '12px' }}>
              {thisMonthWorkouts} this month
      </div>
        )}
      </div>

        <div className="pulse-glass rounded-xl p-5 text-center" style={{ borderRadius: '20px' }}>
          <div className="text-white/60 text-xs uppercase tracking-wide mb-2" style={{ fontSize: '12px' }}>
            Total Volume
          </div>
          <div className="text-white text-3xl font-bold mb-1" style={{ fontSize: '32px' }}>
            {totalVolume > 0 ? Math.round(totalVolume / 1000) + 't' : '0t'}
          </div>
          <div className="text-white/50 text-xs" style={{ fontSize: '12px' }}>
            tons lifted
          </div>
        </div>
        
        <div className="pulse-glass rounded-xl p-5 text-center" style={{ borderRadius: '20px' }}>
          <div className="text-white/60 text-xs uppercase tracking-wide mb-2" style={{ fontSize: '12px' }}>
            Current Streak
          </div>
          <div className="text-white text-3xl font-bold mb-1" style={{ fontSize: '32px' }}>
            {personalStreak}
      </div>
          <div className="text-white/50 text-xs" style={{ fontSize: '12px' }}>
            {personalStreak > 0 ? 'days!' : 'Start today'}
          </div>
        </div>
        
        <div className="pulse-glass rounded-xl p-5 text-center" style={{ borderRadius: '20px' }}>
          <div className="text-white/60 text-xs uppercase tracking-wide mb-2" style={{ fontSize: '12px' }}>
            This Week
          </div>
          <div className="text-white text-3xl font-bold mb-1" style={{ fontSize: '32px' }}>
            {stats.weeklyProgress}/{stats.weeklyGoal}
          </div>
          <div className="text-white/50 text-xs" style={{ fontSize: '12px' }}>
            workouts
        </div>
        </div>
      </div>

      {/* My Saved Workouts - Horizontal Cards */}
      {featuredWorkouts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-2xl font-bold" style={{ fontSize: '24px' }}>My Saved Workouts</h2>
            {featuredWorkouts.length > 3 && (
            <button
              onClick={() => navigate('/my-workouts')}
                className="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors"
                style={{ color: 'var(--accent-primary)' }}
            >
              View All
            </button>
            )}
          </div>
          <div className="space-y-4">
            {featuredWorkouts.slice(0, 3).map((workout) => {
              const exercises = workout.exercises || [];
              const preview = formatPreview(exercises);
              const sets = countSets(exercises);
              const exerciseCount = exercises.length;
              return (
                <div 
                  key={workout.id} 
                  onClick={() => {
                    // Navigate to edit workout when card is clicked
                    navigate('/create-custom', { state: { editWorkoutId: workout.id } });
                  }}
                  className="pulse-glass rounded-xl p-5 border border-white/10 hover:scale-[1.02] transition-transform cursor-pointer"
                  style={{ borderRadius: '20px' }}
                >
                  <div className="flex items-center gap-4">
                    {/* Left: Accent Bar */}
                    <div className="w-1 h-16 rounded-full bg-gradient-to-b from-cyan-400 to-purple-500 flex-shrink-0" />
                    
                    {/* Middle: Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-lg font-semibold mb-1 truncate" style={{ fontSize: '18px', fontWeight: 600 }}>
                        {workout.name}
                      </div>
                      <div className="text-white/60 text-sm mb-2" style={{ fontSize: '14px' }}>
                        {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} • {sets} set{sets !== 1 ? 's' : ''}
                      </div>
                      {preview && (
                        <div className="text-white/50 text-xs truncate" style={{ fontSize: '12px' }}>
                          {preview}
                        </div>
                      )}
                    </div>
                    
                    {/* Right: Orange START Button */}
                    <button
                      onClick={(e) => {
                        // Prevent card click from firing when button is clicked
                        e.stopPropagation();
                        if (startWorkoutFromTemplate(workout.id)) {
                          if (window?.__toast) window.__toast('Workout loaded');
                          navigate('/workout-preview', { state: { workoutId: workout.id } });
                        } else if (window?.__toast) {
                          window.__toast('Workout could not be loaded');
                        }
                      }}
                      className="px-6 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/30 flex-shrink-0"
                      style={{ 
                        background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
                        borderRadius: '16px'
                      }}
                    >
                      <PlayIcon className="w-4 h-4" />
                      START
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      {workoutHistory.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-2xl font-bold" style={{ fontSize: '24px' }}>Recent Workouts</h2>
            {workoutHistory.length > 3 && (
              <button
                onClick={() => navigate('/history')}
                className="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors"
                style={{ color: 'var(--accent-primary)' }}
              >
                View All
              </button>
            )}
          </div>
          <div className="space-y-3">
            {workoutHistory
              .filter((workout) => {
                // Filter out workouts with invalid dates
                const dateValue = workout.date || workout.startTime;
                if (!dateValue) return false;
                try {
                  const workoutDate = new Date(dateValue);
                  if (isNaN(workoutDate.getTime())) return false;
                  const formatted = formatWorkoutDate(workoutDate);
                  return formatted && !formatted.toLowerCase().includes('invalid');
                } catch (e) {
                  return false;
                }
              })
              .slice(0, 3)
              .map((workout) => {
                // Format date safely with fallback
                let dateStr = 'Unknown';
                let timeStr = '';
                try {
                  const dateValue = workout.date || workout.startTime;
                  if (dateValue) {
                    const workoutDate = new Date(dateValue);
                    if (!isNaN(workoutDate.getTime())) {
                      dateStr = formatWorkoutDate(workoutDate);
                      timeStr = workoutDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                    }
                  }
                } catch (e) {
                  // Keep default 'Unknown'
                }
              
              const exerciseNames = workout.exercises?.map(ex => ex.exerciseName || ex.name).filter(Boolean) || [];
              const exerciseCount = exerciseNames.length;
              const exercisePreview = exerciseNames.slice(0, 2).join(', ') + (exerciseCount > 2 ? '...' : '');
              
              // Calculate volume properly from exercises
              let totalVolume = 0;
              let totalSets = 0;
              
              if (workout.exercises && Array.isArray(workout.exercises)) {
                workout.exercises.forEach(ex => {
                  if (ex.sets && Array.isArray(ex.sets)) {
                    ex.sets.forEach(set => {
                      const weight = Number(set.weight) || 0;
                      const reps = Number(set.reps) || 0;
                      if (weight > 0 && reps > 0) {
                        totalVolume += weight * reps;
                        totalSets++;
                      }
                    });
                  }
                });
              }
              
              // Use stored values if calculated volume is 0
              if (totalVolume === 0) {
                totalVolume = Number(workout.totalVolume) || 0;
                totalSets = Number(workout.totalSets) || 0;
              }
              
              // Round volume to whole number
              totalVolume = Math.round(totalVolume);
              
              return (
                <div 
                  key={workout.id} 
                  className="pulse-glass rounded-xl p-4 border border-white/10 hover:scale-[1.01] transition-transform"
                  style={{ borderRadius: '20px' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white/80 text-xs font-medium">
                          {dateStr}
                        </span>
                        {timeStr && (
                          <span className="text-white/50 text-xs">{timeStr}</span>
                        )}
                      </div>
                      
                      <div className="text-white text-base font-semibold mb-1 truncate" style={{ fontSize: '18px', fontWeight: 600 }}>
                        {workout.name || 'Untitled Workout'}
                      </div>
                      
                      {exercisePreview && (
                        <div className="text-white/70 text-sm mb-2" style={{ fontSize: '14px' }}>
                          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}: {exercisePreview}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-white/60" style={{ fontSize: '12px' }}>
                        <span>{totalSets || 0} sets</span>
                        <span>•</span>
                        <span>{totalVolume > 0 ? totalVolume.toLocaleString() : '0'} kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}
    </div>
  );
}
