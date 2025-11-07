// On-screen debug logger for mobile testing

let logs = [];
const MAX_LOGS = 15;
let listeners = [];

export function debugLog(message, data = null) {
  const timestamp = new Date();
  const timeStr = timestamp.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
  
  const logEntry = {
    id: Date.now() + Math.random(),
    timestamp: timeStr,
    message: data ? `${message} ${JSON.stringify(data)}` : message
  };
  
  logs.unshift(logEntry); // Add to beginning
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(0, MAX_LOGS); // Keep only latest 15
  }
  
  // Also log to console for desktop debugging
  console.log(`[${timeStr}] ${message}`, data || '');
  
  // Notify listeners
  listeners.forEach(listener => listener([...logs]));
}

export function getLogs() {
  return [...logs];
}

export function clearLogs() {
  logs = [];
  listeners.forEach(listener => listener([...logs]));
}

export function subscribe(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

