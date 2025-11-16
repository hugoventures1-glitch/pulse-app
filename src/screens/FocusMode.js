import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createRecognizer, attachPressHold, isSpeechSupported } from '../lib/speech';
import { parseCommand } from '../lib/parseCommands';
import { useWorkout } from '../state/WorkoutContext';
import { parseWorkoutWithClaude } from '../lib/claude';
import { FLAT_EXERCISES, EXERCISE_ALIAS_MAP, getAllExercises, getExerciseAliasMap } from '../data/exerciseLibrary';
import { getCustomExercises, autoSaveExerciseFromVoice, exerciseExists } from '../utils/customExercises';
import { findBestMatch } from '../utils/fuzzyMatch';
import { checkForNewPR, getPRSettings } from '../utils/personalRecords';
import PRCelebration from '../components/PRCelebration';

const PROMPT = `You are a workout logging assistant. Parse this voice input and extract workout data.\n\nUser said: [transcribed text]\n\nCommon speech-to-text errors to fix:\n- 'revs' → reps\n- 'wraps' → reps\n- 'sets' might be 'sits'\n- 'kilograms' might be 'kilos', 'kg', 'kgs'\n- Exercise names might be misspelled\n\nReturn ONLY a JSON object (no markdown, no explanation):\n{\n  "exercise": "exercise name",\n  "weight": number in kg,\n  "reps": number,\n  "sets": number (default 1 if not mentioned)\n}\n\nIf you cannot parse it, return: {"error": "Could not understand, please try again"}`;

// Normalize spoken numbers in transcript (fixes speech-to-text errors)
function normalizeSpokenNumbers(transcript) {
  if (!transcript) return transcript;
  
  let normalized = transcript;
  
  // Map of spoken number words/variations to actual numbers
  // Using word boundaries to avoid partial matches (e.g., "forty" shouldn't become "4ty")
  const numberMap = {
    // 1
    '\\bwon\\b': '1',
    '\\bone\\b': '1',
    // 2
    '\\bto\\b': '2',
    '\\btoo\\b': '2',
    '\\btwo\\b': '2',
    // 3
    '\\bthree\\b': '3',
    // 4
    '\\bfor\\b': '4',
    '\\bfour\\b': '4',
    // 5
    '\\bfive\\b': '5',
    // 6
    '\\bsix\\b': '6',
    // 7
    '\\bseven\\b': '7',
    // 8
    '\\bate\\b': '8',
    '\\beight\\b': '8',
    // 9
    '\\bnine\\b': '9',
  };
  
  // Apply all replacements
  Object.entries(numberMap).forEach(([pattern, replacement]) => {
    const regex = new RegExp(pattern, 'gi');
    normalized = normalized.replace(regex, replacement);
  });
  
  return normalized;
}

// Exercise detection function with fuzzy matching - finds exercise names in transcription
// isQuickStartMode: if true, allows matching against unknown exercises and auto-saving
function findExerciseInText(transcription, workoutExercises, allExercises, exerciseAliasMap, isQuickStartMode = false) {
  if (!transcription || typeof transcription !== 'string') return null;
  
  const text = transcription.toLowerCase().trim();
  
  // For non-Quick Start modes, use a higher threshold for more restrictive matching
  const fuzzyThreshold = isQuickStartMode ? 0.3 : 0.5;
  
  // STEP 1: Check workout exercises first (priority)
  let bestWorkoutMatch = null;
  let bestWorkoutScore = 0;
  
  for (let i = 0; i < workoutExercises.length; i++) {
    const ex = workoutExercises[i];
    const name = (typeof ex === 'string' ? ex : ex?.name) || '';
    if (!name) continue;
    
    const matchedExercise = findBestMatch(text, [{ name, aliases: [] }], fuzzyThreshold);
    if (matchedExercise) {
      const score = 1.0; // Workout exercises get highest priority
      if (score > bestWorkoutScore) {
        bestWorkoutScore = score;
        bestWorkoutMatch = { name, inWorkout: true, index: i, score };
      }
    }
  }
  
  if (bestWorkoutMatch) {
    return bestWorkoutMatch;
  }
  
  // STEP 2: Check full library (core + custom) using fuzzy matching
  // In non-Quick Start modes, this only matches against existing exercises
  const matchedExercise = findBestMatch(text, allExercises, fuzzyThreshold);
  
  if (matchedExercise) {
    // Check if this exercise is in the workout
    const inWorkoutIdx = workoutExercises.findIndex(ex => {
      const name = (typeof ex === 'string' ? ex : ex?.name) || '';
      return name.toLowerCase() === matchedExercise.name.toLowerCase();
    });
    
    if (inWorkoutIdx !== -1) {
      return { name: matchedExercise.name, inWorkout: true, index: inWorkoutIdx, score: 0.8 };
    } else {
      // Only return library exercises (not in workout) in Quick Start mode
      // In other modes, only allow exercises that are already in the library
      if (isQuickStartMode || exerciseExists(matchedExercise.name)) {
        return { name: matchedExercise.name, inWorkout: false, score: 0.8 };
      }
    }
  }
  
  // In non-Quick Start modes, don't return unknown exercises
  return null;
}

