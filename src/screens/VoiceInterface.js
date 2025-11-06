import React, { useEffect, useRef, useState } from 'react';
import { createRecognizer, attachPressHold, isSpeechSupported } from '../lib/speech';
import { parseCommand } from '../lib/parseCommands';
import { useWorkout } from '../state/WorkoutContext';
import { callClaude } from '../lib/claude';

const PROMPT = `You are a workout logging assistant. Parse this voice input and extract workout data.\n\nUser said: [transcribed text]\n\nCommon speech-to-text errors to fix:\n- 'revs' → reps\n- 'wraps' → reps\n- 'sets' might be 'sits'\n- 'kilograms' might be 'kilos', 'kg', 'kgs'\n- Exercise names might be misspelled\n\nReturn ONLY a JSON object (no markdown, no explanation):\n{\n  "exercise": "exercise name",\n  "weight": number in kg,\n  "reps": number,\n  "sets": number (default 1 if not mentioned)\n}\n\nIf you cannot parse it, return: {"error": "Could not understand, please try again"}`;

export default function VoiceInterface() {
  const { logs, addLog, updateFromCommand, markExerciseComplete, addAdditionalExercise, workoutPlan } = useWorkout();
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
          const planNames = workoutPlan.map(e => e.name.toLowerCase());
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
    <div className="w-full max-w-[375px] px-4 py-5 space-y-5">
      <h2 className="text-white text-2xl font-semibold">Voice</h2>

      <div className="flex items-center justify-center">
        <button
          aria-label="Hold to speak"
          onPointerDown={() => ctrlRef.current?.start()}
          onPointerUp={() => ctrlRef.current?.stop()}
          onPointerCancel={() => ctrlRef.current?.stop()}
          className="h-24 w-24 rounded-full bg-cyan-500 text-slate-900 font-semibold shadow-[0_0_40px_rgba(6,182,212,0.45)] active:scale-[0.98]"
        >
          {listening ? 'Listening…' : 'Hold'}
        </button>
      </div>
      <p className="text-white/70 text-center text-sm">Hold to talk. Release to log.</p>

      {/* Show last AI parsed result below mic. */}
      <div className="my-4 min-h-[2.5em] text-center">
        {aiParsed && !aiParsed.error && (
          <span className="inline-block px-3 py-2 rounded-xl bg-white/10 text-xs text-white">
            {aiParsed.exercise && <b>{aiParsed.exercise}</b>} {aiParsed.weight && `${aiParsed.weight}kg`} {aiParsed.reps && `${aiParsed.reps} reps`} {aiParsed.sets && `${aiParsed.sets} sets`}
          </span>
        )}
        {error && <span className="inline-block px-3 py-2 rounded-xl bg-rose-600/80 text-xs text-white">{error}</span>}
      </div>

      <div className="pulse-glass rounded-3xl p-4">
        <div className="text-white/80 text-sm mb-2">Recent</div>
        <div className="space-y-2">
          {logs.map((l, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-white/60 text-xs w-16">{new Date(l.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
              <div className="flex-1 text-white/90 text-sm">{l.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


