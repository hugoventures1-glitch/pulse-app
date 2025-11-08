// Claude Sonnet API utility -- DISABLED: @anthropic-ai/sdk removed
// You must implement actual Claude integration elsewhere

import { EXERCISE_ALIAS_MAP, BODYWEIGHT_EXERCISES } from '../data/exerciseLibrary';

export async function callClaude(prompt, transcript) {
  throw new Error('Anthropic integration is disabled: @anthropic-ai/sdk has been removed.');
}

export async function parseWorkoutWithClaude(transcript, context = {}) {
  try {
    if (!transcript || typeof transcript !== "string") return { error: "Nothing to parse" };
    const rawText = transcript.trim();
    let text = rawText.toLowerCase();
    const normalizedText = ` ${text} `;

    const currentExercise = context.currentExercise || null;
    const lastWeight = context.lastWeight || null;
    const lastReps = context.lastReps || null;
    const targetWeight = context.targetWeight || null;
    const targetReps = context.targetReps || null;
    const lastLoggedSet = context.lastLoggedSet || null;

    let reps;
    let weight;
    let exercise;

    const notes = [];
    const needsConfirmation = [];

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
        isQuickComplete: true,
        rawText,
        needsConfirmation: [],
      };
    }

    const sameWeightMatch = text.match(/same\s+weight/);
    const sameRepsMatch = text.match(/same\s+reps/);
    const repeatAllMatch = text.match(/same as before|repeat|again\b|^same$/);
    const memoryKeywordsDetected = [];

    if (repeatAllMatch) memoryKeywordsDetected.push('same_all');
    if (sameWeightMatch) memoryKeywordsDetected.push('same_weight');
    if (sameRepsMatch) memoryKeywordsDetected.push('same_reps');

    if (memoryKeywordsDetected.length > 0) {
      console.log('Memory keywords detected:', memoryKeywordsDetected.join(', '));
    }

    const addWeightMatch = text.match(/add\s+(\d+)\s*(kg|kgs|kilos?|kilograms?)|up\s+to\s+(\d+)\s*(kg|kgs|kilos?|kilograms?)/);
    if (addWeightMatch && lastWeight !== null && lastWeight !== undefined) {
      const addAmount = parseInt(addWeightMatch[1] || addWeightMatch[3], 10);
      weight = lastWeight + addAmount;
    }

    const subtractWeightMatch = text.match(/subtract\s+(\d+)\s*(kg|kgs|kilos?|kilograms?)|down\s+to\s+(\d+)\s*(kg|kgs|kilos?|kilograms?)/);
    if (subtractWeightMatch && lastWeight !== null && lastWeight !== undefined) {
      const subAmount = parseInt(subtractWeightMatch[1] || subtractWeightMatch[3], 10);
      weight = Math.max(0, lastWeight - subAmount);
    }

    const repsMatch = text.match(/(\d+)\s*reps?|(\d+)\s*(times|revs|wraps)/);
    if (repsMatch) {
      reps = parseInt(repsMatch[1] || repsMatch[2], 10);
    }

    if (weight === undefined) {
      const weightMatch = text.match(/(\d+)\s*(kg|kgs|kilos?|kilograms?)/);
      if (weightMatch) {
        weight = parseInt(weightMatch[1], 10);
      }
    }

    if (!exercise) {
      for (const [alias, canonical] of EXERCISE_ALIAS_MAP.entries()) {
        const needle = ` ${alias} `;
        if (normalizedText.includes(needle) || normalizedText.endsWith(alias) || normalizedText.startsWith(`${alias} `)) {
          exercise = canonical;
          break;
        }
      }
    }

    const hasMemory = memoryKeywordsDetected.length > 0;

    if (!exercise) {
      if (hasMemory && lastLoggedSet?.exercise) {
        exercise = lastLoggedSet.exercise;
        notes.push('used_last_exercise');
      } else if (currentExercise) {
        exercise = currentExercise;
        notes.push('used_current_exercise');
      }
    }

    if (!exercise) {
      return { error: 'Could not understand the exercise. Please try again.', rawText };
    }

    const isBodyweight = BODYWEIGHT_EXERCISES.has(exercise);

    if (hasMemory && lastLoggedSet) {
      const memoryLog = { ...lastLoggedSet };
      if (memoryKeywordsDetected.includes('same_all')) {
        weight = memoryLog.weight;
        reps = memoryLog.reps;
        notes.push('memory_same_all');
      }
      if (memoryKeywordsDetected.includes('same_weight')) {
        weight = memoryLog.weight;
        notes.push('memory_same_weight');
      }
      if (memoryKeywordsDetected.includes('same_reps')) {
        reps = memoryLog.reps;
        notes.push('memory_same_reps');
      }
    } else if (hasMemory && !lastLoggedSet) {
      needsConfirmation.push('no_previous_set');
      notes.push('memory_without_previous');
    }

    if (isBodyweight) {
      if (weight === undefined) {
        weight = hasMemory && lastLoggedSet ? lastLoggedSet.weight ?? 0 : 0;
      }
      if (weight > 10) {
        notes.push('weight_high_for_bodyweight');
        needsConfirmation.push('weight_on_bodyweight');
      }
    }

    if (!isBodyweight) {
      if (weight === undefined && sameWeightMatch && lastWeight !== null) {
        weight = lastWeight;
      } else if (weight === undefined && hasMemory && lastLoggedSet) {
        weight = lastLoggedSet.weight ?? weight;
        if (weight !== undefined) notes.push('memory_weight');
      } else if (weight === undefined && targetWeight !== null) {
        weight = targetWeight;
        notes.push('using_target_weight');
      }
    }

    if (reps === undefined && sameRepsMatch && lastReps !== null) {
      reps = lastReps;
    } else if (reps === undefined && hasMemory && lastLoggedSet) {
      reps = lastLoggedSet.reps ?? reps;
      if (reps !== undefined) notes.push('memory_reps');
    } else if (reps === undefined && targetReps !== null) {
      reps = targetReps;
      notes.push('using_target_reps');
    }

    if (reps === undefined || reps <= 0) {
      needsConfirmation.push('missing_reps');
    } else if (reps > 50) {
      needsConfirmation.push('high_reps');
    }

    if (!isBodyweight && (weight === undefined || weight < 0)) {
      needsConfirmation.push('missing_weight');
    }

    if (isBodyweight && weight > 0) {
      needsConfirmation.push('weight_on_bodyweight');
    }

    if (!isBodyweight && weight !== undefined && weight !== null) {
      if (weight > 350) {
        needsConfirmation.push('weight_unusually_high');
      } else if (weight === 0) {
        needsConfirmation.push('weight_zero');
      }
    }

    if (needsConfirmation.length > 0) {
      console.warn('Parser uncertainty:', {
        exercise,
        reps,
        weight,
        reasons: needsConfirmation,
        rawText,
      });
    }

    const sanitizedWeight = (isBodyweight && (weight === undefined || weight === null)) ? 0 : weight;

    if (reps === undefined && needsConfirmation.length === 0) {
      return { error: 'Could not understand reps. Please try again.', rawText };
    }

    return {
      exercise,
      weight: sanitizedWeight,
      reps: reps ?? null,
      sets: 1,
      rawText,
      isBodyweight,
      needsConfirmation,
      notes,
    };
  } catch (error) {
    console.error('Parser failure', error);
    return { error: 'Parsing failed' };
  }
}
