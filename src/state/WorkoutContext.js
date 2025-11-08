import React, { createContext, useContext, useMemo, useState } from 'react';
import { useCallback, useEffect } from 'react';
import { WORKOUT_PROGRAMS } from '../data/workoutPrograms';

const WorkoutContext = createContext(null);

const PLAN_KEY = 'pulsePlan';
const PROGRESS_KEY = 'pulseSetProgress';
const PREFS_KEY = 'pulsePrefs';
const QUEUE_KEY = 'pulseOfflineQueue';
const PAUSE_KEY = 'pulsePaused';
const HISTORY_KEY = 'pulseHistory';
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

  // Calculate current day based on start date
  const getCurrentDayIndex = useCallback(() => {
    if (!selectedProgramId || !programStartDate) return 0;
    const program = WORKOUT_PROGRAMS.find(p => p.id === selectedProgramId);
    if (!program) return 0;
    
    const start = new Date(programStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    
    const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    return daysSinceStart % program.days.length;
  }, [selectedProgramId, programStartDate]);

  // Update workout plan when program day changes
  useEffect(() => {
    if (!selectedProgramId) return;
    
    const program = WORKOUT_PROGRAMS.find(p => p.id === selectedProgramId);
    if (!program) return;
    
    const dayIndex = getCurrentDayIndex();
    const currentDay = program.days[dayIndex];
    
    if (currentDay) {
      setWorkoutPlan(currentDay.exercises);
      console.log(`Updated workout plan for ${program.name} - Day ${dayIndex + 1}: ${currentDay.name}`);
    }
  }, [selectedProgramId, programStartDate, getCurrentDayIndex]);

  const selectProgram = useCallback((program) => {
    setSelectedProgramId(program.id);
    setProgramStartDate(new Date().toISOString());
    const dayIndex = 0; // Start with first day
    setWorkoutPlan(program.days[dayIndex].exercises);
    try {
      localStorage.setItem(PROGRAM_KEY, program.id);
      localStorage.setItem(PROGRAM_START_DATE_KEY, new Date().toISOString());
    } catch(_) {}
  }, []);

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

  const endWorkout = useCallback(() => {
    setWorkoutStartAt(null);
    setCurrentPlanIdx(0);
    setIsPaused(false);
    setPausedAt(null);
    // Clear current workout progress (keep history)
    setSetProgress({});
    // Clear pause state from localStorage
    try {
      localStorage.removeItem(PAUSE_KEY);
    } catch(_) {}
    console.log('Workout ended - state cleared');
  }, []);

  // Compute workout active state - always returns boolean
  const isWorkoutActive = workoutStartAt !== null;

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
    isOnline,
    history,
    // Program selection
    selectedProgramId,
    selectProgram,
    getCurrentDayIndex,
    // Paused global
    isPaused,
    pauseWorkout,
    resumeWorkout,
    getElapsedMs,
    // Workout active state
    isWorkoutActive,
    endWorkout,
  }), [logs, currentExercise, updateFromCommand, workoutPlan, completedExercises, additionalExercises, setProgress, currentPlanIdx, workoutStartAt, prefs, isOnline, history, isPaused, pauseWorkout, resumeWorkout, getElapsedMs, selectedProgramId, selectProgram, getCurrentDayIndex, endWorkout]);

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}


