// Claude Sonnet API utility -- DISABLED: @anthropic-ai/sdk removed
// You must implement actual Claude integration elsewhere

export async function callClaude(prompt, transcript) {
  throw new Error('Anthropic integration is disabled: @anthropic-ai/sdk has been removed.');
}

export async function parseWorkoutWithClaude(transcript, context = {}) {
  try {
    if (!transcript || typeof transcript !== "string") return { error: "Nothing to parse" };
    let text = transcript.toLowerCase().trim();
    
    // Extract context values
    const currentExercise = context.currentExercise || null;
    const lastWeight = context.lastWeight || null;
    const lastReps = context.lastReps || null;
    const targetWeight = context.targetWeight || null;
    const targetReps = context.targetReps || null;
    
    let reps, weight, exercise;
    
    // Quick completion commands - use target values
    const completionWords = /^(done|completed|finished|got it|complete|finish)$/;
    if (completionWords.test(text)) {
      if (!currentExercise) {
        return { error: "No active exercise. Please specify the exercise name." };
      }
      if (targetWeight === null || targetReps === null) {
        return { error: "No target values set. Please specify reps and weight." };
      }
      return {
        exercise: currentExercise,
        weight: targetWeight,
        reps: targetReps,
        sets: 1,
        isQuickComplete: true // Flag to indicate this was a quick completion
      };
    }
    
    // Handle "same weight", "same reps", "one more", "another set"
    const sameWeightMatch = text.match(/same\s+weight|same\s+kg|same\s+kilos/);
    const sameRepsMatch = text.match(/same\s+reps/);
    const oneMoreMatch = text.match(/one\s+more|another\s+set|repeat/);
    
    if (oneMoreMatch && lastWeight && lastReps && currentExercise) {
      // Repeat last set exactly
      return {
        exercise: currentExercise,
        weight: lastWeight,
        reps: lastReps,
        sets: 1
      };
    }
    
    // Handle "add X kilos/kg" or "up to X"
    const addWeightMatch = text.match(/add\s+(\d+)\s*(kg|kgs|kilos?|kilograms?)|up\s+to\s+(\d+)\s*(kg|kgs|kilos?|kilograms?)/);
    if (addWeightMatch && lastWeight) {
      const addAmount = parseInt(addWeightMatch[1] || addWeightMatch[3], 10);
      weight = lastWeight + addAmount;
    }
    
    // Handle "subtract X kilos/kg" or "down to X"
    const subtractWeightMatch = text.match(/subtract\s+(\d+)\s*(kg|kgs|kilos?|kilograms?)|down\s+to\s+(\d+)\s*(kg|kgs|kilos?|kilograms?)/);
    if (subtractWeightMatch && lastWeight) {
      const subAmount = parseInt(subtractWeightMatch[1] || subtractWeightMatch[3], 10);
      weight = Math.max(0, lastWeight - subAmount);
    }
    
    // Find reps
    let repsMatch = text.match(/(\d+)\s*reps?|(\d+)\s*(times|revs|wraps)/);
    if (repsMatch) {
      reps = parseInt(repsMatch[1] || repsMatch[2], 10);
    }
    
    // Find weight (only if not already set from "add/subtract")
    if (!weight) {
      let weightMatch = text.match(/(\d+)\s*(kg|kgs|kilos?|kilograms?)/);
      if (weightMatch) {
        weight = parseInt(weightMatch[1], 10);
      }
    }
    
    // Find exercise name (fuzzy match against common exercises)
    const exerciseKeywords = [
      { pattern: /bench|press/, name: 'Bench Press' },
      { pattern: /squat/, name: 'Squat' },
      { pattern: /deadlift/, name: 'Deadlift' },
      { pattern: /shoulder|overhead|ohp/, name: 'Shoulder Press' },
      { pattern: /row/, name: 'Barbell Rows' },
      { pattern: /pull.?up/, name: 'Pull-ups' },
      { pattern: /curl/, name: 'Bicep Curls' },
      { pattern: /tricep|dip/, name: 'Tricep Extensions' },
      { pattern: /leg\s+press/, name: 'Leg Press' },
      { pattern: /leg\s+curl/, name: 'Leg Curls' },
      { pattern: /calf/, name: 'Calf Raises' },
      { pattern: /lateral/, name: 'Lateral Raises' },
      { pattern: /lunges?/, name: 'Lunges' },
      { pattern: /face\s+pull/, name: 'Face Pulls' }
    ];
    
    for (const { pattern, name } of exerciseKeywords) {
      if (pattern.test(text)) {
        exercise = name;
        break;
      }
    }
    
    // Apply context fallbacks
    if (!exercise && currentExercise) {
      exercise = currentExercise;
    }
    
    if (!weight && sameWeightMatch && lastWeight) {
      weight = lastWeight;
    } else if (!weight && lastWeight) {
      weight = lastWeight;
    } else if (!weight && targetWeight) {
      weight = targetWeight;
    }
    
    if (!reps && sameRepsMatch && lastReps) {
      reps = lastReps;
    } else if (!reps && targetReps) {
      reps = targetReps;
    }
    
    // Final validation
    let result;
    if (exercise && (weight !== null && weight !== undefined) && (reps !== null && reps !== undefined)) {
      result = { exercise, weight, reps, sets: 1 };
    } else if (exercise && reps && weight) {
      result = { exercise, weight, reps, sets: 1 };
    } else {
      result = { error: "Could not understand, please try again" };
    }
    
    return result;
  } catch (error) {
    return { error: 'Parsing failed' };
  }
}
