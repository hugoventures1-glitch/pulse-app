import React, { createContext, useContext, useMemo, useState } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { WORKOUT_PROGRAMS } from '../data/workoutPrograms';
import { cleanupWorkoutHistory, shouldRunCleanup, markCleanupComplete, exportFullHistory, getRetentionStats } from '../utils/dataRetention';

const CUSTOM_PROGRAMS_KEY = 'pulseCustomPrograms';
const SAVED_WORKOUTS_KEY = 'pulseSavedWorkouts';

const WorkoutContext = createContext(null);

const PLAN_KEY = 'pulsePlan';
const PROGRESS_KEY = 'pulseSetProgress';
const PREFS_KEY = 'pulsePrefs';
const USER_PROFILE_KEY = 'pulseUserProfile'; // User profile (name, goal, etc.)
const USER_STATS_KEY = 'pulseUserStats'; // User stats (workout count, streak, total volume)
const QUEUE_KEY = 'pulseOfflineQueue';
const PAUSE_KEY = 'pulsePaused';
const HISTORY_KEY = 'pulseHistory';
const WORKOUT_HISTORY_KEY = 'workoutHistory'; // New key for full workout history
const PROGRAM_KEY = 'pulseProgram';
const PROGRAM_DAY_KEY = 'pulseProgramDay';
const PROGRAM_START_DATE_KEY = 'pulseProgramStartDate';

// Hardcoded workout plan (can be dynamic later)
const DEFAULT_PLAN = [
  { name: 'Bench Press', sets: 3, reps: 8, weight: 80 },
  { name: 'Squat', sets: 3, reps: 10, weight: 100 },
  { name: 'Deadlift', sets: 3, reps: 5, weight: 120 },
  { name: 'Shoulder Press', sets: 3, reps: 8, weight: 50 }
];

