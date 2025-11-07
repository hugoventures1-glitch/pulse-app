// Simple Web Speech API wrapper with tap-to-toggle start/stop
import { debugLog } from '../utils/debugLogger';

export function isSpeechSupported() {
  return typeof window !== 'undefined' && (
    window.SpeechRecognition || window.webkitSpeechRecognition
  );
}

export function createRecognizer({ lang = 'en-US', interim = true, continuous = true } = {}) {
  debugLog("createRecognizer called", { lang, interim, continuous });
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    debugLog("Speech Recognition not supported");
    return null;
  }
  const apiName = SR === window.SpeechRecognition ? "SpeechRecognition" : "webkitSpeechRecognition";
  debugLog("Speech Recognition API found", { api: apiName });
  const rec = new SR();
  rec.lang = lang;
  // Use continuous mode for tap-to-toggle UX; keeps listening until explicitly stopped
  rec.continuous = continuous;
  rec.interimResults = interim;
  debugLog("Recognizer created with settings", {
    lang: rec.lang,
    continuous: rec.continuous,
    interimResults: rec.interimResults
  });
  return rec;
}

export function attachPressHold(recognizer, {
  onTranscript,
  onStart,
  onEnd,
  onError,
}) {
  debugLog("attachPressHold called", { recognizerExists: !!recognizer });
  if (!recognizer) {
    debugLog("No recognizer provided, returning empty functions");
    return () => {};
  }
  let isActive = false;
  let buffer = '';
  let hardStopTimer = null;
  debugLog("Setting up event handlers...");

  recognizer.onresult = (e) => {
    debugLog("SpeechRecognition.onresult fired", { 
      resultIndex: e.resultIndex, 
      resultsLength: e.results.length 
    });
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res[0] && res[0].transcript) {
        const t = res[0].transcript.trim();
        debugLog(`Result [${i}]`, { text: t, isFinal: res.isFinal });
        if (res.isFinal) {
          buffer = `${buffer} ${t}`.trim();
          debugLog("Final transcript buffer", { buffer });
        } else {
          debugLog("Interim result", { text: t });
          // Optionally stream interim results here
        }
      }
    }
  };
  recognizer.onstart = () => {
    debugLog("SpeechRecognition.onstart fired");
    debugLog("Recognizer state: ACTIVE");
    isActive = true;
    buffer = '';
    onStart && onStart();
  };
  const finalize = () => {
    debugLog("Finalizing transcript...");
    if (hardStopTimer) { 
      debugLog("Clearing hardStopTimer in finalize");
      clearTimeout(hardStopTimer); 
      hardStopTimer = null; 
    }
    if (buffer && onTranscript) {
      debugLog("Calling onTranscript with buffer", { buffer: buffer.trim() });
      onTranscript(buffer.trim());
    } else {
      debugLog("No transcript to send", { 
        bufferEmpty: !buffer, 
        noCallback: !onTranscript 
      });
    }
    buffer = '';
  };
  recognizer.onaudioend = () => { 
    debugLog("SpeechRecognition.onaudioend fired");
    /* some browsers fire this before end */ 
  };
  // Don't auto-stop on speech end for continuous mode - let user toggle manually
  recognizer.onspeechend = () => { 
    debugLog("SpeechRecognition.onspeechend fired (keeping listening in continuous mode)");
    /* Keep listening in continuous mode */ 
  };
  recognizer.onend = () => {
    debugLog("SpeechRecognition.onend fired", { isActive });
    if (!isActive) {
      debugLog("Ignoring onend - already inactive");
      return; // prevent double-calls
    }
    isActive = false;
    debugLog("Finalizing transcript", { buffer });
    finalize();
    onEnd && onEnd();
  };
  recognizer.onerror = (ev) => {
    debugLog("SpeechRecognition.onerror fired");
    debugLog("Error event", {
      error: ev.error,
      message: ev.message,
      type: ev.type,
      timeStamp: ev.timeStamp
    });
    if (hardStopTimer) { clearTimeout(hardStopTimer); hardStopTimer = null; }
    isActive = false;
    onError && onError(ev);
  };

  const start = () => {
    debugLog("SpeechRecognition.start() called");
    debugLog("Current recognizer state", { isActive });
    debugLog("Requesting microphone...");
    try {
      if (isActive) { 
        debugLog("Recognizer already active, aborting first...");
        try { recognizer.abort(); } catch(e){ debugLog("Abort error (expected)", { error: e.message }); }
      }
      debugLog("Calling recognizer.start()...");
      recognizer.start();
      debugLog("recognizer.start() called successfully");
      debugLog("Microphone granted");
      // Safety timer: force end if browser never fires onend
      hardStopTimer = setTimeout(() => {
        debugLog("Safety timer expired (12s), forcing stop...");
        try { recognizer.stop(); } catch(_){}
        try { recognizer.abort(); } catch(_){}
      }, 12000);
    } catch (e) {
      debugLog("Error in recognizer.start()", {
        name: e.name,
        message: e.message,
        error: e.error || 'Unknown error'
      });
    }
  };
  const stop = () => {
    debugLog("SpeechRecognition.stop() called");
    debugLog("Current recognizer state", { isActive });
    try { 
      recognizer.stop(); 
      debugLog("recognizer.stop() called successfully");
    } catch(e) {
      debugLog("Error in recognizer.stop()", {
        name: e.name,
        message: e.message
      });
    }
    // Fallback abort if end doesn't arrive quickly
    if (hardStopTimer) { 
      debugLog("Clearing hardStopTimer");
      clearTimeout(hardStopTimer); 
    }
    hardStopTimer = setTimeout(() => { 
      debugLog("Fallback abort after 1.5s...");
      try { recognizer.abort(); } catch(_){} 
    }, 1500);
  };
  return { start, stop };
}


