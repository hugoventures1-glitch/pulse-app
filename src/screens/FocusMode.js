import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createRecognizer, attachPressHold, isSpeechSupported } from '../lib/speech';
import { parseCommand } from '../lib/parseCommands';
import { useWorkout } from '../state/WorkoutContext';
import { parseWorkoutWithClaude } from '../lib/claude';

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

export default function FocusMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const isQuickStart = location.state?.mode === 'quick';
  const { addLog, workoutPlan, getCurrentSetNum, logSetCompletion, setProgress, markExerciseComplete, addAdditionalExercise, additionalExercises, currentPlanIdx, nextExerciseIdx, isOnline, isPaused, pauseWorkout, resumeWorkout, endWorkout, prefs } = useWorkout();
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
  const [aiParsed, setAiParsed] = useState(null);
  const recRef = useRef(null);
  const ctrlRef = useRef(null);
  const [error, setError] = useState('');
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
    nextExerciseIdx,
    navigate,
    restDuration,
    startRest,
    currentPlanIdx
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
      nextExerciseIdx,
      navigate,
      restDuration,
      startRest,
      currentPlanIdx
    };
  }, [addLog, isQuickStart, workoutPlan, setProgress, logSetCompletion, markExerciseComplete, addAdditionalExercise, nextExerciseIdx, navigate, restDuration, startRest, currentPlanIdx]);

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
        try {
          const currentEx = callbacks.workoutPlan[callbacks.currentPlanIdx] || null;
          const context = {
            currentExercise: currentEx?.name || null,
            lastWeight: null,
            lastReps: null,
            targetWeight: currentEx?.weight || null,
            targetReps: currentEx?.reps || null
          };

          if (currentEx && callbacks.setProgress?.[currentEx.name]) {
            const values = callbacks.setProgress[currentEx.name].values || [];
            if (values.length > 0) {
              const lastSet = values[values.length - 1];
              context.lastWeight = lastSet.weight || null;
              context.lastReps = lastSet.reps || null;
            }
          }

          const result = await parseWorkoutWithClaude(normalizedTranscript, context);
          if (result.error) {
            setError(result.error);
            return;
          }

          setAiParsed(result);

          if (callbacks.isQuickStart) {
            if (result.exercise) {
              callbacks.addAdditionalExercise({ ...result, complete: true });
              if (result.isQuickComplete) {
                speakMessage(`Set logged. ${result.exercise}, ${result.reps} reps at ${result.weight} kg.`);
              } else {
                speakMessage('Set logged');
              }
              setCelebrateSet(true); playSuccessTone();
              setTimeout(() => setCelebrateSet(false), 700);
              callbacks.startRest(callbacks.restDuration, result.exercise);
            }
            return;
          }

          const planNames = callbacks.workoutPlan.map(e => e.name.toLowerCase());
          const idx = planNames.indexOf((result.exercise || '').toLowerCase());
          if (idx !== -1) {
            const exName = callbacks.workoutPlan[idx].name;
            const setsInPlan = callbacks.workoutPlan[idx].sets || 1;
            const prevProgress = (callbacks.setProgress?.[exName]?.progress || 0);
            const nextProgress = Math.min(prevProgress + 1, setsInPlan);

            callbacks.logSetCompletion({ exercise: exName, reps: result.reps, weight: result.weight, sets: setsInPlan });

            const confirmMsg = result.isQuickComplete
              ? `Set logged. ${exName}, ${result.reps} reps at ${result.weight} kg.`
              : `Logged. ${exName}, ${result.reps} reps at ${result.weight} kg. ${setsInPlan - nextProgress} sets remaining.`;
            speakMessage(confirmMsg);

            callbacks.startRest(callbacks.restDuration, exName);
            setCelebrateSet(true); playSuccessTone();
            setTimeout(() => setCelebrateSet(false), 700);

            if (nextProgress >= setsInPlan) {
              callbacks.markExerciseComplete(exName, setsInPlan);
              const nextEx = callbacks.workoutPlan[idx + 1]?.name;
              setCelebrateComplete(true);
              const parts = Array.from({ length: 24 }).map((_, i) => ({
                id: i,
                color: ['#22c55e', '#7c3aed', '#06b6d4', '#f59e0b'][i % 4],
                dx: (Math.random() * 160 - 80) + 'px',
                dy: (Math.random() * -140 - 40) + 'px'
              }));
              setConfetti(parts);
              setTimeout(() => { setCelebrateComplete(false); setConfetti([]); }, 1200);
              setTimeout(() => {
                callbacks.nextExerciseIdx();
                if (!nextEx) {
                  callbacks.navigate('/summary');
                }
              }, 900);
            }
          } else if (result.exercise) {
            callbacks.addAdditionalExercise({ ...result, complete: true });
          }
        } catch (e) {
          setError("AI parsing failed, try again");
          setAiParsed(null);
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
  return (
    <div className="min-h-screen w-full max-w-[375px] mx-auto px-4 flex flex-col items-center justify-center relative">
      {/* Offline/Online Status Indicator */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-400'}`} />
        <span className="text-xs text-white/80">{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Title */}
      <h2 className="text-white text-2xl font-semibold mb-8">{isQuickStart ? 'Quick Start' : 'Focus Mode'}</h2>

      {/* Voice Command Card */}
      <div className="w-full mb-8">
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
          className={`block w-full rounded-3xl p-6 text-left backdrop-blur-md active:scale-[0.99] transition select-none ${
            listening 
              ? 'bg-red-500/30 border border-red-400/50 animate-pulse' 
              : 'bg-cyan-500/20 border border-cyan-400/30'
          }`}
          style={{ userSelect: 'none', touchAction: 'manipulation', WebkitUserSelect: 'none' }}
        >
          <div className="text-white/90 text-sm select-none">
            {listening ? '⏹️ TAP TO STOP' : '🎤 TAP TO RECORD'}
          </div>
          <div className="text-white text-xl font-semibold mt-1 select-none">
            {listening ? 'Recording…' : 'Voice Command'}
          </div>
          {!isQuickStart && workoutPlan[currentPlanIdx] && (
            <div className="text-white/70 text-xs mt-2 select-none">Logging for: {workoutPlan[currentPlanIdx].name}</div>
          )}
          {isQuickStart && (
            <div className="text-white/70 text-sm mt-2 select-none">
              {listening ? 'Tap again to stop recording' : 'Tap to start logging exercises'}
            </div>
          )}
        </button>
      </div>

      {/* Below mic card, show last parsed AI result or error in glassy card */}
      <div className="w-full mb-8 min-h-[3em] flex justify-center">
        {aiParsed && !aiParsed.error && (
          <div className="pulse-glass rounded-xl px-5 py-4 text-white text-center space-y-1 min-w-[225px]">
            <div className="font-medium text-lg">Logged: {aiParsed.exercise}</div>
            <div className="text-sm">{aiParsed.weight} kg × {aiParsed.reps} reps</div>
          </div>
        )}
        {error && <span className="inline-block px-3 py-2 rounded-xl bg-rose-600/80 text-xs text-white">{error}</span>}
      </div>

      {/* Quick Start: Show logged exercises list */}
      {isQuickStart && (
        <div className="w-full mb-8 pulse-glass rounded-3xl p-5 space-y-3">
          <div className="text-white/90 text-sm font-semibold mb-2">Logged Exercises</div>
          {additionalExercises && additionalExercises.length > 0 ? (
            <div className="space-y-2">
              {additionalExercises.map((ex, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white font-medium">{ex.name}</span>
                  <span className="text-white/80 text-sm">
                    {ex.weight} kg × {ex.reps} reps
                    {ex.sets > 1 && ` × ${ex.sets} sets`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/60 text-sm text-center py-4">No exercises logged yet</div>
          )}
        </div>
      )}

      {/* Normal mode: Show workout plan */}
      {!isQuickStart && (
      <div className="w-full mb-8 pulse-glass rounded-3xl p-5 space-y-4">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-400/30">Strength</div>
        <div className="text-white text-xl font-semibold">{workoutPlan[currentPlanIdx]?.name || 'No Exercise Selected'}</div>
        <div className="grid grid-cols-3 gap-2 text-white/80">
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
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center"><div className="text-[11px] uppercase">Sets</div><div className="text-base font-semibold">{progress}/{ex.sets}</div></div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                <div className="text-[11px] uppercase">Reps</div>
                <div className={`text-base font-semibold ${isTarget ? 'text-white/60' : 'text-white'}`}>
                  {displayReps}
                  {isTarget && <span className="text-[10px] text-white/40 ml-1">(target)</span>}
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-center">
                <div className="text-[11px] uppercase">Weight</div>
                <div className={`text-base font-semibold ${isTarget ? 'text-white/60' : 'text-white'}`}>
                  {displayWeight} kg
                  {isTarget && <span className="text-[10px] text-white/40 ml-1">(target)</span>}
                </div>
              </div>
            </>;
          })()}
        </div>
        <div className="text-white/70 text-sm">Previous: 82 kg × 8</div>
      </div>
      )}

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
        <button onClick={pauseWorkout} className="px-3 h-9 rounded-full bg-white/10 text-white border border-white/15 text-xs backdrop-blur-md">Pause</button>
      </div>

      {/* Finish Workout Button */}
      <div className="fixed right-4 bottom-24 z-10">
        <button onClick={()=>navigate('/summary')} className="px-4 h-11 rounded-full bg-white/10 text-white border border-white/15 backdrop-blur-md">
          Finish Workout
        </button>
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
                      if (restVisible && s === restDuration) {
                        return;
                      }
                      // Apply new duration and remaining when changed intentionally
                      setRestDuration(s);
                      setRestRemaining(s);
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

    </div>
  );
}


