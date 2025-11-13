// Data Retention System
// Manages workout history with intelligent tiered storage

const PRS_KEY = 'pulsePRs';
const SUMMARIES_KEY = 'pulseMonthlySummaries';
const LAST_CLEANUP_KEY = 'pulseLastCleanup';
const HISTORY_KEY = 'pulseHistory';

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Load PRs from storage
export function loadPRs() {
  try {
    const stored = localStorage.getItem(PRS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (_) {
    return {};
  }
}

// Save PRs to storage
function savePRs(prs) {
  try {
    localStorage.setItem(PRS_KEY, JSON.stringify(prs));
  } catch (_) {}
}

// Load monthly summaries
export function loadSummaries() {
  try {
    const stored = localStorage.getItem(SUMMARIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (_) {
    return [];
  }
}

// Save monthly summaries
function saveSummaries(summaries) {
  try {
    localStorage.setItem(SUMMARIES_KEY, JSON.stringify(summaries));
  } catch (_) {}
}

// Check if a set is a PR (Personal Record)
function isPR(entry, currentPRs) {
  if (!entry.exercise || entry.weight <= 0 || entry.reps <= 0) return false;
  
  const exercise = entry.exercise;
  const currentPR = currentPRs[exercise];
  
  if (!currentPR) return true; // First time doing this exercise
  
  // PR by weight × reps (volume)
  const entryVolume = entry.weight * entry.reps;
  const prVolume = currentPR.weight * currentPR.reps;
  
  if (entryVolume > prVolume) return true;
  
  // PR by weight alone (if same reps)
  if (entry.reps === currentPR.reps && entry.weight > currentPR.weight) return true;
  
  // PR by reps alone (if same weight)
  if (entry.weight === currentPR.weight && entry.reps > currentPR.reps) return true;
  
  return false;
}

// Update PRs from history entries
function updatePRs(entries, currentPRs) {
  const updatedPRs = { ...currentPRs };
  let prsAdded = 0;
  
  entries.forEach(entry => {
    if (isPR(entry, updatedPRs)) {
      updatedPRs[entry.exercise] = {
        exercise: entry.exercise,
        weight: entry.weight,
        reps: entry.reps,
        date: entry.ts,
        volume: entry.weight * entry.reps
      };
      prsAdded++;
    }
  });
  
  return { prs: updatedPRs, count: prsAdded };
}

// Aggregate entries into monthly summary
function createMonthlySummary(entries) {
  if (entries.length === 0) return null;
  
  const firstDate = new Date(Math.min(...entries.map(e => e.ts)));
  const monthKey = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = firstDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  
  // Calculate stats
  const totalVolume = entries.reduce((sum, e) => sum + (e.weight * e.reps), 0);
  const uniqueExercises = new Set(entries.map(e => e.exercise));
  const exerciseCounts = {};
  entries.forEach(e => {
    exerciseCounts[e.exercise] = (exerciseCounts[e.exercise] || 0) + 1;
  });
  
  // Get top 5 exercises by frequency
  const topExercises = Object.entries(exerciseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);
  
  // Count unique workout days
  const workoutDays = new Set();
  entries.forEach(e => {
    const date = new Date(e.ts);
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    workoutDays.add(dayKey);
  });
  
  return {
    month: monthKey,
    monthLabel,
    workouts: workoutDays.size,
    totalVolume: Math.round(totalVolume),
    topExercises,
    totalSets: entries.length,
    exercises: uniqueExercises.size
  };
}

// Group entries by month
function groupByMonth(entries) {
  const byMonth = new Map();
  
  entries.forEach(entry => {
    const date = new Date(entry.ts);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!byMonth.has(monthKey)) {
      byMonth.set(monthKey, []);
    }
    byMonth.get(monthKey).push(entry);
  });
  
  return byMonth;
}

// Main cleanup function
export function cleanupWorkoutHistory(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return { history: [], prsUpdated: 0, summariesCreated: 0, archived: 0 };
  }
  
  const now = Date.now();
  const cutoffDate = now - SIX_MONTHS_MS;
  
  // Separate recent and old entries
  const recent = [];
  const old = [];
  
  history.forEach(entry => {
    if (entry.ts >= cutoffDate) {
      recent.push(entry);
    } else {
      old.push(entry);
    }
  });
  
  if (old.length === 0) {
    return { history: recent, prsUpdated: 0, summariesCreated: 0, archived: 0 };
  }
  
  // Update PRs from old entries before archiving
  const currentPRs = loadPRs();
  const { prs: updatedPRs, count: prsUpdated } = updatePRs(old, currentPRs);
  savePRs(updatedPRs);
  
  // Create monthly summaries from old entries
  const existingSummaries = loadSummaries();
  const summariesByMonth = new Map(existingSummaries.map(s => [s.month, s]));
  
  const oldByMonth = groupByMonth(old);
  let summariesCreated = 0;
  
  oldByMonth.forEach((monthEntries, monthKey) => {
    const summary = createMonthlySummary(monthEntries);
    if (summary) {
      // Merge with existing summary if present
      const existing = summariesByMonth.get(monthKey);
      if (existing) {
        // Combine summaries
        summary.workouts = Math.max(existing.workouts, summary.workouts);
        summary.totalVolume = existing.totalVolume + summary.totalVolume;
        summary.totalSets = existing.totalSets + summary.totalSets;
        summary.exercises = Math.max(existing.exercises, summary.exercises);
        // Merge top exercises
        const allTop = [...new Set([...existing.topExercises, ...summary.topExercises])];
        summary.topExercises = allTop.slice(0, 5);
      }
      summariesByMonth.set(monthKey, summary);
      summariesCreated++;
    }
  });
  
  saveSummaries(Array.from(summariesByMonth.values()));
  
  // Return only recent history
  return {
    history: recent,
    prsUpdated,
    summariesCreated,
    archived: old.length
  };
}

// Check if cleanup should run (weekly)
export function shouldRunCleanup() {
  try {
    const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
    if (!lastCleanup) return true;
    
    const lastCleanupTime = parseInt(lastCleanup, 10);
    const now = Date.now();
    
    return (now - lastCleanupTime) >= WEEK_MS;
  } catch (_) {
    return true;
  }
}

// Mark cleanup as completed
export function markCleanupComplete() {
  try {
    localStorage.setItem(LAST_CLEANUP_KEY, Date.now().toString());
  } catch (_) {}
}

// Export full history for user download
export function exportFullHistory(history = []) {
  const prs = loadPRs();
  const summaries = loadSummaries();
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    detailedHistory: history,
    personalRecords: prs,
    monthlySummaries: summaries,
    stats: {
      totalSets: history.length,
      totalPRs: Object.keys(prs).length,
      totalMonths: summaries.length
    }
  };
  
  return JSON.stringify(exportData, null, 2);
}

// Get retention stats for display
export function getRetentionStats() {
  const history = (() => {
    try {
      const h = localStorage.getItem(HISTORY_KEY);
      return h ? JSON.parse(h) : [];
    } catch (_) {
      return [];
    }
  })();
  
  const prs = loadPRs();
  const summaries = loadSummaries();
  
  const now = Date.now();
  const cutoffDate = now - SIX_MONTHS_MS;
  
  const recentCount = history.filter(e => e.ts >= cutoffDate).length;
  const oldCount = history.length - recentCount;
  
  return {
    recentEntries: recentCount,
    oldEntries: oldCount,
    totalPRs: Object.keys(prs).length,
    monthlySummaries: summaries.length,
    totalEntries: history.length
  };
}

