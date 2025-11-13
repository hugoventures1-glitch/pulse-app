import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';

const steps = [
  { key: 'name', title: "What's your name?", type: 'text' },
  { key: 'goal', title: "What's your fitness goal?", type: 'select', options: ['Strength', 'Hypertrophy', 'Endurance', 'General Fitness'] },
  { key: 'days', title: 'How many days per week do you train?', type: 'select', options: ['1', '2', '3', '4', '5', '6', '7'] },
  { key: 'level', title: 'Experience level?', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
  { key: 'unit', title: 'Preferred weight units?', type: 'select', options: ['kg', 'lbs'] },
  { key: 'restDuration', title: 'Default rest timer?', type: 'select', options: ['60s', '90s', '120s', '180s'] },
];

// Profanity and offensive words list
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'damn', 'bitch', 'cunt', 'dick', 'whore', 'slut',
  'piss', 'cock', 'pussy', 'bastard', 'motherfucker', 'faggot', 'nigger', 'retard',
  'fag', 'dyke', 'tranny', 'kike', 'spic', 'chink', 'gook', 'wetback'
];

// Reserved/admin words
const RESERVED_WORDS = [
  'admin', 'pulse', 'official', 'support', 'help', 'team', 'system', 'root',
  'administrator', 'moderator', 'mod', 'staff', 'service'
];