export default function FocusMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const isQuickStart = location.state?.mode === 'quick';
  const { addLog, workoutPlan, getCurrentSetNum, logSetCompletion, setProgress, markExerciseComplete, addAdditionalExercise, additionalExercises, currentPlanIdx, setCurrentPlanIdx, nextExerciseIdx, isOnline, isPaused, pauseWorkout, resumeWorkout, endWorkout, prefs, workoutStartAt, updateAdditionalExercise, removeAdditionalExercise } = useWorkout();
  
  // Load custom exercises and merge with core library
  const customExercises = useMemo(() => getCustomExercises(), []);
  const allExercises = useMemo(() => getAllExercises(customExercises), [customExercises]);
  const exerciseAliasMap = useMemo(() => getExerciseAliasMap(customExercises), [customExercises]);
  
  // Rest timer state
  const [restVisible, setRestVisible] = useState(false);
  const [restDuration, setRestDuration] = useState(90); // default seconds
  const [restRemaining, setRestRemaining] = useState(90);
  const restTimerRef = useRef(null);
  // Celebration states
  const [celebrateSet, setCelebrateSet] = useState(false);
  const [celebrateComplete, setCelebrateComplete] = useState(false);
  const [confetti, setConfetti] = useState([]);

  function playSuccessTone() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.27);
    } catch(_) {}
  }

  // Minimal speech function for debugging
  function speakMessage(message) {
    try {
      if (!window || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(message);
      utterance.volume = 1.0;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch(e) { 
      // Speech synthesis failed silently
    }
  }

  function startRest(seconds, nextLabel) {
    const total = seconds || restDuration;
    setRestDuration(total);
    setRestRemaining(total);
    setRestVisible(true);
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    restTimerRef.current = setInterval(() => {
      if (isPaused) return; // don't tick while paused
      setRestRemaining(prev => {
        if (prev <= 1) {
          clearInterval(restTimerRef.current);
          restTimerRef.current = null;
          setTimeout(() => {
            speakMessage('Set logged'); // keep minimal for consistency
            // Auto-dismiss after 2s
            setTimeout(() => setRestVisible(false), 2000);
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopRest() {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    restTimerRef.current = null;
    setRestVisible(false);
  }

  // Prevent body scrolling when on focus screen
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
    };
  }, []);

  useEffect(() => {
    const preferred = Number(prefs?.restDuration);
    if (!preferred || preferred <= 0) return;
    if (restVisible) return; // don't override active countdown
    setRestDuration(preferred);
    setRestRemaining(preferred);
  }, [prefs?.restDuration, restVisible]);

  // On resume, if rest panel is open, restart countdown
  useEffect(() => {
    if (!isPaused && restVisible && restRemaining > 0 && !restTimerRef.current) {
      startRest(restRemaining);
    }
    if (isPaused && restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
  }, [isPaused]);

  const [listening, setListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false); // Loading state for voice processing
  const [aiParsed, setAiParsed] = useState(null);
  const recRef = useRef(null);
  const ctrlRef = useRef(null);
  const [error, setError] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [pendingEditValues, setPendingEditValues] = useState(null);
  const [pendingEditMode, setPendingEditMode] = useState(false);
  const [recentLog, setRecentLog] = useState(null);
  const [pendingExerciseAdd, setPendingExerciseAdd] = useState(null); // { name, transcription, context }
  const [detectedExercise, setDetectedExercise] = useState(null); // Store detected exercise for logging
  const [showExerciseNav, setShowExerciseNav] = useState(false); // Exercise navigation bottom sheet
  const [exerciseTransitionKey, setExerciseTransitionKey] = useState(0); // Key for smooth exercise transitions
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null); // Index of exercise being edited
  const [editingExerciseValues, setEditingExerciseValues] = useState(null); // { weight, reps, sets, name }
  const [currentPR, setCurrentPR] = useState(null); // Current PR celebration data
  const pendingTimeoutRef = useRef(null);
  const recentToastRef = useRef(null);
  const lastLoggedSetRef = useRef(null);
  const quickDurations = useMemo(() => {
    const base = [60, 90, 120, 180];
    const pref = Number(prefs?.restDuration);
    if (pref && !base.includes(pref)) {
      return [...base, pref].sort((a, b) => a - b);
    }
    return base;
  }, [prefs?.restDuration]);
  
  // Store callbacks and values in a ref to avoid re-renders
  const callbacksRef = useRef({
    addLog,
    isQuickStart,
    workoutPlan,
    setProgress,
    logSetCompletion,
    markExerciseComplete,
    addAdditionalExercise,
    additionalExercises,
    nextExerciseIdx,
    setCurrentPlanIdx,
    navigate,
    restDuration,
    startRest,
    currentPlanIdx,
    lastLoggedSet: lastLoggedSetRef,
  });
  
  // Update ref when values change (but don't trigger re-render)
  useEffect(() => {
    callbacksRef.current = {
      addLog,
      isQuickStart,
      workoutPlan,
      setProgress,
      logSetCompletion,
      markExerciseComplete,
      addAdditionalExercise,
      additionalExercises,
      nextExerciseIdx,
      setCurrentPlanIdx,
      navigate,
      restDuration,
      startRest,
      currentPlanIdx,
      lastLoggedSet: lastLoggedSetRef,
    };
  }, [addLog, isQuickStart, workoutPlan, setProgress, logSetCompletion, markExerciseComplete, addAdditionalExercise, additionalExercises, nextExerciseIdx, setCurrentPlanIdx, navigate, restDuration, startRest, currentPlanIdx]);

  // Initialize speech recognition once on mount
  useEffect(() => {
    if (!isSpeechSupported()) {
      return;
    }
    const rec = createRecognizer({ lang: 'en-US' });
    recRef.current = rec;

    const ctl = attachPressHold(rec, {
      onTranscript: async (t) => {
        const callbacks = callbacksRef.current;
        const normalizedTranscript = normalizeSpokenNumbers(t);

        callbacks.addLog(normalizedTranscript);
        setAiParsed(null);
        setError('');
        setDetectedExercise(null);
        setIsProcessingVoice(true); // Start loading
        
        try {
          const currentEx = callbacks.workoutPlan[callbacks.currentPlanIdx] || null;
          const workoutExerciseNames = callbacks.workoutPlan.map(ex => ex);
          
          // STEP 1: Check for navigation commands FIRST (skip, next exercise)
          const text = normalizedTranscript.toLowerCase().trim();
          const normalizedText = ` ${text} `;
          
          // Detect skip/next commands - check for exact phrases first
          const skipSetCommands = /\b(skip set|skip this set|next set)\b/i;
          const skipExerciseCommands = /\b(skip exercise|skip this exercise|next exercise|go to next|move to next)\b/i;
          const simpleSkipCommands = /^(skip|next)$/i.test(text) || /\b(skip this|next one|skip it)\b/i.test(text);
          
          if (skipSetCommands.test(normalizedText)) {
            // "Skip set" - skip current exercise entirely
            const currentEx = callbacks.workoutPlan[callbacks.currentPlanIdx] || null;
            if (!currentEx) {
              setError('No exercise to skip');
              setIsProcessingVoice(false);
              return;
            }
            
            // Move to next exercise
            const nextIdx = callbacks.currentPlanIdx + 1;
            if (nextIdx < callbacks.workoutPlan.length) {
              callbacks.setCurrentPlanIdx(nextIdx);
              setExerciseTransitionKey(prev => prev + 1); // Trigger transition animation
              const nextEx = callbacks.workoutPlan[nextIdx];
              speakMessage(`Skipped to ${nextEx.name}`);
              setError('');
            } else {
              speakMessage('No more exercises in workout');
              setError('Last exercise in workout');
            }
            setIsProcessingVoice(false);
            return; // Don't parse as workout data
          } else if (skipExerciseCommands.test(normalizedText) || simpleSkipCommands) {
            // "Skip" or "Next" or "Next exercise" - move to next exercise
            const currentEx = callbacks.workoutPlan[callbacks.currentPlanIdx] || null;
            if (!currentEx) {
              setError('No exercise to skip');
              setIsProcessingVoice(false);
              return;
            }
            
            // Move to next exercise
            const nextIdx = callbacks.currentPlanIdx + 1;
            if (nextIdx < callbacks.workoutPlan.length) {
              callbacks.setCurrentPlanIdx(nextIdx);
              setExerciseTransitionKey(prev => prev + 1); // Trigger transition animation
              const nextEx = callbacks.workoutPlan[nextIdx];
              speakMessage(`Switched to ${nextEx.name}`);
              setError('');
            } else {
              speakMessage('No more exercises in workout');
              setError('Last exercise in workout');
            }
            setIsProcessingVoice(false);
            return; // Don't parse as workout data
          }
          
          // STEP 2: Detect exercise in transcription BEFORE parsing
          // Pass isQuickStart mode to control whether unknown exercises can be detected
          const detected = findExerciseInText(
            normalizedTranscript,
            workoutExerciseNames,
            allExercises,
            exerciseAliasMap,
            callbacks.isQuickStart // Only allow new exercise detection in Quick Start mode
          );
          
          // STEP 3: Handle detected exercise based on mode and workout status
          if (detected) {
            const currentExerciseName = currentEx?.name || null;
            const isDifferentExercise = currentExerciseName && 
              detected.name.toLowerCase() !== currentExerciseName.toLowerCase();
            
            if (detected.inWorkout && detected.index !== undefined) {
              // Exercise is in workout
              if (isDifferentExercise) {
                // Switch to detected exercise
                callbacks.setCurrentPlanIdx(detected.index);
                setExerciseTransitionKey(prev => prev + 1); // Trigger smooth transition
                speakMessage(`Switched to ${detected.name}`);
                setDetectedExercise(detected.name);
              }
              // Continue with parsing using detected exercise...
            } else {
              // Exercise NOT in workout - found in library
              // Only show add modal in Quick Start mode
              if (callbacks.isQuickStart) {
                // Auto-save to custom exercises if it doesn't exist (Quick Start only)
                if (!exerciseExists(detected.name)) {
                  autoSaveExerciseFromVoice(detected.name);
                }
                
                // Show add modal for Quick Start mode
                setPendingExerciseAdd({
                  exerciseName: detected.name,
                  transcription: normalizedTranscript,
                  isQuickStart: true,
                  currentContext: {
            currentExercise: currentEx?.name || null,
            lastWeight: null,
            lastReps: null,
            targetWeight: currentEx?.weight || null,
            targetReps: currentEx?.reps || null
                  }
                });
                setIsProcessingVoice(false); // Clear loading while waiting for confirmation
                // Don't proceed with parsing - wait for user to confirm
                return;
              } else {
                // In non-Quick Start modes, ignore exercises not in the workout plan
                setError(`Exercise "${detected.name}" is not in this workout. Please use an exercise from your workout plan.`);
                speakMessage('Exercise not in workout');
                setIsProcessingVoice(false);
                return;
              }
            }
          } else {
            // No exercise detected in transcription
            // In non-Quick Start modes, require a valid exercise from the workout plan
            if (!callbacks.isQuickStart) {
              // Check if transcription looks like it contains an exercise name
              const exerciseKeywords = /(bench|squat|deadlift|press|curl|row|pull|push|fly|raise|extension|dip|crunch|plank|lung|lateral|tricep|bicep|shoulder|chest|back|leg|arm|core)/i;
              const mightContainExercise = exerciseKeywords.test(normalizedTranscript);
              
              if (mightContainExercise) {
                setError('Exercise not recognized. Please use an exercise from your workout plan.');
                speakMessage('Exercise not in workout');
                setIsProcessingVoice(false);
                return;
              }
              
              // No exercise mentioned - use current exercise (only if in regular mode)
              if (!currentEx) {
                setError('No exercise active. Please specify an exercise name from your workout plan.');
                setIsProcessingVoice(false);
                return;
              }
            }
            // In Quick Start mode, continue processing even if no exercise detected
            // (will be handled by Claude parsing)
          }
          
          // STEP 4: Build context for parsing
          // Use detected exercise if found, otherwise use current
          const exerciseForParsing = detected && detected.inWorkout && detected.index !== undefined
            ? callbacks.workoutPlan[detected.index]
            : currentEx;
          
          const exerciseNameForParsing = detected?.name || exerciseForParsing?.name || null;
          
          // In Quick Start mode, if no exercise detected and no current, show error
          if (callbacks.isQuickStart && !exerciseNameForParsing) {
            setError('Could not identify exercise. Please say the exercise name clearly.');
            setIsProcessingVoice(false);
            return;
          }
          
          // Check if this is the first set of the exercise
          const exerciseProgress = exerciseNameForParsing && callbacks.setProgress?.[exerciseNameForParsing];
          const loggedSets = exerciseProgress?.values || [];
          const isFirstSet = loggedSets.length === 0;

          // Also check Quick Start mode - check if exercise exists in additionalExercises
          let isFirstSetQuickStart = false;
          if (callbacks.isQuickStart && exerciseNameForParsing) {
            const existingExercise = callbacks.additionalExercises?.find(
              ex => ex.name?.toLowerCase() === exerciseNameForParsing.toLowerCase()
            );
            isFirstSetQuickStart = !existingExercise;
          }

          const context = {
            currentExercise: exerciseNameForParsing,
            lastWeight: null,
            lastReps: null,
            targetWeight: exerciseForParsing?.weight || null,
            targetReps: exerciseForParsing?.reps || null,
            isFirstSet: isFirstSet || (callbacks.isQuickStart && isFirstSetQuickStart)
          };

          if (exerciseProgress && loggedSets.length > 0) {
            const lastSet = loggedSets[loggedSets.length - 1];
              context.lastWeight = lastSet.weight || null;
              context.lastReps = lastSet.reps || null;
          } else if (callbacks.isQuickStart && exerciseNameForParsing) {
            // For Quick Start, check additionalExercises for last logged set of this exercise
            const exerciseLogs = callbacks.additionalExercises?.filter(
              ex => ex.name?.toLowerCase() === exerciseNameForParsing.toLowerCase()
            ) || [];
            if (exerciseLogs.length > 0) {
              const lastExerciseLog = exerciseLogs[exerciseLogs.length - 1];
              context.lastWeight = lastExerciseLog.weight || null;
              context.lastReps = lastExerciseLog.reps || null;
            }
          }

          // STEP 5: Parse weight/reps with Claude
          const result = await parseWorkoutWithClaude(normalizedTranscript, {
            ...context,
            lastLoggedSet: callbacks.lastLoggedSet?.current || null,
          });
          
          if (result.error) {
            setError(result.error);
            setIsProcessingVoice(false);
            return;
          }

          // CRITICAL: Override exercise name with detected exercise if found
          // This ensures we log to the correct exercise, not the one Claude might return
          if (detected && detected.name) {
            result.exercise = detected.name;
          } else if (exerciseNameForParsing) {
            // Use the exercise we determined, not what Claude might return
            result.exercise = exerciseNameForParsing;
          } else if (result.exercise && !exerciseExists(result.exercise)) {
            // Claude extracted an exercise name that doesn't exist
            // Only auto-save in Quick Start mode
            if (callbacks.isQuickStart) {
              autoSaveExerciseFromVoice(result.exercise);
            } else {
              // In non-Quick Start modes, reject unknown exercises
              setError(`Exercise "${result.exercise}" is not recognized. Please use an exercise from your workout plan.`);
              setIsProcessingVoice(false);
              return;
            }
          }

          setAiParsed(result);

          const needsConfirmation = result.needsConfirmation && result.needsConfirmation.length > 0;
          if (needsConfirmation) {
            setPendingConfirmation({ result, isQuickStart: callbacks.isQuickStart });
            setPendingEditValues({
              reps: result.reps || '',
              weight: result.isBodyweight ? 'bodyweight' : (result.weight ?? ''),
            });
            setPendingEditMode(false);
            setIsProcessingVoice(false); // Clear loading while waiting for confirmation
            if (needsConfirmation) {
              const reasons = (result.needsConfirmation || []).join(', ');
              setError('Need confirmation: ' + reasons.replace(/_/g, ' '));
            }
            speakMessage('Please confirm');
            return;
          }

          handleConfirmedResult(result);
          setIsProcessingVoice(false); // Clear loading

        } catch (e) {
          setError("AI parsing failed, try again");
          setAiParsed(null);
          setIsProcessingVoice(false); // Clear loading on error
        } finally {
          setIsProcessingVoice(false); // Ensure loading is cleared
        }
      },
      onStart: () => {
        setListening(true);
      },
      onEnd: () => {
        setListening(false);
      },
      onError: () => {
        setListening(false);
      }
    });
    ctrlRef.current = ctl;

    return () => {
      try {
        recRef.current?.stop();
      } catch (_) {}
    };
  }, []); // Empty dependency array - only run on mount/unmount

  const handleConfirmedResult = (result) => {
    const callbacks = callbacksRef.current;
    
    // Check for Personal Record BEFORE logging
    let detectedPR = null;
    if (result.exercise && result.weight && result.reps && !result.isBodyweight) {
      const prSettings = getPRSettings();
      
      if (prSettings.notificationsEnabled) {
        detectedPR = checkForNewPR(
          result.exercise,
          result.weight,
          result.reps,
          result.unit || 'kg'
        );
      }
    }

    // Show PR celebration if detected
    if (detectedPR && detectedPR.isNewPR) {
      setCurrentPR(detectedPR);
    }

    if (callbacks.isQuickStart) {
      if (result.exercise) {
        callbacks.addAdditionalExercise({ ...result, complete: true });
        speakMessage('Logged');
        setCelebrateSet(true); playSuccessTone();
        setTimeout(()=> setCelebrateSet(false), 700);
        callbacks.startRest(callbacks.restDuration, result.exercise);
      }
    } else {
      const planNames = callbacks.workoutPlan.map(e => e.name.toLowerCase());
      const idx = planNames.indexOf((result.exercise||'').toLowerCase());
      if (idx !== -1) {
        const exName = callbacks.workoutPlan[idx].name;
        const setsInPlan = callbacks.workoutPlan[idx].sets || 1;
        const prevProgress = (callbacks.setProgress?.[exName]?.progress || 0);
        const nextProgress = Math.min(prevProgress + 1, setsInPlan);
        callbacks.logSetCompletion({ exercise: exName, reps: result.reps || 0, weight: result.isBodyweight ? 0 : (result.weight ?? 0), sets: setsInPlan });
        speakMessage('Logged');
        callbacks.startRest(callbacks.restDuration, exName);
        setCelebrateSet(true); playSuccessTone();
        setTimeout(()=> setCelebrateSet(false), 700);
        if (nextProgress >= setsInPlan) {
          callbacks.markExerciseComplete(exName, setsInPlan);
          const nextEx = callbacks.workoutPlan[idx + 1]?.name;
          setCelebrateComplete(true);
          const parts = Array.from({length: 24}).map((_,i)=>({
            id: i,
            color: ['#22c55e','#7c3aed','#06b6d4','#f59e0b'][i%4],
            dx: (Math.random()*160-80)+ 'px',
            dy: (Math.random()*-140-40)+ 'px'
          }));
          setConfetti(parts);
          setTimeout(()=>{ setCelebrateComplete(false); setConfetti([]); }, 1200);
          setTimeout(() => {
            callbacks.nextExerciseIdx();
            if (!nextEx) {
              callbacks.navigate('/summary');
            }
          }, 900);
        }
      } else if(result.exercise) {
        callbacks.addAdditionalExercise({ ...result, complete: true });
      }
    }

    setPendingConfirmation(null);
    setPendingEditValues(null);
    setError('');

    const summaryWeight = result.isBodyweight ? 'bodyweight' : `${result.weight ?? '?'} kg`;
    setRecentLog({
      exercise: result.exercise,
      reps: result.reps ?? '?',
      weight: summaryWeight,
    });
    if (recentToastRef.current) clearTimeout(recentToastRef.current);
    recentToastRef.current = setTimeout(() => setRecentLog(null), 2000);

    if (result.exercise) {
      lastLoggedSetRef.current = {
        exercise: result.exercise,
        weight: result.isBodyweight ? 0 : (result.weight ?? 0),
        reps: result.reps ?? 0,
      };
      console.log('Updated lastLoggedSet', lastLoggedSetRef.current);
    }
  };

  const handleConfirmPending = () => {
    if (!pendingConfirmation) return;
    const confirmedResult = {
      ...pendingConfirmation.result,
      reps: pendingEditValues?.reps ? Number(pendingEditValues.reps) : pendingConfirmation.result.reps,
      weight: pendingConfirmation.result.isBodyweight
        ? 0
        : pendingEditValues?.weight === 'bodyweight'
          ? 0
          : (pendingEditValues?.weight !== undefined && pendingEditValues?.weight !== null && pendingEditValues?.weight !== ''
            ? Number(pendingEditValues.weight) : pendingConfirmation.result.weight),
    };
    handleConfirmedResult(confirmedResult);
  };

  const handleNumberInput = (value) => {
    if (value === '') return '';
    const cleaned = value.replace(/^0+/, '');
    return cleaned === '' ? '' : parseInt(cleaned, 10);
  };

  const handleEditPending = (field, value) => {
    if (field === 'reps' || field === 'weight') {
      const processed = handleNumberInput(value);
      setPendingEditValues((prev) => ({ ...prev, [field]: processed }));
    } else {
    setPendingEditValues((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleCancelPending = () => {
    setPendingConfirmation(null);
    setPendingEditValues(null);
    setPendingEditMode(false);
    setError('Could not confirm. Please repeat the command.');
  };

  const handleConfirmAddExercise = async () => {
    if (!pendingExerciseAdd) return;
    
    const callbacks = callbacksRef.current;
    const { exerciseName, transcription, currentContext, isQuickStart } = pendingExerciseAdd;
    
    // Check if this is the first set of this exercise
    let isFirstSet = true;
    let lastWeight = null;
    let lastReps = null;
    
    if (isQuickStart && callbacks.additionalExercises) {
      // For Quick Start, check if exercise exists in additionalExercises
      const exerciseLogs = callbacks.additionalExercises.filter(
        ex => ex.name?.toLowerCase() === exerciseName.toLowerCase()
      );
      if (exerciseLogs.length > 0) {
        isFirstSet = false;
        const lastLog = exerciseLogs[exerciseLogs.length - 1];
        lastWeight = lastLog.weight || null;
        lastReps = lastLog.reps || null;
      }
    } else if (callbacks.setProgress?.[exerciseName]) {
      // For regular mode, check setProgress
      const loggedSets = callbacks.setProgress[exerciseName].values || [];
      if (loggedSets.length > 0) {
        isFirstSet = false;
        const lastSet = loggedSets[loggedSets.length - 1];
        lastWeight = lastSet.weight || null;
        lastReps = lastSet.reps || null;
      }
    }
    
    // Now parse the transcription for weight/reps
    const context = {
      ...currentContext,
      currentExercise: exerciseName,
      lastWeight,
      lastReps,
      isFirstSet,
      lastLoggedSet: callbacks.lastLoggedSet?.current || null,
    };
    
    try {
      const result = await parseWorkoutWithClaude(transcription, context);
      if (result.error) {
        setError(result.error);
        setPendingExerciseAdd(null);
        return;
      }
      
      // CRITICAL: Override with detected exercise name
      result.exercise = exerciseName;
      
      // Add exercise to workout plan (as additional exercise) with parsed data
      if (isQuickStart) {
        // In Quick Start, add with the parsed weight/reps
        callbacks.addAdditionalExercise({ 
          ...result, 
          complete: true 
        });
      } else {
        // In regular mode, add as additional exercise
        callbacks.addAdditionalExercise({ 
          name: exerciseName, 
          sets: result.sets || 1, 
          reps: result.reps || 0, 
          weight: result.isBodyweight ? 0 : (result.weight || 0), 
          complete: true 
        });
        
        // Log the set
        callbacks.logSetCompletion({ 
          exercise: exerciseName, 
          reps: result.reps || 0, 
          weight: result.isBodyweight ? 0 : (result.weight ?? 0), 
          sets: result.sets || 1 
        });
      }
      
      // Check for PR before logging
      let detectedPR = null;
      if (exerciseName && result.weight && result.reps && !result.isBodyweight) {
        const prSettings = getPRSettings();
        if (prSettings.notificationsEnabled) {
          detectedPR = checkForNewPR(
            exerciseName,
            result.weight,
            result.reps,
            result.unit || 'kg'
          );
        }
      }
      
      // Show PR celebration if detected
      if (detectedPR && detectedPR.isNewPR) {
        setCurrentPR(detectedPR);
      }
      
      // Show celebration
      speakMessage('Logged');
      setCelebrateSet(true); 
      playSuccessTone();
      setTimeout(() => setCelebrateSet(false), 700);
      
      // Start rest timer
      if (isQuickStart) {
        callbacks.startRest(callbacks.restDuration, exerciseName);
      }
      
      // Update recent log
      const summaryWeight = result.isBodyweight ? 'bodyweight' : `${result.weight ?? '?'} kg`;
      setRecentLog({
        exercise: exerciseName,
        reps: result.reps ?? '?',
        weight: summaryWeight,
      });
      if (recentToastRef.current) clearTimeout(recentToastRef.current);
      recentToastRef.current = setTimeout(() => setRecentLog(null), 2000);
      
      // Update last logged set
      if (exerciseName) {
        lastLoggedSetRef.current = {
          exercise: exerciseName,
          weight: result.isBodyweight ? 0 : (result.weight ?? 0),
          reps: result.reps ?? 0,
        };
      }
      
    } catch (e) {
      setError("AI parsing failed, try again");
    }
    
    setPendingExerciseAdd(null);
  };

  const handleCancelAddExercise = () => {
    setPendingExerciseAdd(null);
    setError('Cancelled. Please repeat the command.');
  };

  // Handle editing logged exercises in Quick Start mode
  const handleStartEditExercise = (index) => {
    const exercise = additionalExercises[index];
    if (exercise) {
      setEditingExerciseIndex(index);
      setEditingExerciseValues({
        name: exercise.name || '',
        weight: exercise.weight || 0,
        reps: exercise.reps || 0,
        sets: exercise.sets || 1
      });
    }
  };

  const handleSaveEditExercise = () => {
    if (editingExerciseIndex === null || !editingExerciseValues) return;
    
    const updates = {
      name: editingExerciseValues.name.trim() || additionalExercises[editingExerciseIndex].name,
      weight: Number(editingExerciseValues.weight) || 0,
      reps: Number(editingExerciseValues.reps) || 0,
      sets: Number(editingExerciseValues.sets) || 1
    };
    
    updateAdditionalExercise(editingExerciseIndex, updates);
    setEditingExerciseIndex(null);
    setEditingExerciseValues(null);
    if (window?.__toast) window.__toast('Exercise updated');
  };

  const handleCancelEditExercise = () => {
    setEditingExerciseIndex(null);
    setEditingExerciseValues(null);
  };

  const handleDeleteExercise = (index) => {
    if (window.confirm('Delete this exercise?')) {
      removeAdditionalExercise(index);
      if (window?.__toast) window.__toast('Exercise deleted');
    }
  };

  // Removed auto-confirm timeout - modal now stays visible until user interacts
  // This ensures users have time to review abnormal weight/reps and make a decision

  return (
    <div 
      className="h-screen w-full max-w-[375px] mx-auto px-4 flex flex-col items-center justify-start relative overflow-hidden"
      style={{ 
        height: '100vh',
        height: '100dvh', // Use dynamic viewport height for mobile
        overflow: 'hidden',
        background: '#0a0a0a' // Soft charcoal background
      }}
    >
      {/* Offline/Online Status Indicator */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-400'}`} />
        <span className="text-xs" style={{ color: '#e5e5e5', fontWeight: 400, opacity: 0.8 }}>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Scrollable Content Container */}
      <div className="w-full flex-1 flex flex-col items-center justify-center pt-8 pb-4 overflow-y-auto overflow-x-hidden">
      {/* Title */}
        <h2 className="text-[#e5e5e5] text-base font-medium mb-3" style={{ color: '#e5e5e5', fontWeight: 400 }}>{isQuickStart ? 'Quick Start' : 'Focus Mode'}</h2>

      {/* Voice Command Card */}
        <div className="w-full mb-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (listening) {
              ctrlRef.current?.stop();
            } else {
              ctrlRef.current?.start();
            }
          }}
          className={`block w-full rounded-2xl p-8 text-left backdrop-blur-md active:scale-[0.99] transition select-none ${
            listening 
              ? 'bg-red-500/30 border border-red-400/50 animate-pulse' 
              : 'bg-gradient-to-r from-orange-500/25 to-orange-600/20 border border-orange-400/40'
          }`}
          style={{ 
            userSelect: 'none', 
            touchAction: 'manipulation', 
            WebkitUserSelect: 'none',
            boxShadow: listening 
              ? '0 4px 16px rgba(239, 68, 68, 0.3)' 
              : '0 4px 16px rgba(249, 115, 22, 0.3)'
          }}
        >
          <div className="text-sm select-none mb-3" style={{ 
            color: listening ? '#fee2e2' : '#fed7aa', 
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            {listening ? '⏹️ TAP TO STOP' : '🎤 TAP TO RECORD'}
          </div>
          <div className="text-2xl font-semibold select-none" style={{ 
            color: listening ? '#fee2e2' : '#fed7aa', 
            fontWeight: 600 
          }}>
            {listening ? 'Recording…' : 'Voice Command'}
          </div>
          {!isQuickStart && workoutPlan[currentPlanIdx] && (
            <div className="text-sm mt-4 select-none" style={{ 
              color: listening ? '#fca5a5' : '#fdba74', 
              fontWeight: 400,
              opacity: 0.8
            }}>Logging for: {workoutPlan[currentPlanIdx].name}</div>
          )}
          {isQuickStart && (
            <div className="text-sm mt-4 select-none" style={{ 
              color: listening ? '#fca5a5' : '#fdba74', 
              fontWeight: 400,
              opacity: 0.8
            }}>
              {listening ? 'Tap again to stop recording' : 'Tap to start logging exercises'}
            </div>
          )}
        </button>
      </div>

      {/* Subtle Divider */}
      <div className="w-full h-px bg-white/8 mb-3" />

      {/* Below mic card, show last parsed AI result or error in glassy card */}
        <div className="w-full mb-3 min-h-[2.5em] flex justify-center">
        {aiParsed && !aiParsed.error && (
          <div className="rounded-xl px-4 py-3 text-center space-y-1 min-w-[225px]" style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)' }}>
            <div className="font-medium text-base" style={{ color: '#f5f5f5', fontWeight: 500 }}>Logged: {aiParsed.exercise}</div>
            <div className="text-sm" style={{ color: '#e5e5e5', fontWeight: 400 }}>{aiParsed.weight} kg × {aiParsed.reps} reps</div>
          </div>
        )}
        {error && <span className="inline-block px-3 py-2 rounded-xl bg-rose-600/70 text-xs" style={{ color: '#f5f5f5', fontWeight: 400 }}>{error}</span>}
      </div>

        {/* Quick Start: Show logged exercises list - Internally scrollable if needed */}
      {isQuickStart && (
          <div className="w-full mb-3 rounded-2xl p-4 flex flex-col" style={{ 
            maxHeight: '40vh', 
            minHeight: '120px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.25)'
          }}>
            <div className="text-[#f5f5f5] text-sm mb-3 flex-shrink-0" style={{ color: '#f5f5f5', fontWeight: 500 }}>Logged Exercises</div>
          {additionalExercises && additionalExercises.length > 0 ? (
              <div className="space-y-3 overflow-y-auto flex-1" style={{ maxHeight: 'calc(40vh - 60px)' }}>
              {additionalExercises.map((ex, idx) => {
                const isEditing = editingExerciseIndex === idx;
                const editValues = isEditing ? editingExerciseValues : null;
                
                return (
                  <div key={idx} className="rounded-xl p-4" style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)'
                  }}>
                    {isEditing ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <div>
                          <label className="text-white/70 text-xs mb-1.5 block">Exercise Name</label>
                          <input
                            type="text"
                            value={editValues?.name || ''}
                            onChange={(e) => setEditingExerciseValues(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full h-11 px-4 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus-glow outline-none"
                            placeholder="Exercise name"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-white/70 text-xs mb-1.5 block">Weight (kg)</label>
                            <input
                              type="tel"
                              inputMode="numeric"
                              value={editValues?.weight || ''}
                              onChange={(e) => {
                                const processed = handleNumberInput(e.target.value);
                                setEditingExerciseValues(prev => ({ ...prev, weight: processed === '' ? 0 : processed }));
                              }}
                              className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-center text-sm focus-glow outline-none tap-target"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-white/70 text-xs mb-1.5 block">Reps</label>
                            <input
                              type="tel"
                              inputMode="numeric"
                              value={editValues?.reps || ''}
                              onChange={(e) => {
                                const processed = handleNumberInput(e.target.value);
                                setEditingExerciseValues(prev => ({ ...prev, reps: processed === '' ? 0 : processed }));
                              }}
                              className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-center text-sm focus-glow outline-none tap-target"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-white/70 text-xs mb-1.5 block">Sets</label>
                            <input
                              type="tel"
                              inputMode="numeric"
                              value={editValues?.sets || ''}
                              onChange={(e) => {
                                const processed = handleNumberInput(e.target.value);
                                setEditingExerciseValues(prev => ({ ...prev, sets: processed === '' ? 1 : processed }));
                              }}
                              className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/20 text-white text-center text-sm focus-glow outline-none tap-target"
                              placeholder="1"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={handleSaveEditExercise}
                            className="flex-1 h-11 rounded-xl bg-emerald-500 text-white font-semibold text-sm btn-press tap-target"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEditExercise}
                            className="flex-1 h-11 rounded-xl bg-white/10 text-white border border-white/20 text-sm btn-press tap-target"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteExercise(idx)}
                            className="h-11 px-4 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30 text-sm btn-press tap-target"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="truncate" style={{ color: '#f5f5f5', fontWeight: 600 }}>{ex.name}</div>
                          <div className="text-xs mt-1" style={{ color: '#e5e5e5', fontWeight: 400, opacity: 0.7, fontFamily: 'var(--font-numbers, "Inter Tight", -apple-system, sans-serif)' }}>
                    {ex.weight} kg × {ex.reps} reps
                    {ex.sets > 1 && ` × ${ex.sets} sets`}
                </div>
                        </div>
                        <button
                          onClick={() => handleStartEditExercise(idx)}
                          className="ml-3 px-3 h-9 rounded-xl bg-white/10 text-white border border-white/20 text-xs font-medium btn-press tap-target hover:bg-white/15"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
              <div className="text-sm text-center py-4 flex-shrink-0" style={{ color: '#e5e5e5', fontWeight: 300, opacity: 0.6 }}>No exercises logged yet</div>
          )}
        </div>
      )}

      {/* Normal mode: Show workout plan */}
      {!isQuickStart && (
        <div 
          key={`exercise-${currentPlanIdx}-${exerciseTransitionKey}`}
          className="w-full mb-3 rounded-2xl p-6 space-y-5 fade-in flex-shrink-0"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
          }}
        >
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-400/30" style={{ fontWeight: 500 }}>Strength</div>
        <div className="text-[#f5f5f5] text-3xl font-bold" style={{ color: '#f5f5f5', fontWeight: 700, lineHeight: '1.2' }}>{workoutPlan[currentPlanIdx]?.name || 'No Exercise Selected'}</div>
        <div className="grid grid-cols-3 gap-3">
          {(() => {
            const ex = workoutPlan[currentPlanIdx] || { name: '', sets: 1, reps: 8, weight: 60 };
            const progress = (setProgress?.[ex.name]?.progress || 0);
            const values = (setProgress?.[ex.name]?.values || []);
            const lastIdx = Math.max(0, Math.min(values.length - 1, progress - 1));
            const lastSetVals = values[lastIdx] || {};
            // Keep showing actuals right after logging (during rest), then show targets when rest ends for the next set
            const hasActual = progress > 0 && (lastSetVals.reps !== undefined || lastSetVals.weight !== undefined);
            const showingActuals = hasActual && restVisible;
            const displayReps = showingActuals && lastSetVals.reps !== undefined ? lastSetVals.reps : (ex.reps || 8);
            const displayWeight = showingActuals && lastSetVals.weight !== undefined ? lastSetVals.weight : (ex.weight || 60);
            const isTarget = !showingActuals;
            return <>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center" style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)' }}>
                <div className="text-xs uppercase tracking-wide mb-2" style={{ color: '#e5e5e5', fontWeight: 400, opacity: 0.6 }}>Sets</div>
                <div className="text-3xl font-bold mb-2" style={{ color: '#f5f5f5', fontWeight: 700, fontFamily: 'var(--font-numbers, "Inter Tight", -apple-system, sans-serif)' }}>{progress}/{ex.sets}</div>
                {/* Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(progress / ex.sets) * 100}%`,
                      background: 'linear-gradient(90deg, #00D9FF 0%, #22D3EE 100%)',
                      boxShadow: '0 0 8px rgba(0, 217, 255, 0.4)'
                    }}
                  />
                </div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center" style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)' }}>
                <div className="text-xs uppercase tracking-wide mb-1.5" style={{ color: '#e5e5e5', fontWeight: 400, opacity: 0.6 }}>Reps</div>
                <div className={`text-2xl font-bold ${isTarget ? '' : ''}`} style={{ 
                  color: isTarget ? '#e5e5e5' : '#f5f5f5', 
                  fontWeight: 600,
                  opacity: isTarget ? 0.6 : 1,
                  fontFamily: 'var(--font-numbers, "Inter Tight", -apple-system, sans-serif)'
                }}>
                  {displayReps}
                </div>
                {isTarget && (
                  <div className="text-[10px] mt-1" style={{ color: '#e5e5e5', fontWeight: 300, opacity: 0.4 }}>(target)</div>
                )}
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center" style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)' }}>
                <div className="text-xs uppercase tracking-wide mb-1.5" style={{ color: '#e5e5e5', fontWeight: 400, opacity: 0.6 }}>Weight</div>
                <div className={`text-2xl font-bold ${isTarget ? '' : ''}`} style={{ 
                  color: isTarget ? '#e5e5e5' : '#f5f5f5', 
                  fontWeight: 600,
                  opacity: isTarget ? 0.6 : 1,
                  fontFamily: 'var(--font-numbers, "Inter Tight", -apple-system, sans-serif)'
                }}>
                  {displayWeight} kg
                </div>
                {isTarget && (
                  <div className="text-[10px] mt-1" style={{ color: '#e5e5e5', fontWeight: 300, opacity: 0.4 }}>(target)</div>
                )}
              </div>
            </>;
          })()}
        </div>
        {/* Subtle Divider */}
        <div className="w-full h-px bg-white/8 my-3" />
        <div className="text-[#e5e5e5]/70 text-sm" style={{ color: '#e5e5e5', fontWeight: 400, fontFamily: 'var(--font-numbers, "Inter Tight", -apple-system, sans-serif)' }}>Previous: 82 kg × 8</div>
      </div>
      )}

      </div>
      {/* End Scrollable Content Container */}

      {/* Celebration overlays */}
      {celebrateSet && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-white/40 celebrate-flash" />
          <div className="text-6xl text-emerald-400 font-extrabold celebrate-check drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">✓</div>
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-sm font-bold celebrate-badge">+1 SET</div>
        </div>
      )}
      {celebrateComplete && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <div className="absolute inset-0 bg-white/30 celebrate-flash" />
          <div className="text-2xl sm:text-3xl text-white font-extrabold tracking-wide celebrate-check">EXERCISE COMPLETE! 💪</div>
          <div className="confetti-container absolute inset-0">
            {confetti.map(p => (
              <span key={p.id} className="confetti-dot" style={{ background:p.color, '--dx': p.dx, '--dy': p.dy }} />
            ))}
          </div>
        </div>
      )}

      {/* Pause button (top-left) */}
      <div className="fixed top-4 left-4 z-40">
        <button 
          onClick={pauseWorkout} 
          className="btn-press tap-target px-4 h-10 rounded-2xl text-sm backdrop-blur-md flex items-center gap-2"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#f5f5f5',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          {isPaused ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resume
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pause
            </>
          )}
        </button>
      </div>

      {/* Exercise Navigation and Finish Buttons - Unified Bottom Section */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+100px)] left-0 right-0 z-20 px-4">
        <div className="flex items-center gap-3 max-w-[375px] mx-auto">
          {/* Exercise Navigation Button */}
          {!isQuickStart && workoutPlan.length > 0 && (
            <button
              onClick={() => setShowExerciseNav(true)}
              className="btn-press tap-target flex-1 h-12 rounded-2xl backdrop-blur-md font-medium text-sm flex items-center justify-center gap-2"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f5f5f5',
                fontWeight: 500,
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Exercises ({workoutPlan.length})
            </button>
          )}

      {/* Finish Workout Button */}
          <button 
            onClick={()=>navigate('/summary')} 
            className={`btn-press tap-target h-12 rounded-2xl backdrop-blur-md font-medium text-sm ${!isQuickStart && workoutPlan.length > 0 ? 'flex-1' : 'w-full'}`}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f5f5f5',
              fontWeight: 500,
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.25)'
            }}
          >
            Finish
        </button>
        </div>
      </div>

      {/* Paused Overlay (blocks everything including nav) */}
      {isPaused && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
            <div className="text-white/80 text-sm mb-2">Workout Paused</div>
            <div className="text-white text-2xl font-bold mb-5">RESUME WORKOUT</div>
            <button onClick={resumeWorkout} className="px-6 h-12 rounded-full bg-white text-slate-900 font-semibold shadow-xl active:scale-[0.99]">Resume</button>
          </div>
        </div>
      )}

      {/* Rest Timer Overlay */}
      {restVisible && (
        <div className="fixed inset-0 z-30" onClick={(e)=>{ if(e.target===e.currentTarget) stopRest(); }}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-x-0 bottom-0 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
            <div className={`pulse-glass rounded-3xl p-4 transition-transform duration-300 ${restVisible ? 'translate-y-0' : 'translate-y-8'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-white/80 text-sm">Rest</div>
                <button onClick={stopRest} className="text-white/70 text-sm px-3 py-1 rounded-xl bg-white/10 border border-white/10">Skip</button>
              </div>
              <div className="flex items-center gap-4">
                {/* Circular progress */}
                {(() => {
                  const size = 72; const stroke = 8; const radius = (size-stroke)/2; const circ = 2*Math.PI*radius;
                  const ratio = restDuration>0 ? restRemaining/restDuration : 0;
                  const offset = circ - circ*ratio;
                  const urgent = restRemaining <= 10;
                  return (
                    <svg width={size} height={size} className={`${urgent? 'animate-pulse':''}`}>
                      <circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} fill="none" />
                      <circle cx={size/2} cy={size/2} r={radius} stroke={urgent? '#f97316' : '#22c55e'} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" fill="none" transform={`rotate(-90 ${size/2} ${size/2})`} />
                      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-white" style={{fontWeight:700,fontSize:16}}>{restRemaining}s</text>
                    </svg>
                  );
                })()}
                <div className="flex-1">
                  <div className="text-white font-semibold text-lg">{restRemaining > 0 ? 'Recover' : 'Rest complete'}</div>
                  <div className="text-white/70 text-sm">{restRemaining > 0 ? 'Breathe. Hydrate.' : 'Next set ready.'}</div>
                </div>
              </div>
              {/* Quick duration controls */}
              <div className="mt-3 text-white/60 text-xs">
                Default rest: {prefs?.restDuration || restDuration}s
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {quickDurations.map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      // If timer is running and same duration tapped, do nothing
                      if (restVisible && s === restDuration && restRemaining === restDuration) {
                        return;
                      }
                      // Calculate elapsed time from current timer
                      const elapsed = restDuration - restRemaining;
                      // Set new duration, but continue from current elapsed time
                      // So if 15s elapsed on 210s timer, and clicking 90s: 90s - 15s = 75s remaining
                      setRestDuration(s);
                      setRestRemaining(Math.max(0, s - elapsed));
                    }}
                    className={`h-10 rounded-xl border text-sm ${restDuration===s? 'bg-white text-slate-900 border-transparent':'bg-white/10 text-white border-white/10'}`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
              {/* Extra controls: Reset and +30s */}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    // Explicit reset to the current selected duration
                    setRestRemaining(restDuration);
                  }}
                  className="h-10 px-3 rounded-xl bg-white/10 text-white border border-white/10 text-sm"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    // Extend by 30s without restarting; keep progress ring consistent
                    setRestRemaining(r => (r + 30));
                    setRestDuration(d => (Math.max(d, (restRemaining + 30))));
                  }}
                  className="h-10 px-3 rounded-xl bg-white/10 text-white border border-white/10 text-sm"
                >
                  +30s
                </button>
              </div>
              {restRemaining===0 && (
                <div className="mt-2 text-emerald-300 text-sm">Rest complete. Next: {workoutPlan[currentPlanIdx]?.name || 'exercise'}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {pendingConfirmation && (
        <div className="fixed inset-x-0 bottom-24 z-50 px-4">
          <div className="pulse-glass rounded-2xl p-4 border border-white/20 shadow-xl">
            <div className="text-white text-sm font-semibold">
              {pendingConfirmation.result.exercise}
            </div>
            <div className="text-white/70 text-xs mt-1">
              {pendingEditValues?.reps || pendingConfirmation.result.reps || '?'} reps · {pendingConfirmation.result.isBodyweight ? 'bodyweight' : `${pendingEditValues?.weight || pendingConfirmation.result.weight || '?'} kg`}
            </div>
            {pendingConfirmation.result.needsConfirmation?.length > 0 && (
              <div className="text-amber-300 text-[10px] mt-2 uppercase tracking-wide">
                {pendingConfirmation.result.needsConfirmation.map((reason) => reason.replace(/_/g, ' ')).join(', ')}
              </div>
            )}
            {pendingEditMode ? (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-white/60 text-[10px] uppercase block mb-1">Reps</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      min="1"
                      max="200"
                      value={pendingEditValues?.reps ?? ''}
                      onChange={(e) => handleEditPending('reps', e.target.value)}
                      className="w-full h-9 rounded-xl bg-white/10 border border-white/20 px-3 text-white text-center outline-none"
                    />
                  </div>
                  {!pendingConfirmation.result.isBodyweight && (
                    <div>
                      <label className="text-white/60 text-[10px] uppercase block mb-1">Weight (kg)</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        min="0"
                        max="500"
                        value={pendingEditValues?.weight ?? ''}
                        onChange={(e) => handleEditPending('weight', e.target.value)}
                        className="w-full h-9 rounded-xl bg-white/10 border border-white/20 px-3 text-white text-center outline-none"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPendingEditMode(false)}
                    className="flex-1 h-9 rounded-full bg-white/10 text-white border border-white/20 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPending}
                    className="flex-1 h-9 rounded-full bg-emerald-400 text-slate-900 text-xs font-semibold"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => {
                    const defaultReps = pendingEditValues?.reps ?? pendingConfirmation.result.reps ?? '';
                    const defaultWeight = pendingConfirmation.result.isBodyweight
                      ? ''
                      : (pendingEditValues?.weight === 'bodyweight' ? '' : (pendingEditValues?.weight ?? pendingConfirmation.result.weight ?? ''));
                    setPendingEditValues({ reps: defaultReps, weight: defaultWeight });
                    setPendingEditMode(true);
                  }}
                  className="flex-1 h-9 rounded-full bg-white/10 text-white border border-white/20 text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={handleConfirmPending}
                  className="flex-1 h-9 rounded-full bg-emerald-400 text-slate-900 text-xs font-semibold"
                >
                  Yes
                </button>
                <button
                  onClick={handleCancelPending}
                  className="h-9 px-3 rounded-full bg-white/10 text-white border border-white/20 text-xs"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtle Toast Notification for Logged Set */}
      {recentLog && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="pulse-glass rounded-full px-4 py-2 border border-emerald-400/40 bg-emerald-500/20 text-white text-xs font-medium shadow-xl backdrop-blur-md">
            ✓ {recentLog.exercise} • {recentLog.reps} reps • {recentLog.weight}
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="pulse-glass rounded-full px-4 py-2 border border-rose-400/40 bg-rose-500/20 text-white text-xs font-medium shadow-xl backdrop-blur-md">
            {error}
          </div>
        </div>
      )}

      {/* Loading Spinner for Voice Processing */}
      {isProcessingVoice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4">
          <div className="pulse-glass rounded-full px-4 py-2 border border-cyan-400/40 bg-cyan-500/20 text-white text-xs font-medium shadow-xl backdrop-blur-md flex items-center gap-2">
            <svg className="w-4 h-4 spinner" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing voice command...
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      {pendingExerciseAdd && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={handleCancelAddExercise} />
          <div className="absolute inset-x-0 bottom-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
            <div className="pulse-glass rounded-2xl p-4 border border-white/20 shadow-xl">
              <div className="text-white text-sm font-semibold mb-2">
                Add Exercise to Workout?
              </div>
              <div className="text-white/70 text-xs mb-4">
                Did you want to add <span className="text-white font-semibold">{pendingExerciseAdd.exerciseName}</span> to this workout?
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelAddExercise}
                  className="flex-1 h-10 rounded-full bg-white/10 text-white border border-white/20 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAddExercise}
                  className="flex-1 h-10 rounded-full bg-emerald-400 text-slate-900 text-xs font-semibold"
                >
                  Add & Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Navigation Bottom Sheet */}
      {showExerciseNav && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowExerciseNav(false)} />
          <div className="absolute inset-x-0 bottom-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
            <div className="pulse-glass rounded-t-3xl rounded-b-2xl p-5 border border-white/20 shadow-xl max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="text-white text-lg font-semibold mb-2">Workout Overview</div>
                  <div className="space-y-1">
                    {(() => {
                      const fullyCompleted = workoutPlan.filter(ex => {
                        const progress = setProgress?.[ex.name]?.progress || 0;
                        return progress >= (ex.sets || 1);
                      }).length;
                      const inProgress = workoutPlan.filter(ex => {
                        const progress = setProgress?.[ex.name]?.progress || 0;
                        return progress > 0 && progress < (ex.sets || 1);
                      }).length;
                      const notStarted = workoutPlan.length - fullyCompleted - inProgress;
                      
                      const totalSetsCompleted = workoutPlan.reduce((sum, ex) => {
                        const progress = setProgress?.[ex.name]?.progress || 0;
                        return sum + progress;
                      }, 0);
                      const totalSetsPlanned = workoutPlan.reduce((sum, ex) => sum + (ex.sets || 1), 0);
                      
                      return (
                        <div className="text-white/70 text-xs space-y-1">
                          <div className="flex items-center gap-4">
                            <span>
                              <span className="text-emerald-300 font-semibold">{fullyCompleted}</span> completed
                            </span>
                            {inProgress > 0 && (
                              <span>
                                <span className="text-cyan-300 font-semibold">{inProgress}</span> in progress
                              </span>
                            )}
                            {notStarted > 0 && (
                              <span>
                                <span className="text-white/50 font-semibold">{notStarted}</span> not started
                              </span>
                            )}
                          </div>
                          <div className="text-white/60">
                            Sets: <span className="text-white font-semibold">{totalSetsCompleted}/{totalSetsPlanned}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <button
                  onClick={() => setShowExerciseNav(false)}
                  className="w-8 h-8 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center ml-3 flex-shrink-0"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                {workoutPlan.map((exercise, idx) => {
                  const progress = setProgress?.[exercise.name]?.progress || 0;
                  const values = setProgress?.[exercise.name]?.values || [];
                  const isCurrent = currentPlanIdx === idx;
                  const isCompleted = progress >= (exercise.sets || 1);
                  const totalSets = exercise.sets || 1;
                  const lastLoggedSet = values.length > 0 ? values[values.length - 1] : null;
                  const targetWeight = exercise.weight || 0;
                  const targetReps = exercise.reps || 0;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentPlanIdx(idx);
                        setExerciseTransitionKey(prev => prev + 1); // Trigger smooth transition
                        setShowExerciseNav(false);
                        speakMessage(`Switched to ${exercise.name}`);
                      }}
                      className={`w-full p-4 rounded-2xl border text-left transition ${
                        isCurrent
                          ? 'bg-cyan-500/20 border-cyan-400/50'
                          : isCompleted
                          ? 'bg-emerald-500/10 border-emerald-400/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isCompleted
                              ? 'bg-emerald-400 text-slate-900'
                              : isCurrent
                              ? 'bg-cyan-400 text-slate-900'
                              : 'bg-white/20 text-white/60'
                          }`}>
                            {isCompleted ? (
                              <span className="text-sm font-bold">✓</span>
                            ) : isCurrent ? (
                              <span className="text-xs">●</span>
                            ) : (
                              <span className="text-xs">○</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-base font-semibold mb-1 ${
                              isCurrent ? 'text-cyan-200' : isCompleted ? 'text-emerald-200' : 'text-white'
                            }`}>
                              {exercise.name}
                            </div>
                            
                            {/* Progress */}
                            <div className="text-xs text-white/70 mb-2">
                              <span className={progress > 0 ? 'text-white' : 'text-white/60'}>
                                {progress}/{totalSets} sets completed
                              </span>
                              {isCompleted && (
                                <span className="text-emerald-300 ml-2">✓ Done</span>
                              )}
                              {isCurrent && !isCompleted && (
                                <span className="text-cyan-300 ml-2">● Current</span>
                              )}
                            </div>
                            
                            {/* Target Info */}
                            <div className="flex items-center gap-4 text-xs text-white/60 mb-2">
                              <span>Target: {targetWeight}kg × {targetReps} reps</span>
                            </div>
                            
                            {/* Last Logged Set */}
                            {lastLoggedSet && (
                              <div className="text-xs text-white/80 mt-2 pt-2 border-t border-white/10">
                                <span className="text-white/60">Last set: </span>
                                <span className="text-white font-semibold">
                                  {lastLoggedSet.weight || 0}kg × {lastLoggedSet.reps || 0} reps
                                </span>
                              </div>
                            )}
                            
                            {/* All Logged Sets */}
                            {values.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/10">
                                <div className="text-[10px] text-white/50 uppercase tracking-wide mb-1.5">Sets Logged</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {values.map((set, setIdx) => (
                                    <div
                                      key={setIdx}
                                      className="px-2 py-1 rounded-lg bg-white/10 text-[10px] text-white/90 font-medium"
                                    >
                                      Set {setIdx + 1}: {set.weight || 0}kg × {set.reps || 0}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                
                {additionalExercises.length > 0 && (
                  <>
                    <div className="text-white/60 text-xs uppercase tracking-wide mt-4 mb-2">Additional Exercises</div>
                    {additionalExercises.map((exercise, idx) => (
                      <div
                        key={`extra-${idx}`}
                        className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-emerald-400 text-slate-900 flex items-center justify-center flex-shrink-0">
                            ✓
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-emerald-200">{exercise.name}</div>
                            <div className="text-xs text-white/60 mt-0.5">
                              {exercise.sets} × {exercise.reps} @ {exercise.weight}kg
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personal Record Celebration Modal */}
      {currentPR && (
        <PRCelebration 
          pr={currentPR} 
          onDismiss={() => setCurrentPR(null)}
        />
      )}
    </div>
  );
}


