// Fuzzy matching utilities for exercise name matching

/**
 * Levenshtein distance calculation (edit distance)
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score based on first characters match
 * Heavily weights the first few characters for better accuracy
 */
function prefixSimilarity(query, target) {
  const minLen = Math.min(query.length, target.length);
  const checkLen = Math.min(minLen, 4); // Check first 4 characters
  
  let matches = 0;
  for (let i = 0; i < checkLen; i++) {
    if (query[i] === target[i]) {
      matches++;
    } else {
      break; // Stop at first mismatch
    }
  }
  
  // Strong penalty if first characters don't match
  if (matches === 0) return 0.1;
  
  // High score if first 3+ characters match
  if (matches >= 3) return 0.9;
  if (matches >= 2) return 0.7;
  return 0.5;
}

/**
 * Improved fuzzy string matching with better accuracy
 * Returns a score between 0 and 1, where 1 is an exact match
 */
export function fuzzyMatch(query, target) {
  const queryLower = query.toLowerCase().trim();
  const targetLower = target.toLowerCase().trim();

  // Exact match
  if (queryLower === targetLower) {
    return 1.0;
  }

  // Prevent completion words from matching exercise names
  const completionWords = ['done', 'completed', 'finished', 'finish', 'complete', 'got it', 'all done', "that's it", 'finished that'];
  const isCompletionWord = completionWords.includes(queryLower);
  const isDumbbellExercise = targetLower.includes('dumb') || targetLower.includes('dumbbell');
  
  if (isCompletionWord && isDumbbellExercise) {
    return 0;
  }

  // CRITICAL: Prevent common false matches between similar-sounding exercises
  // These exercises should NOT match each other despite sharing some words
  const falseMatchPairs = [
    // Push-ups should NOT match bench press variants
    { query: /\bpush.*up\b/i, target: /\bbench.*press\b/i },
    { query: /\bbench.*press\b/i, target: /\bpush.*up\b/i },
    // Push should NOT match press (common confusion)
    { query: /^push$/i, target: /\bpress\b/i },
    { query: /\bpress\b/i, target: /^push$/i },
  ];
  
  for (const pair of falseMatchPairs) {
    if (pair.query.test(queryLower) && pair.target.test(targetLower)) {
      return 0; // Explicitly reject these false matches
    }
  }

  // CRITICAL: Check prefix similarity first - prevents "squats" matching "bench press"
  const prefixScore = prefixSimilarity(queryLower, targetLower);
  if (prefixScore < 0.3) {
    // First characters are too different - very unlikely to be a match
    // This prevents "squats" from matching "bench press" or "curls"
    return 0;
  }

  // Check for exact word match with word boundaries (high confidence)
  if (!isCompletionWord || !isDumbbellExercise) {
    const wordBoundaryRegex = new RegExp(`\\b${queryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (wordBoundaryRegex.test(targetLower)) {
      return 0.95;
    }
    
    // Substring match (good confidence)
    if (targetLower.includes(queryLower)) {
      return 0.85;
    }
    
    // Reverse substring match (query contains target)
    if (queryLower.includes(targetLower)) {
      return 0.75;
    }
  }

  // Check if all words in query appear in target
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  const targetWords = targetLower.split(/\s+/);
  
  // Prevent "push-ups" from matching "bench press" - explicit rejection
  // If query mentions "push-up" and target mentions "press" (or vice versa), reject
  const queryHasPushUp = queryLower.includes('push-up') || queryLower.includes('pushup') || queryLower.includes('push up');
  const targetHasPushUp = targetLower.includes('push-up') || targetLower.includes('pushup') || targetLower.includes('push up');
  const queryHasPress = queryLower.includes('press');
  const targetHasPress = targetLower.includes('press');
  
  // If one is clearly a push-up variant and the other is a press exercise, reject
  if ((queryHasPushUp && targetHasPress && !targetHasPushUp) || 
      (targetHasPushUp && queryHasPress && !queryHasPushUp)) {
    return 0; // Push-ups should never match bench press
  }
  
  if (queryWords.length > 0) {
    const wordsMatched = queryWords.filter(qw => {
      // Prevent "push" from matching "press"
      if (qw === 'push') {
        // Only match if target actually contains "push", not "press"
        return targetWords.some(tw => tw === 'push' || tw.includes('push-up'));
      }
      // Prevent "press" from matching standalone "push"
      if (targetWords.includes('push') && qw.includes('press') && qw !== 'press') {
        // If target is a push-up variant, don't match if query has press
        if (targetLower.includes('push-up') || targetLower.includes('pushup')) {
          return false;
        }
      }
      
      return targetWords.some(tw => {
        // Exact word match
        if (tw === qw) return true;
        // Word contains query word or vice versa
        if (tw.includes(qw) || qw.includes(tw)) return true;
        // Check prefix similarity for word-level matching
        return prefixSimilarity(qw, tw) >= 0.5;
      });
    }).length;
    
    if (wordsMatched === queryWords.length && queryWords.length > 0) {
      return 0.7;
    }
    
    if (wordsMatched > 0) {
      return 0.5 * (wordsMatched / queryWords.length);
    }
  }

  // Use Levenshtein distance for remaining cases
  const maxLen = Math.max(queryLower.length, targetLower.length);
  if (maxLen === 0) return 0;
  
  const distance = levenshteinDistance(queryLower, targetLower);
  const similarity = 1 - (distance / maxLen);
  
  // Only accept if similarity is decent and prefix matches
  if (similarity > 0.6 && prefixScore >= 0.5) {
    return similarity * 0.6; // Scale down Levenshtein-only matches
  }
  
  return 0;
}

/**
 * Find best matching exercises from a list using fuzzy matching
 * @param {string} query - Search query
 * @param {Array} exercises - Array of exercise objects with name and aliases
 * @param {number} threshold - Minimum score threshold (default 0.3)
 * @returns {Array} Sorted array of matches with scores
 */
export function findBestMatches(query, exercises, threshold = 0.3) {
  const matches = [];

  exercises.forEach((exercise) => {
    let bestScore = 0;
    
    // Check exercise name
    const nameScore = fuzzyMatch(query, exercise.name);
    bestScore = Math.max(bestScore, nameScore);

    // Check aliases
    if (exercise.aliases && exercise.aliases.length > 0) {
      exercise.aliases.forEach((alias) => {
        const aliasScore = fuzzyMatch(query, alias);
        bestScore = Math.max(bestScore, aliasScore);
      });
    }

    if (bestScore >= threshold) {
      matches.push({
        exercise,
        score: bestScore
      });
    }
  });

  // Sort by score (descending)
  matches.sort((a, b) => b.score - a.score);

  return matches;
}

/**
 * Find the single best matching exercise
 * @param {string} query - Search query
 * @param {Array} exercises - Array of exercise objects
 * @param {number} threshold - Minimum score threshold
 * @returns {Object|null} Best match or null
 */
export function findBestMatch(query, exercises, threshold = 0.3) {
  const matches = findBestMatches(query, exercises, threshold);
  return matches.length > 0 ? matches[0].exercise : null;
}
