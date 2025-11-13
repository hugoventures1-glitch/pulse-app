/**
 * Date formatting utilities for consistent date display across the app
 */

/**
 * Format a date for display in a user-friendly format
 * @param {string|number|Date} dateInput - ISO string, timestamp, or Date object
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string (e.g., "Today", "Yesterday", "Nov 14, 2025")
 */
export function formatWorkoutDate(dateInput, options = {}) {
  if (!dateInput) return 'Unknown date';
  
  // Parse the date - handle ISO string, timestamp, or Date object
  let date;
  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return 'Invalid date';
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const workoutDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Check if it's today
  if (workoutDay.getTime() === today.getTime()) {
    return options.includeTime ? 'Today' : 'Today';
  }
  
  // Check if it's yesterday
  if (workoutDay.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  
  // Check if it's within the last week
  const daysDiff = Math.floor((today - workoutDay) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 7 && daysDiff > 0) {
    return date.toLocaleDateString(undefined, { weekday: 'long' }); // e.g., "Monday"
  }
  
  // Format as date string
  const currentYear = now.getFullYear();
  const workoutYear = date.getFullYear();
  
  if (workoutYear === currentYear) {
    // Same year - show month and day
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  } else {
    // Different year - include year
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }
}

/**
 * Format a full date with time if needed
 * @param {string|number|Date} dateInput - ISO string, timestamp, or Date object
 * @returns {string} Formatted date with time (e.g., "Nov 14, 2025 at 3:45 PM")
 */
export function formatDateWithTime(dateInput) {
  if (!dateInput) return 'Unknown date';
  
  let date;
  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return 'Invalid date';
  }
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  const dateStr = formatWorkoutDate(date);
  const timeStr = date.toLocaleTimeString(undefined, { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  if (dateStr === 'Today' || dateStr === 'Yesterday') {
    return `${dateStr} at ${timeStr}`;
  }
  
  return `${dateStr}, ${date.getFullYear()} at ${timeStr}`;
}

/**
 * Format a timestamp for display (for individual sets)
 * @param {string|number|Date} timestampInput - ISO string, timestamp, or Date object
 * @returns {string} Formatted timestamp (e.g., "3:45 PM")
 */
export function formatTimestamp(timestampInput) {
  if (!timestampInput) return '';
  
  let date;
  if (typeof timestampInput === 'string') {
    date = new Date(timestampInput);
  } else if (typeof timestampInput === 'number') {
    date = new Date(timestampInput);
  } else if (timestampInput instanceof Date) {
    date = timestampInput;
  } else {
    return '';
  }
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return date.toLocaleTimeString(undefined, { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Ensure a date is saved in ISO format
 * @param {string|number|Date} dateInput - Date to convert
 * @returns {string} ISO string
 */
export function ensureISODate(dateInput) {
  if (!dateInput) return new Date().toISOString();
  
  if (typeof dateInput === 'string') {
    // If it's already an ISO string, validate and return
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } else if (typeof dateInput === 'number') {
    // Timestamp - convert to ISO
    return new Date(dateInput).toISOString();
  } else if (dateInput instanceof Date) {
    // Date object - convert to ISO
    if (isNaN(dateInput.getTime())) {
      return new Date().toISOString();
    }
    return dateInput.toISOString();
  }
  
  return new Date().toISOString();
}

