export function isSpeechSupported() {
  return typeof window !== 'undefined' && (
    window.SpeechRecognition || window.webkitSpeechRecognition
  );
}

export function createRecognizer({ lang = 'en-US', interim = true, continuous = true } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    return null;
  }
  const rec = new SR();
  rec.lang = lang;
  rec.continuous = continuous;
  rec.interimResults = interim;
  return rec;
}

export function attachPressHold(recognizer, {
  onTranscript,
  onStart,
  onEnd,
  onError,
}) {
  if (!recognizer) {
    return {
      start: () => {},
      stop: () => {},
    };
  }
  let isActive = false;
  let buffer = '';
  let safetyTimer = null;
  let startTime = null;
  let isManualStop = false;
  const MIN_RECORDING_TIME = 100;

  recognizer.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res[0] && res[0].transcript) {
        const t = res[0].transcript.trim();
        if (res.isFinal) {
          buffer = `${buffer} ${t}`.trim();
        }
      }
    }
  };
  recognizer.onstart = () => {
    isActive = true;
    buffer = '';
    isManualStop = false;
    // Clear any pending safety timers to prevent immediate stop
    if (safetyTimer) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    onStart && onStart();
  };
  const finalize = () => {
    if (safetyTimer) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    if (buffer && onTranscript) {
      onTranscript(buffer.trim());
    }
    buffer = '';
  };
  recognizer.onaudioend = () => {};
  recognizer.onspeechend = () => {};
  recognizer.onend = () => {
    if (!isActive) {
      return;
    }
    isActive = false;

    if (safetyTimer) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    finalize();
    onEnd && onEnd();
  };
  recognizer.onerror = (ev) => {
    if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
    
    // Some mobile browsers fire immediate "no-speech" errors right after start
    // If this happens very quickly (< 500ms), ignore it as it's likely a false positive
    const errorName = ev?.error || '';
    const timeSinceStart = startTime ? Date.now() - startTime : Infinity;
    const isQuickError = timeSinceStart < 500;
    
    // Ignore "no-speech" errors that happen immediately after start (mobile browser quirk)
    if (errorName === 'no-speech' && isQuickError && !isManualStop) {
      // Don't reset state - might be a false positive
      // Continue recording and let user speak
      return;
    }
    
    // Real error or manual stop - reset state
    isActive = false;
    isManualStop = false;
    onError && onError(ev);
  };

  const performStop = () => {
    try {
      recognizer.stop();
      startTime = null;
    } catch (e) {
      if (buffer && isActive) {
        isActive = false;
        finalize();
        onEnd && onEnd();
      }
    }
  };

  const start = () => {
    // Prevent starting if already active (mobile browser issue)
    if (isActive) {
      return;
    }
    
    isManualStop = false;
    try {
      // Abort any existing recognition first
      try { 
        if (recognizer.state === 'listening' || recognizer.state === 'starting') {
          recognizer.abort(); 
        }
      } catch(_) {}
      
      // Small delay to ensure previous recognition is fully stopped (mobile fix)
      // This prevents the browser from immediately stopping recognition after start
      setTimeout(() => {
        try {
          // Double-check not already active (state might have changed)
          if (!isActive && !isManualStop) {
            startTime = Date.now();
            recognizer.start();
            // Reset safety timer
            safetyTimer = setTimeout(() => {
              if (!isManualStop && isActive) {
                try { recognizer.stop(); } catch(_){}
                try { recognizer.abort(); } catch(_){}
              }
            }, 12000);
          }
        } catch (e) {
          // If error starting (e.g., already started), reset state
          isActive = false;
          startTime = null;
          if (safetyTimer) {
            clearTimeout(safetyTimer);
            safetyTimer = null;
          }
        }
      }, 150); // 150ms delay to prevent immediate stop on mobile browsers
    } catch (e) {
      startTime = null;
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
    }
  };
  const stop = () => {
    isManualStop = true;
    if (safetyTimer) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    if (startTime !== null) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RECORDING_TIME) {
        const remaining = MIN_RECORDING_TIME - elapsed;
        setTimeout(() => {
          performStop();
        }, remaining);
        return;
      }
    }
    performStop();
  };
  return { start, stop };
}


