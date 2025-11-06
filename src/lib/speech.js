// Simple Web Speech API wrapper with press-and-hold start/stop

export function isSpeechSupported() {
  return typeof window !== 'undefined' && (
    window.SpeechRecognition || window.webkitSpeechRecognition
  );
}

export function createRecognizer({ lang = 'en-US', interim = true } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = lang;
  // Use non-continuous for press-and-hold UX; final result arrives on end
  rec.continuous = false;
  rec.interimResults = interim;
  return rec;
}

export function attachPressHold(recognizer, {
  onTranscript,
  onStart,
  onEnd,
  onError,
}) {
  if (!recognizer) return () => {};
  let isActive = false;
  let buffer = '';
  let hardStopTimer = null;

  recognizer.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res[0] && res[0].transcript) {
        const t = res[0].transcript.trim();
        if (res.isFinal) {
          buffer = `${buffer} ${t}`.trim();
        } else {
          // Optionally stream interim results here
        }
      }
    }
  };
  recognizer.onstart = () => {
    isActive = true;
    buffer = '';
    onStart && onStart();
  };
  const finalize = () => {
    if (hardStopTimer) { clearTimeout(hardStopTimer); hardStopTimer = null; }
    if (buffer && onTranscript) onTranscript(buffer.trim());
    buffer = '';
  };
  recognizer.onaudioend = () => { /* some browsers fire this before end */ };
  recognizer.onspeechend = () => { try { recognizer.stop(); } catch(_){} };
  recognizer.onend = () => {
    if (!isActive) return; // prevent double-calls
    isActive = false;
    finalize();
    onEnd && onEnd();
  };
  recognizer.onerror = (ev) => {
    if (hardStopTimer) { clearTimeout(hardStopTimer); hardStopTimer = null; }
    isActive = false;
    onError && onError(ev);
  };

  const start = () => {
    try {
      if (isActive) { try { recognizer.abort(); } catch(_){} }
      recognizer.start();
      // Safety timer: force end if browser never fires onend
      hardStopTimer = setTimeout(() => {
        try { recognizer.stop(); } catch(_){}
        try { recognizer.abort(); } catch(_){}
      }, 12000);
    } catch (_) {}
  };
  const stop = () => {
    try { recognizer.stop(); } catch(_){}
    // Fallback abort if end doesn't arrive quickly
    if (hardStopTimer) { clearTimeout(hardStopTimer); }
    hardStopTimer = setTimeout(() => { try { recognizer.abort(); } catch(_){} }, 1500);
  };
  return { start, stop };
}


