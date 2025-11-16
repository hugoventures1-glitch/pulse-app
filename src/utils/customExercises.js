// Custom Exercise Management Utilities
// Handles saving, loading, and merging custom exercises with core library

const CUSTOM_EXERCISES_KEY = 'pulseCustomExercises';

/**
 * Equipment types for categorization
 */
export const EQUIPMENT_TYPES = [
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Bodyweight',
  'Kettlebell',
  'Resistance Band',
  'Other'
];

/**
 * Muscle groups (matching core library)
 */
export const MUSCLE_GROUPS = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'legs', label: 'Legs' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
  { id: 'full-body', label: 'Full Body' }
];

/**
 * Get all custom exercises from localStorage
 */
export function getCustomExercises() {
  try {
    const stored = localStorage.getItem(CUSTOM_EXERCISES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading custom exercises:', error);
    return [];
  }
}

/**
 * Save a custom exercise to localStorage
 * @param {Object} exercise - Exercise object with name, groupId, equipment (optional), aliases (optional)
 */
export function saveCustomExercise(exercise) {
  try {
    const customExercises = getCustomExercises();
    const existingIndex = customExercises.findIndex(
      (ex) => ex.name.toLowerCase() === exercise.name.toLowerCase()
    );

    const exerciseToSave = {
      name: exercise.name.trim(),
      groupId: exercise.groupId || 'full-body',
      groupLabel: exercise.groupLabel || 'Full Body',
      equipment: exercise.equipment || 'Other',
      aliases: exercise.aliases || [],
      bodyweight: exercise.bodyweight || false,
      isCustom: true,
      createdAt: existingIndex >= 0 ? customExercises[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing custom exercise
      customExercises[existingIndex] = exerciseToSave;
    } else {
      // Add new custom exercise
      customExercises.push(exerciseToSave);
    }

    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(customExercises));
    return true;
  } catch (error) {
    console.error('Error saving custom exercise:', error);
    return false;
  }
}

/**
 * Delete a custom exercise
 */
export function deleteCustomExercise(exerciseName) {
  try {
    const customExercises = getCustomExercises();
    const filtered = customExercises.filter(
      (ex) => ex.name.toLowerCase() !== exerciseName.toLowerCase()
    );
    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting custom exercise:', error);
    return false;
  }
}

/**
 * Check if an exercise name exists (in core library or custom exercises)
 */
export function exerciseExists(exerciseName) {
  const name = exerciseName.toLowerCase().trim();
  const customExercises = getCustomExercises();
  
  // Check custom exercises
  const inCustom = customExercises.some(
    (ex) => ex.name.toLowerCase() === name || 
            (ex.aliases || []).some(alias => alias.toLowerCase() === name)
  );
  
  return inCustom;
}

/**
 * Find custom exercise by name (case-insensitive)
 */
export function findCustomExercise(exerciseName) {
  const name = exerciseName.toLowerCase().trim();
  const customExercises = getCustomExercises();
  
  return customExercises.find(
    (ex) => ex.name.toLowerCase() === name ||
            (ex.aliases || []).some(alias => alias.toLowerCase() === name)
  );
}

/**
 * Auto-save exercise from voice input if it doesn't exist
 * @param {string} exerciseName - Name of exercise to save
 * @param {Object} options - Optional metadata (groupId, equipment, etc.)
 */
export function autoSaveExerciseFromVoice(exerciseName, options = {}) {
  if (!exerciseName || !exerciseName.trim()) return false;
  
  // Check if it already exists in core library or custom
  if (exerciseExists(exerciseName)) {
    return false; // Already exists, no need to save
  }

  // Auto-detect muscle group if not provided
  let groupId = options.groupId;
  let equipment = options.equipment || 'Other';
  
  if (!groupId) {
    // Simple keyword-based detection
    const nameLower = exerciseName.toLowerCase();
    if (nameLower.includes('chest') || nameLower.includes('bench') || nameLower.includes('press') && !nameLower.includes('overhead')) {
      groupId = 'chest';
    } else if (nameLower.includes('back') || nameLower.includes('row') || nameLower.includes('pull') || nameLower.includes('deadlift')) {
      groupId = 'back';
    } else if (nameLower.includes('leg') || nameLower.includes('squat') || nameLower.includes('lunge') || nameLower.includes('calf')) {
      groupId = 'legs';
    } else if (nameLower.includes('shoulder') || nameLower.includes('overhead') || nameLower.includes('lateral') || nameLower.includes('raise')) {
      groupId = 'shoulders';
    } else if (nameLower.includes('curl') || nameLower.includes('tricep') || nameLower.includes('bicep')) {
      groupId = 'arms';
    } else if (nameLower.includes('core') || nameLower.includes('ab') || nameLower.includes('plank') || nameLower.includes('crunch')) {
      groupId = 'core';
    } else {
      groupId = 'full-body';
    }
  }

  // Auto-detect equipment
  if (!options.equipment) {
    const nameLower = exerciseName.toLowerCase();
    if (nameLower.includes('push') || nameLower.includes('pull') || nameLower.includes('dip') || nameLower.includes('squat') && !nameLower.includes('barbell') && !nameLower.includes('dumbbell')) {
      equipment = 'Bodyweight';
    } else if (nameLower.includes('barbell') || nameLower.includes('bar')) {
      equipment = 'Barbell';
    } else if (nameLower.includes('dumbbell') || nameLower.includes('db ')) {
      equipment = 'Dumbbell';
    } else if (nameLower.includes('cable')) {
      equipment = 'Cable';
    } else if (nameLower.includes('machine')) {
      equipment = 'Machine';
    } else if (nameLower.includes('kettlebell')) {
      equipment = 'Kettlebell';
    }
  }

  const groupLabel = MUSCLE_GROUPS.find(g => g.id === groupId)?.label || 'Full Body';

  return saveCustomExercise({
    name: exerciseName.trim(),
    groupId,
    groupLabel,
    equipment,
    bodyweight: equipment === 'Bodyweight'
  });
}
