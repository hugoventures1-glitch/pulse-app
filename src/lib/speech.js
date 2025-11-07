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
  let safetyTimer = null; // Track safety timer separately
  let startTime = null; // Track when start() was called
  let isManualStop = false; // Track if user manually stopped
  const MIN_RECORDING_TIME = 100; // Very short minimum to prevent accidental double-taps (100ms)
  
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
    isManualStop = false; // Reset on start
    onStart && onStart();
  };
  const finalize = () => {
    debugLog("Finalizing transcript...");
    // Cancel ALL timers when finalizing
    if (safetyTimer) { 
      debugLog("Clearing safetyTimer in finalize");
      clearTimeout(safetyTimer); 
      safetyTimer = null; 
    }
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
    debugLog("SpeechRecognition.onend fired", { isActive, isManualStop });
    if (!isActive) {
      debugLog("Ignoring onend - already inactive");
      return; // prevent double-calls
    }
    isActive = false;
    
    // Cancel safety timer since we're ending naturally
    if (safetyTimer) {
      debugLog("Cancelling safety timer (onend fired)");
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    
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
    // Cancel all timers on error
    if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
    if (hardStopTimer) { clearTimeout(hardStopTimer); hardStopTimer = null; }
    isActive = false;
    isManualStop = false; // Reset on error
    onError && onError(ev);
  };

  const start = () => {
    debugLog("=== BEFORE recognizer.start() ===");
    debugLog("SpeechRecognition.start() called");
    debugLog("Current recognizer state", { isActive });
    debugLog("Requesting microphone...");
    
    // Reset manual stop flag
    isManualStop = false;
    
    try {
      if (isActive) { 
        debugLog("Recognizer already active, aborting first...");
        try { recognizer.abort(); } catch(e){ debugLog("Abort error (expected)", { error: e.message }); }
      }
      debugLog("Calling recognizer.start()...");
      startTime = Date.now(); // Record start time
      recognizer.start();
      debugLog("=== AFTER recognizer.start() ===");
      debugLog("recognizer.start() called successfully");
      debugLog("Microphone granted");
      // Safety timer: ONLY fire if user doesn't manually stop
      safetyTimer = setTimeout(() => {
        if (!isManualStop) {
          debugLog("Safety timer expired (12s) - user did NOT manually stop, forcing stop...");
          try { recognizer.stop(); } catch(_){}
          try { recognizer.abort(); } catch(_){}
        } else {
          debugLog("Safety timer expired but user already stopped manually, ignoring");
        }
      }, 12000);
    } catch (e) {
      debugLog("=== ERROR in recognizer.start() ===");
      debugLog("Error in recognizer.start()", {
        name: e.name,
        message: e.message,
        error: e.error || 'Unknown error'
      });
      startTime = null;
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
    }
  };
  const stop = () => {
    debugLog("=== USER MANUALLY STOPPED ===");
    debugLog("SpeechRecognition.stop() called");
    debugLog("Current recognizer state", { isActive });
    
    // Mark as manual stop to prevent safety timer from firing
    isManualStop = true;
    
    // IMMEDIATELY cancel ALL timers
    if (safetyTimer) {
      debugLog("Cancelling safety timer (user manually stopped)");
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    if (hardStopTimer) {
      debugLog("Cancelling hardStopTimer");
      clearTimeout(hardStopTimer);
      hardStopTimer = null;
    }
    
    // Very short guard: Only prevent accidental double-taps (100ms)
    if (startTime !== null) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_RECORDING_TIME) {
        const remaining = MIN_RECORDING_TIME - elapsed;
        debugLog(`Stop() called very soon (${elapsed}ms), waiting ${remaining}ms to prevent double-tap...`);
        setTimeout(() => {
          debugLog(`Double-tap guard elapsed, now stopping`);
          performStop();
        }, remaining);
        return;
      }
    }
    
    performStop();
  };
  
  const performStop = () => {
    debugLog("Performing immediate stop...");
    try { 
      recognizer.stop(); 
      debugLog("recognizer.stop() called successfully");
      startTime = null;
      
      // Note: onend will fire and call finalize(), so we don't need to call it here
      // Just wait for the browser to fire onend naturally
      debugLog("Waiting for onend event to process transcript...");
    } catch(e) {
      debugLog("Error in recognizer.stop()", {
        name: e.name,
        message: e.message
      });
      // If stop() fails, manually finalize since onend might not fire
      if (buffer && isActive) {
        debugLog("Stop() failed, processing buffer manually");
        isActive = false;
        finalize();
        onEnd && onEnd();
      }
    }
    
    // No fallback timer - user stopped manually, process immediately via onend
    debugLog("Manual stop complete, all timers cancelled, waiting for onend...");
  };
  return { start, stop };
}


