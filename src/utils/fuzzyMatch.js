// Fuzzy matching utilities for exercise name matching

/**
 * Simple fuzzy string matching using Levenshtein-like distance
 * Returns a score between 0 and 1, where 1 is an exact match
 */
export function fuzzyMatch(query, target) {
  const queryLower = query.toLowerCase().trim();
  const targetLower = target.toLowerCase().trim();

  // Exact match
  if (queryLower === targetLower) {
    return 1.0;
  }

  // Check if query is a substring of target
  if (targetLower.includes(queryLower)) {
    return 0.8;
  }

  // Check if all words in query appear in target
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  const targetWords = targetLower.split(/\s+/);
  
  if (queryWords.length > 0) {
    const wordsMatched = queryWords.filter(qw => 
      targetWords.some(tw => tw.includes(qw) || qw.includes(tw))
    ).length;
    
    if (wordsMatched === queryWords.length) {
      return 0.6;
    }
    
    if (wordsMatched > 0) {
      return 0.4 * (wordsMatched / queryWords.length);
    }
  }

  // Calculate character similarity
  let matches = 0;
  let queryIdx = 0;
  for (let i = 0; i < targetLower.length && queryIdx < queryLower.length; i++) {
    if (targetLower[i] === queryLower[queryIdx]) {
      matches++;
      queryIdx++;
    }
  }

  return matches / Math.max(queryLower.length, targetLower.length) * 0.3;
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
