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
    const isFirstSet = context.isFirstSet !== undefined ? context.isFirstSet : false;

    let reps;
    let weight;
    let exercise;

    const notes = [];
    const needsConfirmation = [];

    // Check for completion commands with word boundaries
    // Must be standalone words to avoid matching "done" in "dumbbell" or "completed" in "completed bench press"
    const completionWordsRegex = /^(done|completed|finished|got it|complete|finish|all done|that's it|finished that)$/i;
    const completionWordsInText = /\b(done|completed|finished|finish|got it|complete|all done|that's it|finished that)\b/i;
    
    // Check if text is ONLY a completion word, or contains one as a standalone word
    const isOnlyCompletionWord = completionWordsRegex.test(text.trim());
    const containsCompletionWord = completionWordsInText.test(normalizedText);
    
    // Only treat as completion if:
    // 1. It's ONLY the completion word (e.g., "done")
    // 2. OR it contains a completion word AND we have an active exercise (context-aware)
    if (isOnlyCompletionWord || (containsCompletionWord && currentExercise)) {
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

    // Improved reps extraction - handle "for" → "4", "ate" → "8" in context
    // Patterns: "8 reps", "for reps", "ate reps", "8 times", etc.
    const repsPatterns = [
      /(\d+)\s*reps?/i,
      /(\d+)\s*(times|revs|wraps)/i,
      /for\s+(\d+)/i, // "for 8" → 8 reps
      /ate\s+(\d+)/i, // "ate 8" → 8 reps (speech-to-text error)
      /(\d+)\s*reps?\s*at/i,
      /(\d+)\s*reps?\s*with/i,
    ];
    
    for (const pattern of repsPatterns) {
      const match = text.match(pattern);
      if (match) {
        reps = parseInt(match[1], 10);
        if (reps > 0) break; // Stop at first valid match
      }
    }

    // Check for bodyweight keywords FIRST (before numeric weight matching)
    const bodyweightMatch = /\b(bodyweight|body\s+weight|bw|body\s+wt)\b/i.test(text);
    let isBodyweightVoice = false;
    
    if (bodyweightMatch) {
      isBodyweightVoice = true;
      weight = 0; // Set to 0 for bodyweight (will be marked as bodyweight)
    }

    // Improved weight extraction - handle multiple patterns
    if (weight === undefined) {
      const weightPatterns = [
        /(\d+)\s*(kg|kgs|kilos?|kilograms?)/i,
        /(\d+)\s*(lbs?|pounds?)/i,
        /at\s+(\d+)/i, // "at 80" → 80 kg
        /with\s+(\d+)/i, // "with 80" → 80 kg
        /(\d+)\s*kg\s*(?:×|x|for)/i,
      ];
      
      for (const pattern of weightPatterns) {
        const match = text.match(pattern);
        if (match) {
          weight = parseInt(match[1], 10);
          if (weight > 0) break; // Stop at first valid match
        }
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

    // Check if exercise is in bodyweight list OR if user explicitly said "bodyweight"
    const isBodyweight = BODYWEIGHT_EXERCISES.has(exercise) || isBodyweightVoice;

    if (hasMemory && lastLoggedSet) {
      const memoryLog = { ...lastLoggedSet };
      if (memoryKeywordsDetected.includes('same_all')) {
        // If last set was bodyweight, preserve bodyweight
        if (memoryLog.isBodyweight || memoryLog.weight === 0) {
          weight = 0;
          isBodyweightVoice = true; // Mark as bodyweight
        } else {
          weight = memoryLog.weight;
        }
        reps = memoryLog.reps;
        notes.push('memory_same_all');
      }
      if (memoryKeywordsDetected.includes('same_weight')) {
        // If last set was bodyweight, preserve bodyweight
        if (memoryLog.isBodyweight || memoryLog.weight === 0) {
          weight = 0;
          isBodyweightVoice = true; // Mark as bodyweight
        } else {
          weight = memoryLog.weight;
        }
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

    if (isBodyweight || isBodyweightVoice) {
      if (weight === undefined) {
        weight = hasMemory && lastLoggedSet ? (lastLoggedSet.isBodyweight ? 0 : lastLoggedSet.weight ?? 0) : 0;
        // If weight is 0 from last set and exercise is known bodyweight, mark as bodyweight
        if (weight === 0 && (BODYWEIGHT_EXERCISES.has(exercise) || (hasMemory && lastLoggedSet?.isBodyweight))) {
          isBodyweightVoice = true;
        }
      }
      // If user explicitly said bodyweight or it's a known bodyweight exercise, set weight to 0
      if (isBodyweightVoice || BODYWEIGHT_EXERCISES.has(exercise)) {
        weight = 0;
      }
      if (weight > 10 && !isBodyweightVoice) {
        notes.push('weight_high_for_bodyweight');
        needsConfirmation.push('weight_on_bodyweight');
      }
    }

    if (!isBodyweight && !isBodyweightVoice) {
      if (weight === undefined && sameWeightMatch && lastWeight !== null) {
        // Check if last weight was bodyweight
        if (lastWeight === 0 && (BODYWEIGHT_EXERCISES.has(exercise) || lastLoggedSet?.isBodyweight)) {
          weight = 0;
          isBodyweightVoice = true;
        } else {
          weight = lastWeight;
        }
        notes.push('using_last_weight');
      } else if (weight === undefined && hasMemory && lastLoggedSet) {
        // Check if last logged set was bodyweight
        if (lastLoggedSet.isBodyweight || (lastLoggedSet.weight === 0 && BODYWEIGHT_EXERCISES.has(exercise))) {
          weight = 0;
          isBodyweightVoice = true;
        } else {
          weight = lastLoggedSet.weight ?? weight;
        }
        if (weight !== undefined) notes.push('memory_weight');
      } else if (weight === undefined && !isFirstSet && lastWeight !== null) {
        // For subsequent sets, use last logged weight from same exercise
        // Check if last was bodyweight
        if (lastWeight === 0 && (BODYWEIGHT_EXERCISES.has(exercise) || lastLoggedSet?.isBodyweight)) {
          weight = 0;
          isBodyweightVoice = true;
        } else {
          weight = lastWeight;
        }
        notes.push('using_last_weight');
      } else if (weight === undefined && targetWeight !== null) {
        // Use target weight if available (works for both first and subsequent sets)
        // If user provided reps but not weight, and we have target weight, use it
        // This provides context-aware behavior: "9 reps" → use target weight (e.g., 60 kg)
        weight = targetWeight;
        notes.push('using_target_weight');
      }
    }

    if (reps === undefined && sameRepsMatch && lastReps !== null) {
      reps = lastReps;
    } else if (reps === undefined && hasMemory && lastLoggedSet) {
      reps = lastLoggedSet.reps ?? reps;
      if (reps !== undefined) notes.push('memory_reps');
    } else if (reps === undefined && !isFirstSet && lastReps !== null) {
      // For subsequent sets, use last logged reps from same exercise
      reps = lastReps;
      notes.push('using_last_reps');
    } else if (reps === undefined && targetReps !== null) {
      // Use target reps if available (works for both first and subsequent sets)
      // If user provided weight but not reps, and we have target reps, use it
      // This provides context-aware behavior: "60 kg" → use target reps (e.g., 10 reps)
      reps = targetReps;
      notes.push('using_target_reps');
    }

    // Check if we need confirmation for missing reps
    // Only ask if we couldn't fill from context (target reps, last reps, etc.)
    // If targetReps or lastReps was used, don't ask for confirmation
    const usedTargetOrLastReps = notes.includes('using_target_reps') || notes.includes('using_last_reps') || notes.includes('memory_reps');
    if ((reps === undefined || reps <= 0) && !usedTargetOrLastReps) {
      // Only ask for confirmation if we couldn't fill reps from context
      needsConfirmation.push('missing_reps');
    } else if (reps > 50) {
      needsConfirmation.push('high_reps');
    }

    // Check if we need confirmation for missing weight
    // Only ask if we couldn't fill from context (target weight, last weight, etc.)
    // If targetWeight or lastWeight was used, don't ask for confirmation
    const usedTargetOrLastWeight = notes.includes('using_target_weight') || notes.includes('using_last_weight') || notes.includes('memory_weight');
    if (!isBodyweight && !isBodyweightVoice && (weight === undefined || weight < 0) && !usedTargetOrLastWeight) {
      // Special case: If it's a known bodyweight exercise and user only gave reps, assume bodyweight
      if (BODYWEIGHT_EXERCISES.has(exercise) && reps !== undefined) {
        weight = 0;
        isBodyweightVoice = true;
      } else {
        // Only ask for confirmation if we couldn't fill weight from context
        needsConfirmation.push('missing_weight');
      }
    }

    // If it's a known bodyweight exercise or user said bodyweight, don't ask for weight confirmation
    if ((isBodyweight || isBodyweightVoice) && weight > 10 && !isBodyweightVoice) {
      needsConfirmation.push('weight_on_bodyweight');
    }

    if (!isBodyweight && !isBodyweightVoice && weight !== undefined && weight !== null) {
      if (weight > 350) {
        needsConfirmation.push('weight_unusually_high');
      } else if (weight === 0 && !BODYWEIGHT_EXERCISES.has(exercise)) {
        // Only flag weight_zero if it's not a known bodyweight exercise
        needsConfirmation.push('weight_zero');
      }
    }

    // Calculate confidence score for auto-logging decisions
    // High confidence = exercise + reps + weight all clearly provided
    let confidenceScore = 0;
    if (exercise) confidenceScore += 0.4;
    if (reps !== undefined && reps > 0) confidenceScore += 0.3;
    if ((weight !== undefined && weight > 0) || isBodyweight || isBodyweightVoice) confidenceScore += 0.3;
    
    // Boost confidence if using context (same exercise, same weight/reps as before)
    if (hasMemory && lastLoggedSet) {
      confidenceScore += 0.2;
    }
    // Boost confidence if exercise is in workout plan
    if (currentExercise && exercise === currentExercise) {
      confidenceScore += 0.1;
    }

    // Reduce confirmations for high-confidence matches
    // If confidence is very high (≥0.8) and all data is present, don't require confirmation
    const isHighConfidence = confidenceScore >= 0.8 && exercise && reps !== undefined && reps > 0 && 
      ((weight !== undefined && weight > 0) || isBodyweight || isBodyweightVoice);
    
    // Only keep critical confirmations for high-confidence matches
    if (isHighConfidence) {
      // Still confirm on: unusually high values, ambiguous exercises, weight_zero
      const criticalConfirmations = needsConfirmation.filter(reason => 
        ['weight_unusually_high', 'high_reps', 'weight_on_bodyweight'].includes(reason)
      );
      needsConfirmation.length = 0;
      needsConfirmation.push(...criticalConfirmations);
    }

    if (needsConfirmation.length > 0) {
      console.warn('Parser uncertainty:', {
        exercise,
        reps,
        weight,
        reasons: needsConfirmation,
        rawText,
        confidenceScore,
        isHighConfidence,
      });
    }

    // Final bodyweight determination: either known bodyweight exercise OR user explicitly said bodyweight
    const finalIsBodyweight = isBodyweight || isBodyweightVoice;
    const sanitizedWeight = (finalIsBodyweight && (weight === undefined || weight === null)) ? 0 : weight;

    if (reps === undefined && needsConfirmation.length === 0) {
      return { error: 'Could not understand reps. Please try again.', rawText };
    }

    return {
      exercise,
      weight: sanitizedWeight,
      reps: reps ?? null,
      sets: 1,
      rawText,
      isBodyweight: finalIsBodyweight,
      needsConfirmation,
      notes,
      confidenceScore, // Add confidence score for auto-logging decisions
      isHighConfidence, // Flag for high-confidence matches
    };
  } catch (error) {
    console.error('Parser failure', error);
    return { error: 'Parsing failed' };
  }
}
