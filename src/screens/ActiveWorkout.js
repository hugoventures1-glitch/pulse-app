import React, { useEffect, useRef, useState } from 'react';
import { createRecognizer, attachPressHold, isSpeechSupported } from '../lib/speech';
import { parseCommand } from '../lib/parseCommands';
import { useWorkout } from '../state/WorkoutContext';
import { callClaude } from '../lib/claude';

const PROMPT = `You are a workout logging assistant. Parse this voice input and extract workout data.\n\nUser said: [transcribed text]\n\nCommon speech-to-text errors to fix:\n- 'revs' → reps\n- 'wraps' → reps\n- 'sets' might be 'sits'\n- 'kilograms' might be 'kilos', 'kg', 'kgs'\n- Exercise names might be misspelled\n\nReturn ONLY a JSON object (no markdown, no explanation):\n{\n  "exercise": "exercise name",\n  "weight": number in kg,\n  "reps": number,\n  "sets": number (default 1 if not mentioned)\n}\n\nIf you cannot parse it, return: {"error": "Could not understand, please try again"}`;

export default function ActiveWorkout() {
  const { currentExercise, updateFromCommand, addLog, markExerciseComplete, addAdditionalExercise, workoutPlan } = useWorkout();
  const [listening, setListening] = useState(false);
  const [aiParsed, setAiParsed] = useState(null);
  const recRef = useRef(null);
  const ctrlRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSpeechSupported()) return;
    const rec = createRecognizer({ lang: 'en-US' });
    recRef.current = rec;
    const ctl = attachPressHold(rec, {
      onTranscript: async (t) => {
        addLog(t);
        setAiParsed(null);
        setError('');
        try {
          const resp = await callClaude(PROMPT, t);
          console.log('Claude response:', resp);
          setAiParsed(resp);
          if (resp.error) {
            setError(resp.error);
            return;
          }
          // find/add
          const planNames = (workoutPlan || []).map(e => e.name.toLowerCase());
          const idx = planNames.indexOf((resp.exercise||'').toLowerCase());
          if (idx !== -1) {
            markExerciseComplete(workoutPlan[idx].name, resp.sets || 1);
          } else if (resp.exercise) {
            addAdditionalExercise({ ...resp, complete: true });
          }
        } catch (e) {
          setError("AI parsing failed, try again");
          setAiParsed(null);
        }
      },
      onStart: () => setListening(true),
      onEnd: () => setListening(false),
      onError: () => setListening(false)
    });
    ctrlRef.current = ctl;
    return () => { try { rec.stop(); } catch(_){} };
  }, [addLog, markExerciseComplete, addAdditionalExercise, workoutPlan]);

  return (
    <div className="w-full max-w-[375px] px-4 py-5 space-y-6">
      <div className="text-center">
        <div className="text-white/70 text-sm">Session Time</div>
        <div className="text-white text-4xl font-semibold tracking-wide">12:36</div>
      </div>

      <div className="pulse-glass rounded-3xl p-5 text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-400/30">Strength</div>
        <div className="mt-2 text-white text-xl font-semibold">{currentExercise.name}</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-white/90">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3"><div className="text-[11px] uppercase text-white/60">Set</div><div className="text-base font-semibold">{currentExercise.setIndex} / {currentExercise.totalSets}</div></div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3"><div className="text-[11px] uppercase text-white/60">Reps</div><div className="text-base font-semibold">{currentExercise.reps}</div></div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3"><div className="text-[11px] uppercase text-white/60">Weight</div><div className="text-base font-semibold">{currentExercise.weight} kg</div></div>
        </div>
      </div>

      {/* Show last AI parsed result below mic. */}
      <div className="my-4 min-h-[2.5em] text-center">
        {aiParsed && !aiParsed.error && (
          <span className="inline-block px-3 py-2 rounded-xl bg-white/10 text-xs text-white">
            {aiParsed.exercise && <b>{aiParsed.exercise}</b>} {aiParsed.weight && `${aiParsed.weight}kg`} {aiParsed.reps && `${aiParsed.reps} reps`} {aiParsed.sets && `${aiParsed.sets} sets`}
          </span>
        )}
        {error && <span className="inline-block px-3 py-2 rounded-xl bg-rose-600/80 text-xs text-white">{error}</span>}
      </div>

      <div className="flex items-center justify-center">
        <button
          aria-label="Hold to log set"
          onPointerDown={() => ctrlRef.current?.start()}
          onPointerUp={() => ctrlRef.current?.stop()}
          onPointerCancel={() => ctrlRef.current?.stop()}
          className="h-24 w-24 rounded-full bg-white text-slate-900 font-semibold shadow-xl active:scale-[0.98]"
        >
          {listening ? 'Listening…' : 'Hold'}
        </button>
      </div>
      <p className="text-center text-white/70 text-sm">Hold to log set • Release to save</p>

      <div className="fixed inset-x-0 bottom-0 z-10">
        <div className="mx-auto w-full max-w-[375px] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
          <div className="grid grid-cols-3 gap-2">
            <button className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white/90">Pause</button>
            <button className="h-14 rounded-2xl bg-rose-500 text-white font-semibold">Stop</button>
            <button className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white/90">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}


