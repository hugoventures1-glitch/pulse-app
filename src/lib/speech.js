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
    isManualStop = false;
    try {
      if (isActive) { 
        try { recognizer.abort(); } catch(_) {}
      }
      startTime = Date.now();
      recognizer.start();
      safetyTimer = setTimeout(() => {
        if (!isManualStop) {
          try { recognizer.stop(); } catch(_){}
          try { recognizer.abort(); } catch(_){}
        }
      }, 12000);
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