export function WorkoutProvider({ children }) {
  const [logs, setLogs] = useState([]); // {timestamp, text}
  const [currentExercise, setCurrentExercise] = useState({
    name: 'Barbell Bench Press',
    setIndex: 2,
    totalSets: 4,
    reps: 8,
    weight: 185,
  });
  // Plan/completion tracking
  const [workoutPlan, setWorkoutPlan] = useState(DEFAULT_PLAN);
  const [completedExercises, setCompletedExercises] = useState({}); // name -> sets completed (array)
  const [additionalExercises, setAdditionalExercises] = useState([]); // [{ name, sets, reps, weight, complete:true/false }]
  // Track set progress: { [exerciseName]: { progress: number, values: Array<{ reps, weight }> } }
  const [setProgress, setSetProgress] = useState({});
  const [workoutStartAt, setWorkoutStartAt] = useState(null);
  const [history, setHistory] = useState(() => {
    try { const h = localStorage.getItem(HISTORY_KEY); return h ? JSON.parse(h) : []; } catch(_) { return []; }
  });
  // Global paused state across screens
  const [isPaused, setIsPaused] = useState(() => {
    try { const p = localStorage.getItem(PAUSE_KEY); return p ? JSON.parse(p).isPaused : false; } catch(_) { return false; }
  });
  const [pausedAt, setPausedAt] = useState(null);

  // Data retention cleanup - run on mount and weekly
  const cleanupRunRef = useRef(false);
  useEffect(() => {
    if (cleanupRunRef.current) return;
    
    // Run cleanup check once on mount
    if (shouldRunCleanup()) {
      const currentHistory = (() => {
        try {
          const h = localStorage.getItem(HISTORY_KEY);
          return h ? JSON.parse(h) : [];
        } catch (_) {
          return [];
        }
      })();
      
      if (currentHistory.length > 0) {
        const result = cleanupWorkoutHistory(currentHistory);
        if (result.archived > 0) {
          setHistory(result.history);
          console.log(`Archived ${result.archived} old workouts, kept ${result.prsUpdated} PRs`);
        }
        markCleanupComplete();
      } else {
        markCleanupComplete();
      }
    }
    cleanupRunRef.current = true;
  }, []); // Run once on mount

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch(_){}
  }, [history]);

  // OFFLINE WORK
  // Preferences
  const [prefs, setPrefs] = useState(() => {
    try {
      const val = localStorage.getItem(PREFS_KEY);
      return val ? JSON.parse(val) : { restDuration: 90 };
    } catch(e) { return { restDuration: 90 }; }
  });
  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch(_){}
  }, [prefs]);

  // User Profile (name, goal, unit preference, etc.)
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const val = localStorage.getItem(USER_PROFILE_KEY);
      return val ? JSON.parse(val) : null;
    } catch(e) { return null; }
  });
  useEffect(() => {
    try { 
      if (userProfile) {
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
        // Also sync to userProfile key for backward compatibility with HomeDashboard
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
      }
    } catch(_){}
  }, [userProfile]);

  // User Stats (workout count, streak, total volume, etc.)
  const [userStats, setUserStats] = useState(() => {
    try {
      const val = localStorage.getItem(USER_STATS_KEY);
      return val ? JSON.parse(val) : { 
        totalWorkouts: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalVolume: 0, // in kg
        lastWorkoutDate: null,
        workoutCountsByMonth: {}, // { '2025-11': 5, '2025-10': 8 }
        favoriteExercises: [] // { name, count }
      };
    } catch(e) { 
      return { 
        totalWorkouts: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalVolume: 0,
        lastWorkoutDate: null,
        workoutCountsByMonth: {},
        favoriteExercises: []
      }; 
    }
  });
  useEffect(() => {
    try { localStorage.setItem(USER_STATS_KEY, JSON.stringify(userStats)); } catch(_){}
  }, [userStats]);

  const [customPrograms, setCustomPrograms] = useState(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_PROGRAMS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (_) {
      return {};
    }
  });
  useEffect(() => {
    try { localStorage.setItem(CUSTOM_PROGRAMS_KEY, JSON.stringify(customPrograms)); } catch(_){ }
  }, [customPrograms]);

  const [savedWorkouts, setSavedWorkouts] = useState(() => {
    try {
      const stored = localStorage.getItem(SAVED_WORKOUTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });
  useEffect(() => {
    try { localStorage.setItem(SAVED_WORKOUTS_KEY, JSON.stringify(savedWorkouts)); } catch(_){ }
  }, [savedWorkouts]);

  // PROGRAM SELECTION
  const [selectedProgramId, setSelectedProgramId] = useState(() => {
    try {
      const id = localStorage.getItem(PROGRAM_KEY);
      return id || null;
    } catch(_) { return null; }
  });
  const [programStartDate, setProgramStartDate] = useState(() => {
    try {
      const date = localStorage.getItem(PROGRAM_START_DATE_KEY);
      return date || null;
    } catch(_) { return null; }
  });

  const getBaseProgram = useCallback((programId) => {
    return WORKOUT_PROGRAMS.find(p => p.id === programId) || null;
  }, []);

  const getProgramDefinition = useCallback((programId) => {
    if (!programId) return null;
    const base = getBaseProgram(programId);
    if (!base) return null;
    const custom = customPrograms[programId];
    if (!custom) return base;
    return { ...custom, id: programId };
  }, [customPrograms, getBaseProgram]);

  const buildPlanFromTemplate = useCallback((template) => {
    if (!template || !Array.isArray(template.exercises)) return [];
    return template.exercises.map((exercise) => {
      const setTargets = exercise.setTargets || exercise.sets || [];
      const first = setTargets[0] || { reps: exercise.reps || 0, weight: exercise.weight || 0 };
      return {
        name: exercise.name,
        sets: setTargets.length || exercise.setsCount || 0,
        reps: first.reps || exercise.reps || 0,
        weight: first.weight || exercise.weight || 0,
        setTargets,
      };
    });
  }, []);

  // Calculate current day based on start date
  const getCurrentDayIndex = useCallback(() => {
    if (!selectedProgramId || !programStartDate) return 0;
    const program = getProgramDefinition(selectedProgramId);
    if (!program || !program.days || program.days.length === 0) return 0;

    const start = new Date(programStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    return daysSinceStart % program.days.length;
  }, [selectedProgramId, programStartDate, getProgramDefinition]);

  // Update workout plan when program day changes
  useEffect(() => {
    if (!selectedProgramId) return;
    
    const program = getProgramDefinition(selectedProgramId);
    if (!program) return;
    
    const dayIndex = getCurrentDayIndex();
    const currentDay = program.days[dayIndex];
    
    if (currentDay) {
      setWorkoutPlan(currentDay.exercises);
    }
  }, [selectedProgramId, programStartDate, getCurrentDayIndex, getProgramDefinition]);

  const selectProgram = useCallback((programId) => {
    const program = getProgramDefinition(programId);
    if (!program) return;
    const startStamp = new Date().toISOString();
    setSelectedProgramId(programId);
    setProgramStartDate(startStamp);
    const dayIndex = 0;
    setWorkoutPlan(program.days?.[dayIndex]?.exercises || []);
    try {
      localStorage.setItem(PROGRAM_KEY, programId);
      localStorage.setItem(PROGRAM_START_DATE_KEY, startStamp);
    } catch(_) {}
  }, [getProgramDefinition]);

  useEffect(() => {
    try {
      if (selectedProgramId) {
        localStorage.setItem(PROGRAM_KEY, selectedProgramId);
      }
      if (programStartDate) {
        localStorage.setItem(PROGRAM_START_DATE_KEY, programStartDate);
      }
    } catch(_) {}
  }, [selectedProgramId, programStartDate]);

  // PLAN LOCALSTORAGE
  // Initial plan from localStorage if exists
  useEffect(() => {
    try {
      const plan = localStorage.getItem(PLAN_KEY);
      if (plan) {
        setWorkoutPlan(JSON.parse(plan));
        console.log('Loaded plan from localStorage');
      }
    } catch(_){}}
  ,[]);
  // Save plan on change
  useEffect(() => {
    try {
      if (workoutPlan && Array.isArray(workoutPlan)) {
        localStorage.setItem(PLAN_KEY, JSON.stringify(workoutPlan));
        console.log('Saved plan to localStorage', workoutPlan);
      }
    } catch(_){}
  }, [workoutPlan]);

  // SET PROGRESS LOCALSTORAGE
  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(setProgress));
      console.log('Saved setProgress', setProgress);
    } catch(_){}
  }, [setProgress]);
  useEffect(() => {
    try {
      const val = localStorage.getItem(PROGRESS_KEY);
      if (val) {
        setSetProgress(JSON.parse(val));
        console.log('Loaded setProgress from localStorage');
      }
    } catch(_){}
  }, []);

  // OFFLINE QUEUE AND SYNC
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      const q = localStorage.getItem(QUEUE_KEY);
      return q ? JSON.parse(q) : [];
    } catch(_) { return []; }
  });
  const flushQueue = useCallback((cb) => {
    // On reconnect: batch queued logs into state
    if (offlineQueue.length > 0) {
      const batch = [...offlineQueue];
      setOfflineQueue([]);
      try { localStorage.setItem(QUEUE_KEY, JSON.stringify([])); } catch(_){}
      // Replay logs: TODO, for now just log
      console.log('Syncing queued data:', batch);
      // Optionally update setProgress etc from batch here
      if(cb) cb();
    }
  }, [offlineQueue]);
  // Save/persist offline queue
  useEffect(() => {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(offlineQueue)); } catch(_){}
  }, [offlineQueue]);

  // Pause/resume helpers stored globally
  const pauseWorkout = useCallback(() => {
    if (!isPaused) {
      setIsPaused(true);
      setPausedAt(Date.now());
      try { localStorage.setItem(PAUSE_KEY, JSON.stringify({ isPaused: true })); } catch(_){}
    }
  }, [isPaused]);

  const resumeWorkout = useCallback(() => {
    setIsPaused(false);
    setPausedAt(null);
    try { localStorage.setItem(PAUSE_KEY, JSON.stringify({ isPaused: false })); } catch(_){}
  }, []);

  const getElapsedMs = useCallback(() => {
    if (!workoutStartAt) return 0;
    const end = isPaused && pausedAt ? pausedAt : Date.now();
    return Math.max(0, end - workoutStartAt);
  }, [workoutStartAt, isPaused, pausedAt]);

  // Connectivity monitoring
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      flushQueue(()=>{
        if (window && window.__toast) window.__toast('Back online. Data synced.');
      });
    }
    function handleOffline() { setIsOnline(false); }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushQueue]);

  // Helper to get the current set number (1-based) for an exercise
  function getCurrentSetNum(name, sets) {
    if (!setProgress[name]) return 1;
    return Math.min((setProgress[name].progress || 1), sets);
  }

  // Log a completed set (increments)
  function logSetCompletion({ exercise, reps, weight, sets: totalSets }) {
    if (!workoutStartAt) setWorkoutStartAt(Date.now());
    setSetProgress(prev => {
      const curr = prev[exercise] || { progress: 0, values: [] };
      // Store actual reps, weight
      const nextValues = [...curr.values, { reps, weight }];
      const nextValue = curr.progress + 1;
      console.log(`Increment set for ${exercise}: ${nextValue}/${totalSets}`);
      // Append to history (one entry per set)
      try {
        const entry = { ts: Date.now(), exercise, reps: Number(reps)||0, weight: Number(weight)||0 };
        setHistory(h => [...h, entry]);
        console.log('History appended:', entry);
      } catch(_){}
      return {
        ...prev,
        [exercise]: {
          progress: Math.min(nextValue, totalSets || 1),
          values: nextValues.slice(0, totalSets || 1), // cap
        }
      };
    });
  }

  // Reset set progress when plan changes or workout starts (not shown yet)

  // For auto-move to next exercise, keep track of current exercise index
  const [currentPlanIdx, setCurrentPlanIdx] = useState(0);
  function nextExerciseIdx() {
    setCurrentPlanIdx(idx => Math.min(idx + 1, (workoutPlan.length - 1)));
  }

  // Expose helpers
  const addLog = (text) => {
    setLogs((l) => [{ timestamp: new Date(), text }, ...l].slice(0, 50));
  };

  const updateFromCommand = ({ setsDone, reps, weight }) => {
    setCurrentExercise((prev) => {
      const next = { ...prev };
      if (typeof setsDone === 'number') {
        next.setIndex = Math.min(next.totalSets, Math.max(0, setsDone));
      }
      if (typeof reps === 'number') next.reps = reps;
      if (typeof weight === 'number') next.weight = weight;
      return next;
    });
  };

  const markSetComplete = (exerciseName, setIdx, reps, weight) => {
    setCompletedExercises((prev) => {
      const setsDone = prev[exerciseName] ? [...prev[exerciseName]] : [];
      setsDone[setIdx] = { reps, weight };
      return { ...prev, [exerciseName]: setsDone };
    });
  };
  const markExerciseComplete = (name, sets) => {
    setCompletedExercises(prev => ({ ...prev, [name]: Array.from({length: sets}, () => ({ reps: null, weight: null })) }))
  };
  const addAdditionalExercise = (obj) => {
    setAdditionalExercises((prev) => {
      // Avoid duplicates: by name + set
      if (prev.find(e => e.name === obj.name && e.sets === obj.sets)) return prev;
      return [...prev, { ...obj, complete: true }];
    });
  };

  const updateAdditionalExercise = useCallback((index, updates) => {
    setAdditionalExercises((prev) => {
      const updated = [...prev];
      if (index >= 0 && index < updated.length) {
        updated[index] = { ...updated[index], ...updates };
      }
      return updated;
    });
  }, []);

  const removeAdditionalExercise = useCallback((index) => {
    setAdditionalExercises((prev) => {
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const endWorkout = useCallback(() => {
    // Save workout to workoutHistory before clearing
    if (workoutStartAt && (workoutPlan.length > 0 || additionalExercises.length > 0)) {
      // Ensure dates are in ISO format for proper storage
      const now = Date.now();
      const endTime = new Date(now).toISOString();
      const startTime = new Date(workoutStartAt).toISOString();
      
      // Calculate duration
      const durationMs = now - workoutStartAt;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      
      // Build exercises array with sets
      const exercises = [];
      let totalVolume = 0;
      let totalSets = 0;
      
      // Add exercises from workout plan
      workoutPlan.forEach((ex, idx) => {
        const progress = setProgress?.[ex.name] || {};
        const values = progress.values || [];
        const sets = [];
        let exerciseVolume = 0;
        
        values.forEach((set, setIdx) => {
          const weight = set.weight || 0;
          const reps = set.reps || 0;
          const volume = weight * reps;
          exerciseVolume += volume;
          
          sets.push({
            weight,
            reps,
            unit: 'kg',
            timestamp: new Date(workoutStartAt + (idx * 60000) + (setIdx * 180000)).toISOString() // Approximate timestamps
          });
        });
        
        if (sets.length > 0) {
          exercises.push({
            exerciseId: `${ex.name.toLowerCase().replace(/\s+/g, '_')}_${idx}`,
            exerciseName: ex.name,
            sets
          });
          totalVolume += exerciseVolume;
          totalSets += sets.length;
        }
      });
      
      // Add additional exercises
      additionalExercises.forEach((ex, idx) => {
        if (ex.complete && ex.sets && ex.reps && ex.weight) {
          const sets = [];
          const weight = ex.weight || 0;
          const reps = ex.reps || 0;
          const volume = weight * reps * ex.sets;
          
          for (let i = 0; i < ex.sets; i++) {
            sets.push({
              weight,
              reps,
              unit: 'kg',
              timestamp: new Date(workoutStartAt + ((workoutPlan.length + idx) * 60000) + (i * 180000)).toISOString()
            });
          }
          
          exercises.push({
            exerciseId: `${ex.name.toLowerCase().replace(/\s+/g, '_')}_extra_${idx}`,
            exerciseName: ex.name,
            sets
          });
          totalVolume += volume;
          totalSets += ex.sets;
        }
      });
      
      // Only save if there are logged exercises
      if (exercises.length > 0) {
        // Get workout name if available (from saved workout template)
        // For now, default to "Workout" but can be improved
        const workoutName = 'Workout'; // Could extract from workout template if available
        
        const workoutHistoryEntry = {
          id: `workout_${now}`,
          name: workoutName,
          date: startTime, // ISO string for the workout date (start time)
          startTime, // ISO string
          endTime, // ISO string
          duration,
          exercises,
          totalVolume: Math.round(totalVolume),
          totalSets
        };
        
        // Save to workoutHistory localStorage key
        try {
          const existingHistory = localStorage.getItem(WORKOUT_HISTORY_KEY);
          const workoutHistory = existingHistory ? JSON.parse(existingHistory) : [];
          // Add new workout to beginning (most recent first)
          workoutHistory.unshift(workoutHistoryEntry);
          // Keep last 100 workouts
          const trimmedHistory = workoutHistory.slice(0, 100);
          localStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(trimmedHistory));
          console.log('Workout saved to workoutHistory:', workoutHistoryEntry);
          
          // Update user stats
          setUserStats(prev => {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            let newStreak = prev.currentStreak || 0;
            let longestStreak = prev.longestStreak || 0;
            
            // Calculate streak
            if (prev.lastWorkoutDate) {
              const lastDate = new Date(prev.lastWorkoutDate);
              const lastWorkoutDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
              
              const daysDiff = Math.floor((today - lastWorkoutDay) / (1000 * 60 * 60 * 24));
              
              if (daysDiff === 0) {
                // Same day - keep streak
                newStreak = prev.currentStreak || 1;
              } else if (daysDiff === 1) {
                // Yesterday - continue streak
                newStreak = (prev.currentStreak || 0) + 1;
              } else {
                // More than 1 day - reset streak
                newStreak = 1;
              }
            } else {
              // First workout
              newStreak = 1;
            }
            
            if (newStreak > longestStreak) {
              longestStreak = newStreak;
            }
            
            // Update workout counts by month
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const workoutCountsByMonth = {
              ...(prev.workoutCountsByMonth || {}),
              [monthKey]: ((prev.workoutCountsByMonth || {})[monthKey] || 0) + 1
            };
            
            // Update favorite exercises
            const exerciseCounts = new Map(prev.favoriteExercises?.map(e => [e.name, e.count]) || []);
            exercises.forEach(ex => {
              const currentCount = exerciseCounts.get(ex.exerciseName) || 0;
              exerciseCounts.set(ex.exerciseName, currentCount + 1);
            });
            const favoriteExercises = Array.from(exerciseCounts.entries())
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 20); // Keep top 20
            
            return {
              ...prev,
              totalWorkouts: (prev.totalWorkouts || 0) + 1,
              currentStreak: newStreak,
              longestStreak,
              totalVolume: (prev.totalVolume || 0) + Math.round(totalVolume),
              lastWorkoutDate: now.toISOString(),
              workoutCountsByMonth,
              favoriteExercises
            };
          });
        } catch (e) {
          console.error('Failed to save workout history:', e);
        }
      }
    }
    
    setWorkoutStartAt(null);
    setCurrentPlanIdx(0);
    setIsPaused(false);
    setPausedAt(null);
    // Clear current workout progress (keep history)
    setSetProgress({});
    setAdditionalExercises([]);
    // Clear pause state from localStorage
    try {
      localStorage.removeItem(PAUSE_KEY);
    } catch(_) {}
    console.log('Workout ended - state cleared');
  }, [workoutStartAt, workoutPlan, additionalExercises, setProgress]);

  // Compute workout active state - always returns boolean
  const isWorkoutActive = workoutStartAt !== null;

  const saveCustomProgram = useCallback((programId, programData) => {
    setCustomPrograms((prev) => ({ ...prev, [programId]: JSON.parse(JSON.stringify(programData)) }));
  }, []);

  const resetCustomProgram = useCallback((programId) => {
    setCustomPrograms((prev) => {
      if (!prev[programId]) return prev;
      const next = { ...prev };
      delete next[programId];
      return next;
    });
  }, []);

  const saveCustomWorkoutTemplate = useCallback((workout) => {
    setSavedWorkouts((prev) => {
      const next = [...prev];
      const now = new Date().toISOString();
      if (workout.id) {
        const idx = next.findIndex((item) => item.id === workout.id);
        if (idx !== -1) {
          next[idx] = { ...next[idx], ...workout, updatedAt: now };
        } else {
          next.unshift({ ...workout, id: workout.id, createdAt: now, updatedAt: now });
        }
      } else {
        const id = `cw-${Date.now()}`;
        next.unshift({ ...workout, id, createdAt: now, updatedAt: now });
      }
      return next.slice(0, 50);
    });
  }, []);

  const deleteCustomWorkoutTemplate = useCallback((workoutId) => {
    setSavedWorkouts((prev) => prev.filter((item) => item.id !== workoutId));
  }, []);

  const getSavedWorkoutById = useCallback((workoutId) => savedWorkouts.find((item) => item.id === workoutId) || null, [savedWorkouts]);

  const startWorkoutFromTemplate = useCallback((workoutId) => {
    const template = savedWorkouts.find((item) => item.id === workoutId);
    if (!template) return false;
    const plan = buildPlanFromTemplate(template);
    if (!plan.length) return false;
    setWorkoutPlan(plan);
    return true;
  }, [savedWorkouts, buildPlanFromTemplate]);

  // Export functions
  const exportHistory = useCallback(() => {
    return exportFullHistory(history);
  }, [history]);

  const getRetentionInfo = useCallback(() => {
    return getRetentionStats();
  }, []);

  // Expose helpers
  const value = useMemo(() => ({
    logs, addLog,
    currentExercise, setCurrentExercise,
    updateFromCommand,
    setWorkoutPlan,
    workoutPlan,
    completedExercises, setCompletedExercises,
    additionalExercises, setAdditionalExercises,
    markSetComplete,
    markExerciseComplete,
    addAdditionalExercise,
    updateAdditionalExercise,
    removeAdditionalExercise,
    // New set tracking helpers
    setProgress,
    getCurrentSetNum,
    logSetCompletion,
    currentPlanIdx,
    setCurrentPlanIdx,
    nextExerciseIdx,
    workoutStartAt,
    setWorkoutStartAt,
    prefs,
    setPrefs,
    // User profile & stats
    userProfile,
    setUserProfile,
    userStats,
    updateUserProfile: useCallback((updates) => {
      setUserProfile(prev => ({ ...prev, ...updates }));
    }, []),
    isOnline,
    history,
    // Program selection
    selectedProgramId,
    selectProgram,
    getProgramDefinition,
    getBaseProgram,
    customPrograms,
    saveCustomProgram,
    resetCustomProgram,
    // Paused global
    isPaused,
    pauseWorkout,
    resumeWorkout,
    getElapsedMs,
    // Workout active state
    isWorkoutActive,
    endWorkout,
    customPrograms,
    savedWorkouts,
    saveCustomWorkoutTemplate,
    deleteCustomWorkoutTemplate,
    getSavedWorkoutById,
    startWorkoutFromTemplate,
    buildPlanFromTemplate,
    // Data retention
    exportHistory,
    getRetentionInfo,
  }), [logs, currentExercise, updateFromCommand, workoutPlan, completedExercises, additionalExercises, setProgress, currentPlanIdx, workoutStartAt, prefs, userProfile, userStats, isOnline, history, isPaused, pauseWorkout, resumeWorkout, getElapsedMs, selectedProgramId, selectProgram, getCurrentDayIndex, endWorkout, getProgramDefinition, getBaseProgram, customPrograms, saveCustomProgram, resetCustomProgram, savedWorkouts, saveCustomWorkoutTemplate, deleteCustomWorkoutTemplate, getSavedWorkoutById, startWorkoutFromTemplate, buildPlanFromTemplate, exportHistory, getRetentionInfo, updateAdditionalExercise, removeAdditionalExercise]);

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}