// Validation function
function validateUsername(username) {
  const trimmed = username.trim();
  
  // Check length
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be 3-20 characters' };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: 'Username must be 3-20 characters' };
  }
  
  // Check for leading/trailing spaces
  if (username !== trimmed) {
    return { valid: false, error: 'No leading or trailing spaces allowed' };
  }
  
  // Check allowed characters (letters, numbers, spaces, hyphens, underscores)
  const allowedPattern = /^[a-zA-Z0-9\s\-_]+$/;
  if (!allowedPattern.test(trimmed)) {
    return { valid: false, error: 'Only letters, numbers, spaces, and - _ allowed' };
  }
  
  // Check for consecutive special characters
  if (/[-_]{2,}/.test(trimmed)) {
    return { valid: false, error: 'No consecutive special characters allowed' };
  }
  
  // Check for profanity (case-insensitive)
  const lowerUsername = trimmed.toLowerCase();
  for (const word of PROFANITY_LIST) {
    if (lowerUsername.includes(word)) {
      return { valid: false, error: 'This username is not allowed' };
    }
  }
  
  // Check for reserved words (case-insensitive)
  for (const word of RESERVED_WORDS) {
    if (lowerUsername === word || lowerUsername.includes(` ${word} `) || 
        lowerUsername.startsWith(`${word} `) || lowerUsername.endsWith(` ${word}`)) {
      return { valid: false, error: 'This username is not allowed' };
    }
  }
  
  return { valid: true, error: null };
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { setUserProfile, setPrefs } = useWorkout();
  const [idx, setIdx] = useState(0);
  const [profile, setProfile] = useState({ name: '', goal: '', days: '', customDays: [], level: '', unit: '', restDuration: '' });
  const [isCustomSchedule, setIsCustomSchedule] = useState(false);
  const [customDaysSelection, setCustomDaysSelection] = useState([]);
  const [validationError, setValidationError] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const validationTimeoutRef = useRef(null);
  const step = steps[idx];
  const progress = `${idx + 1}/${steps.length}`;

  // Debounced validation for username
  useEffect(() => {
    if (step.key !== 'name') {
      setValidationError(null);
      setIsValid(false);
      return;
    }

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    if (profile.name.length === 0) {
      setValidationError(null);
      setIsValid(false);
      return;
    }

    validationTimeoutRef.current = setTimeout(() => {
      const validation = validateUsername(profile.name);
      setValidationError(validation.error);
      setIsValid(validation.valid);
    }, 300);

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [profile.name, step.key]);

  function next() {
    // Don't allow progression if name is invalid
    if (step.key === 'name' && !isValid) {
      return;
    }
    if (idx < steps.length - 1) setIdx(idx + 1);
    else finish();
  }

  function finish(skip=false) {
    try {
      if (!skip) {
        // Trim name before saving
        const trimmedProfile = {
          ...profile,
          name: profile.name.trim()
        };
        // Save user profile using WorkoutContext
        setUserProfile(trimmedProfile);
        
        // Save preferences (restDuration, units) if provided
        const prefsToSave = {};
        if (trimmedProfile.restDuration) {
          prefsToSave.restDuration = parseInt(trimmedProfile.restDuration.replace('s', '')) || 90;
        }
        if (trimmedProfile.unit) {
          prefsToSave.units = trimmedProfile.unit;
        }
        if (Object.keys(prefsToSave).length > 0) {
          setPrefs(prev => ({ ...prev, ...prefsToSave }));
        }
      }
      localStorage.setItem('hasCompletedOnboarding', 'true');
    } catch(_){}
    navigate('/');
  }

  function renderInput() {
    if (step.key === 'days') {
      const dayButtons = ['1', '2', '3', '4', '5', '6', '7'];
      const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      function handleNumericSelection(opt) {
        setProfile(p => ({ ...p, days: opt, customDays: [] }));
        setIsCustomSchedule(false);
        setCustomDaysSelection([]);
        setTimeout(next, 100);
      }

      function toggleCustomDay(day) {
        setCustomDaysSelection(prev => {
          if (prev.includes(day)) {
            return prev.filter(d => d !== day);
          }
          return [...prev, day];
        });
      }

      function confirmCustomSchedule() {
        const ordered = weekdayOrder.filter(d => customDaysSelection.includes(d));
        if (ordered.length === 0) return;
        const pretty = ordered.join(', ');
        setProfile(p => ({ ...p, days: `Custom (${pretty})`, customDays: ordered }));
        setIsCustomSchedule(false);
        setTimeout(next, 100);
      }

      return (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {dayButtons.map(opt => (
              <button
                key={opt}
                onClick={() => handleNumericSelection(opt)}
                className={`h-12 rounded-2xl border ${profile.days===opt ? 'bg-white text-slate-900 border-transparent' : 'bg-white/10 text-white border-white/15'}`}
              >
                {opt}x
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => {
                setIsCustomSchedule(true);
                setCustomDaysSelection(profile.customDays?.length ? profile.customDays : ['Mon', 'Wed']);
              }}
              className={`w-full h-12 rounded-2xl border ${profile.customDays?.length ? 'bg-white text-slate-900 border-transparent' : 'bg-white/10 text-white border-white/15'}`}
            >
              {profile.customDays?.length ? `Custom schedule: ${profile.customDays.join(', ')}` : 'Choose custom schedule'}
            </button>
            {isCustomSchedule && (
              <div className="space-y-3 pulse-glass rounded-3xl p-4 border border-white/20">
                <div className="text-white text-sm font-semibold mb-2">Select training days</div>
                <div className="grid grid-cols-3 gap-2">
                  {weekdayOrder.map(day => {
                    const selected = customDaysSelection.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleCustomDay(day)}
                        className={`h-10 rounded-xl text-sm border ${selected ? 'bg-white text-slate-900 border-transparent' : 'bg-white/10 text-white border-white/15'}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    onClick={() => {
                      setIsCustomSchedule(false);
                      setCustomDaysSelection([]);
                    }}
                    className="flex-1 h-10 rounded-xl bg-white/10 text-white border border-white/15 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={customDaysSelection.length === 0}
                    onClick={confirmCustomSchedule}
                    className={`flex-1 h-10 rounded-xl text-sm font-semibold ${customDaysSelection.length === 0 ? 'bg-white/10 text-white/50 border border-white/15 cursor-not-allowed' : 'bg-white text-slate-900 border-transparent'}`}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    if (step.type === 'text') {
      return (
        <div className="mt-4">
          <div className="relative">
            <input
              value={profile.name}
              onChange={e=>setProfile({...profile, name: e.target.value})}
              placeholder="Your name"
              className={`w-full px-4 py-3 pr-10 rounded-2xl bg-white/10 border text-white placeholder-white/60 outline-none transition ${
                validationError 
                  ? 'border-red-400/50' 
                  : isValid 
                    ? 'border-emerald-400/50' 
                    : 'border-white/15'
              }`}
            />
            {isValid && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {validationError && (
            <div className="mt-2 text-red-400 text-sm">{validationError}</div>
          )}
        </div>
      );
    }
    if (step.type === 'select') {
      return (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {step.options.map(opt => (
            <button
              key={opt}
              onClick={()=>{
                setProfile(p=>({ ...p, [step.key]: opt }));
                setTimeout(next, 100);
              }}
              className={`h-12 rounded-2xl border ${profile[step.key]===opt? 'bg-white text-slate-900 border-transparent':'bg-white/10 text-white border-white/15'}`}
            >{opt}</button>
          ))}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="relative min-h-screen w-full flex justify-center items-start pt-safe pb-28">
      {/* Simple gradient background */}
      <div className="absolute inset-0 -z-10" style={{background:'linear-gradient(135deg, rgba(6,182,212,0.65) 0%, rgba(124,58,237,0.65) 100%)'}} />
      <div className="w-full max-w-[375px] px-4 pt-12">
        <div className="text-white/80 text-sm mb-2">{progress}</div>
        <div className="pulse-glass rounded-3xl p-6 border border-white/15 backdrop-blur-2xl shadow-2xl">
          <div className="text-white text-2xl font-bold">{step.title}</div>
          {renderInput()}
          {step.type === 'text' && (
            <button 
              onClick={next} 
              disabled={!isValid}
              className={`mt-5 w-full h-12 rounded-2xl font-semibold transition ${
                isValid 
                  ? 'bg-white text-slate-900 cursor-pointer' 
                  : 'bg-white/30 text-white/50 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          )}
        </div>
        <button onClick={()=>finish(true)} className="mt-4 text-white/80 text-sm underline">Skip for now</button>
      </div>
    </div>
  );
}
