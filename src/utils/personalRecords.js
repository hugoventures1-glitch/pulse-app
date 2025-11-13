// Personal Records (PR) Management System
// Handles storing, retrieving, and managing personal records for exercises

const PR_STORAGE_KEY = 'personalRecords';
const PR_SETTINGS_KEY = 'prSettings';

// Default PR settings
const DEFAULT_SETTINGS = {
  notificationsEnabled: true,
  soundEnabled: true,
};

/**
 * Get all personal records
 * @returns {Array} Array of PR objects: { exercise, weight, reps, unit, date, id }
 */
export function getAllPRs() {
  try {
    const stored = localStorage.getItem(PR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error loading PRs:', e);
    return [];
  }
}

/**
 * Get PR for a specific exercise
 * @param {string} exerciseName - Name of the exercise
 * @returns {Object|null} PR object or null if no PR exists
 */
export function getExercisePR(exerciseName) {
  const allPRs = getAllPRs();
  const normalized = exerciseName.toLowerCase().trim();
  
  const pr = allPRs.find(p => p.exercise.toLowerCase().trim() === normalized);
  return pr || null;
}

/**
 * Check if a new weight/reps combination is a PR
 * @param {string} exerciseName - Name of the exercise
 * @param {number} weight - Weight in kg
 * @param {number} reps - Number of reps
 * @param {string} unit - Unit (default: 'kg')
 * @returns {Object|null} Returns PR object if it's a new PR, null otherwise
 */
export function checkForNewPR(exerciseName, weight, reps, unit = 'kg') {
  if (!exerciseName || !weight || weight <= 0 || !reps || reps <= 0) {
    return null;
  }

  const currentPR = getExercisePR(exerciseName);
  const volume = weight * reps;
  
  // If no PR exists, this is automatically a PR
  if (!currentPR) {
    const newPR = {
      id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      exercise: exerciseName,
      weight: weight,
      reps: reps,
      unit: unit,
      volume: volume,
      date: new Date().toISOString(),
    };
    savePR(newPR);
    return {
      ...newPR,
      isNewPR: true,
      previousWeight: null,
      previousReps: null,
      previousVolume: 0,
      weightDiff: weight,
      volumeDiff: volume,
    };
  }

  // Check if this beats the PR
  // Priority: Higher volume (weight × reps) wins
  // If same volume, higher weight wins
  const currentVolume = (currentPR.weight || 0) * (currentPR.reps || 0);
  
  let isNewPR = false;
  let reason = null;
  
  if (volume > currentVolume) {
    isNewPR = true;
    reason = 'volume';
  } else if (volume === currentVolume && weight > (currentPR.weight || 0)) {
    isNewPR = true;
    reason = 'weight';
  } else if (weight > (currentPR.weight || 0) && reps >= (currentPR.reps || 0)) {
    isNewPR = true;
    reason = 'weight';
  }
  
  if (isNewPR) {
    const newPR = {
      id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      exercise: exerciseName,
      weight: weight,
      reps: reps,
      unit: unit,
      volume: volume,
      date: new Date().toISOString(),
    };
    
    savePR(newPR);
    
    return {
      ...newPR,
      isNewPR: true,
      previousWeight: currentPR.weight,
      previousReps: currentPR.reps,
      previousVolume: currentVolume,
      weightDiff: weight - (currentPR.weight || 0),
      volumeDiff: volume - currentVolume,
      reason,
    };
  }
  
  return null;
}

/**
 * Save a new PR (replaces old PR for same exercise)
 * @param {Object} pr - PR object
 */
export function savePR(pr) {
  try {
    const allPRs = getAllPRs();
    const normalized = pr.exercise.toLowerCase().trim();
    
    // Remove old PR for this exercise
    const filtered = allPRs.filter(p => p.exercise.toLowerCase().trim() !== normalized);
    
    // Add new PR
    filtered.push(pr);
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    localStorage.setItem(PR_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('Error saving PR:', e);
    return false;
  }
}

/**
 * Delete a PR by ID
 * @param {string} prId - PR ID
 * @returns {boolean} Success status
 */
export function deletePR(prId) {
  try {
    const allPRs = getAllPRs();
    const filtered = allPRs.filter(p => p.id !== prId);
    localStorage.setItem(PR_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('Error deleting PR:', e);
    return false;
  }
}

/**
 * Delete all PRs
 * @returns {boolean} Success status
 */
export function clearAllPRs() {
  try {
    localStorage.setItem(PR_STORAGE_KEY, JSON.stringify([]));
    return true;
  } catch (e) {
    console.error('Error clearing PRs:', e);
    return false;
  }
}

/**
 * Get PR settings
 * @returns {Object} Settings object
 */
export function getPRSettings() {
  try {
    const stored = localStorage.getItem(PR_SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch (e) {
    console.error('Error loading PR settings:', e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update PR settings
 * @param {Object} settings - Settings to update
 * @returns {boolean} Success status
 */
export function updatePRSettings(settings) {
  try {
    const current = getPRSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(PR_SETTINGS_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error('Error updating PR settings:', e);
    return false;
  }
}

/**
 * Format PR date for display
 * @param {string} dateISO - ISO date string
 * @returns {string} Formatted date string
 */
export function formatPRDate(dateISO) {
  try {
    const date = new Date(dateISO);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch (e) {
    return 'Unknown';
  }
}

