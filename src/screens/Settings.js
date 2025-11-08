import React, { useCallback, useEffect, useState } from 'react';
import { useWorkout } from '../state/WorkoutContext';

const GOAL_OPTIONS = ['Strength', 'Hypertrophy', 'Endurance', 'Weight Loss', 'General Fitness'];
const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const FREQUENCY_OPTIONS = ['1', '2', '3', '4', '5', '6', '7'];
const REST_PRESETS = [30, 45, 60, 90, 120, 150, 180, 210, 240, 300];
const MIN_REST = 30;
const MAX_REST = 300;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseRestSeconds = (value, fallback) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return clamp(value, MIN_REST, MAX_REST);
  }
  if (typeof value === 'string') {
    const numeric = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (!Number.isNaN(numeric)) {
      return clamp(numeric, MIN_REST, MAX_REST);
    }
  }
  if (typeof fallback === 'number' && !Number.isNaN(fallback)) {
    return clamp(fallback, MIN_REST, MAX_REST);
  }
  return clamp(90, MIN_REST, MAX_REST);
};

const serializeProfile = (profile) => ({
  ...profile,
  restDuration: `${profile.restDuration}s`,
  goals: Array.isArray(profile.goals) ? profile.goals : [],
  goal: Array.isArray(profile.goals) && profile.goals.length ? profile.goals[0] : '',
});

export default function Settings() {
  const { prefs, setPrefs } = useWorkout();
  const [userProfile, setUserProfile] = useState(null);
  const [draftProfile, setDraftProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [customRestInput, setCustomRestInput] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);

  const normalizeProfile = useCallback((raw = {}) => {
    const goalsArray = Array.isArray(raw.goals)
      ? raw.goals
      : raw.goal
        ? [raw.goal]
        : [];
    const restSeconds = parseRestSeconds(raw.restDuration, prefs?.restDuration);
    return {
      name: raw.name || '',
      goals: goalsArray,
      goal: goalsArray[0] || '',
      level: raw.level || '',
      unit: raw.unit || prefs?.units || 'kg',
      days: raw.days || '',
      customDays: Array.isArray(raw.customDays) ? raw.customDays : [],
      restDuration: restSeconds,
    };
  }, [prefs?.restDuration, prefs?.units]);

  const persistProfile = useCallback((profile) => {
    try {
      localStorage.setItem('userProfile', JSON.stringify(serializeProfile(profile)));
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userProfile');
      const rawProfile = stored ? JSON.parse(stored) : {};
      const normalized = normalizeProfile(rawProfile);
      setUserProfile(normalized);
      setDraftProfile(normalized);
      setIsEditingProfile(false);
      setCustomRestInput('');
    } catch (_) {
      const fallback = normalizeProfile({});
      setUserProfile(fallback);
      setDraftProfile(fallback);
      setIsEditingProfile(false);
      setCustomRestInput('');
    }
  }, [normalizeProfile]);

  const startEditProfile = () => {
    if (!userProfile) return;
    setDraftProfile(userProfile);
    setIsEditingProfile(true);
  };

  const cancelProfileEdit = () => {
    setDraftProfile(userProfile);
    setIsEditingProfile(false);
  };

  const handleDraftChange = (key, value) => {
    if (!isEditingProfile) return;
    setDraftProfile((prev) => ({ ...(prev || {}), [key]: value }));
  };

  const toggleGoal = (goal) => {
    if (!isEditingProfile) return;
    setDraftProfile((prev) => {
      const prevGoals = Array.isArray(prev?.goals) ? prev.goals : [];
      const nextGoals = prevGoals.includes(goal)
        ? prevGoals.filter((g) => g !== goal)
        : [...prevGoals, goal];
      return {
        ...(prev || {}),
        goals: nextGoals,
        goal: nextGoals[0] || '',
      };
    });
  };

  const handleDaysChange = (days) => {
    if (!isEditingProfile) return;
    setDraftProfile((prev) => ({
      ...(prev || {}),
      days,
      customDays: [],
    }));
  };

  const handleSaveProfile = () => {
    if (!draftProfile) return;
    const goalsArray = Array.isArray(draftProfile.goals) ? draftProfile.goals : [];
    const nextProfile = {
      ...draftProfile,
      name: (draftProfile.name || '').trim(),
      goals: goalsArray,
      goal: goalsArray[0] || '',
      unit: draftProfile.unit || 'kg',
      days: draftProfile.days || '',
      restDuration: draftProfile.restDuration || parseRestSeconds(prefs?.restDuration),
      customDays: Array.isArray(draftProfile.customDays) ? draftProfile.customDays : [],
    };

    setUserProfile(nextProfile);
    setDraftProfile(nextProfile);
    setIsEditingProfile(false);

    setPrefs((prev) => ({ ...prev, units: nextProfile.unit }));
    persistProfile(nextProfile);
    if (window?.__toast) window.__toast('Profile updated');
  };

  const profileForDisplay = userProfile || normalizeProfile({});
  const profileForEditing = draftProfile || profileForDisplay;
  const selectedGoals = isEditingProfile ? (profileForEditing.goals || []) : (profileForDisplay.goals || []);
  const restDisplayValue = profileForDisplay.restDuration || clamp(prefs?.restDuration || 90, MIN_REST, MAX_REST);
  const weightUnit = profileForDisplay.unit || prefs?.units || 'kg';
  const voiceEnabled = prefs?.voiceFeedback !== false;
  const autoAdvanceEnabled = prefs?.autoAdvance !== false;

  const applyUnits = useCallback((unit) => {
    const normalizedUnit = unit === 'lbs' ? 'lbs' : 'kg';
    const baseProfile = userProfile || normalizeProfile({});
    const nextProfile = { ...baseProfile, unit: normalizedUnit };
    setUserProfile(nextProfile);
    setDraftProfile((prev) => (prev ? { ...prev, unit: normalizedUnit } : prev));
    setPrefs((prev) => ({ ...prev, units: normalizedUnit }));
    persistProfile(nextProfile);
    if (window?.__toast) window.__toast(`Units set to ${normalizedUnit.toUpperCase()}`);
  }, [normalizeProfile, persistProfile, setPrefs, userProfile]);

  const applyRestDuration = useCallback((value) => {
    if (value === undefined || value === null || Number.isNaN(value)) return;
    const sanitized = clamp(Math.round(value), MIN_REST, MAX_REST);
    const baseProfile = userProfile || normalizeProfile({});
    const nextProfile = { ...baseProfile, restDuration: sanitized };
    setUserProfile(nextProfile);
    setDraftProfile((prev) => (prev ? { ...prev, restDuration: sanitized } : prev));
    setPrefs((prev) => ({ ...prev, restDuration: sanitized }));
    persistProfile(nextProfile);
    setCustomRestInput('');
    if (window?.__toast) window.__toast(`Rest timer set to ${sanitized}s`);
  }, [normalizeProfile, persistProfile, setPrefs, userProfile]);

  const handleCustomRestSubmit = () => {
    const parsed = parseInt(customRestInput, 10);
    if (!Number.isNaN(parsed)) {
      applyRestDuration(parsed);
    }
    setCustomRestInput('');
  };

  const toggleVoiceFeedback = () => {
    setPrefs((prev) => {
      const nextValue = !(prev?.voiceFeedback !== false);
      if (window?.__toast) window.__toast(`Voice feedback ${nextValue ? 'enabled' : 'disabled'}`);
      return { ...prev, voiceFeedback: nextValue };
    });
  };

  const toggleAutoAdvance = () => {
    setPrefs((prev) => {
      const nextValue = !(prev?.autoAdvance !== false);
      if (window?.__toast) window.__toast(`Auto-advance ${nextValue ? 'enabled' : 'disabled'}`);
      return { ...prev, autoAdvance: nextValue };
    });
  };

  const handleExport = () => {
    if (window.__toast) window.__toast('Export feature coming soon');
  };

  const handleClearHistory = () => setShowConfirm('clear');
  const handleReset = () => setShowConfirm('reset');

  const confirmClearHistory = () => {
    if (window.__toast) window.__toast('Clear history feature coming soon');
    setShowConfirm(null);
  };

  const confirmReset = () => {
    if (window.__toast) window.__toast('Reset app feature coming soon');
    setShowConfirm(null);
  };

  return (
    <div className="w-full max-w-[375px] px-4 pt-8 pb-28 space-y-6">
      <h1 className="text-white text-3xl font-bold mb-6">Settings</h1>

      <div className="pulse-glass rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white text-xl font-semibold">User Profile</h2>
          {isEditingProfile ? (
            <div className="flex gap-2">
              <button
                onClick={cancelProfileEdit}
                className="px-3 h-9 rounded-full bg-white/10 text-white border border-white/15 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 h-9 rounded-full bg-emerald-400 text-slate-900 font-semibold text-sm shadow-lg shadow-emerald-500/40"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <button
              onClick={startEditProfile}
              className="px-4 h-9 rounded-full bg-white/10 text-white border border-white/15 text-sm"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-white/70 text-xs mb-1">Name</div>
            {isEditingProfile ? (
              <input
                value={profileForEditing?.name || ''}
                onChange={(e) => handleDraftChange('name', e.target.value)}
                placeholder="Enter your name"
                className="mt-1 w-full h-11 rounded-2xl bg-white/10 border border-white/20 px-3 text-white placeholder-white/40 outline-none"
                autoComplete="off"
              />
            ) : (
              <div className="text-white font-medium">{profileForDisplay?.name || 'Not set'}</div>
            )}
          </div>

          <div>
            <div className="text-white/70 text-xs mb-1">Fitness Goals</div>
            {isEditingProfile ? (
              <div className="grid grid-cols-2 gap-2 mt-1">
                {GOAL_OPTIONS.map((goal) => {
                  const selected = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`h-10 rounded-2xl border text-sm font-medium transition ${
                        selected
                          ? 'bg-white text-slate-900 border-transparent'
                          : 'bg-white/10 text-white border-white/15'
                      }`}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-white font-medium">
                {profileForDisplay?.goals?.length
                  ? profileForDisplay.goals.join(', ')
                  : 'Not set'}
              </div>
            )}
          </div>

          <div>
            <div className="text-white/70 text-xs mb-1">Training Days/Week</div>
            {isEditingProfile ? (
              <select
                value={profileForEditing?.days || ''}
                onChange={(e) => handleDaysChange(e.target.value)}
                className="mt-1 w-full h-11 rounded-2xl bg-white/10 border border-white/20 px-3 text-white text-sm outline-none"
              >
                <option value="" disabled>Select frequency</option>
                {FREQUENCY_OPTIONS.map((day) => (
                  <option key={day} value={day}>{day}x per week</option>
                ))}
              </select>
            ) : (
              <div className="text-white font-medium">
                {profileForDisplay?.days
                  ? `${profileForDisplay.days}x per week`
                  : 'Not set'}
              </div>
            )}
          </div>

          {profileForDisplay?.customDays?.length > 0 && !isEditingProfile && (
            <div>
              <div className="text-white/70 text-xs mb-1">Preferred Schedule</div>
              <div className="text-white font-medium">{profileForDisplay.customDays.join(', ')}</div>
            </div>
          )}

          <div>
            <div className="text-white/70 text-xs mb-1">Experience Level</div>
            {isEditingProfile ? (
              <select
                value={profileForEditing?.level || ''}
                onChange={(e) => handleDraftChange('level', e.target.value)}
                className="mt-1 w-full h-11 rounded-2xl bg-white/10 border border-white/20 px-3 text-white text-sm outline-none"
              >
                <option value="" disabled>Select level</option>
                {LEVEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <div className="text-white font-medium">
                {profileForDisplay?.level || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <div className="text-white/70 text-xs mb-1">Preferred Units</div>
            {isEditingProfile ? (
              <div className="flex items-center gap-2 mt-2">
                {['kg', 'lbs'].map((unit) => (
                  <button
                    key={unit}
                    onClick={() => handleDraftChange('unit', unit)}
                    className={`flex-1 h-10 rounded-2xl border text-sm font-medium transition ${
                      (profileForEditing?.unit || 'kg') === unit
                        ? 'bg-white text-slate-900 border-transparent'
                        : 'bg-white/10 text-white border-white/15'
                    }`}
                  >
                    {unit.toUpperCase()}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-white font-medium">{weightUnit.toUpperCase()}</div>
            )}
          </div>
        </div>
      </div>

      <div className="pulse-glass rounded-3xl p-6 space-y-4">
        <h2 className="text-white text-xl font-semibold mb-4">App Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Default Rest Timer</div>
              <div className="text-white/70 text-xs mt-1">Default rest duration between sets</div>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">
              {restDisplayValue}s
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {REST_PRESETS.map((opt) => (
              <button
                key={opt}
                onClick={() => applyRestDuration(opt)}
                className={`h-11 rounded-2xl border text-sm font-medium ${
                  restDisplayValue === opt
                    ? 'bg-white text-slate-900 border-transparent'
                    : 'bg-white/10 text-white border-white/15'
                }`}
              >
                {opt}s
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => applyRestDuration(restDisplayValue - 15)}
              className="h-11 w-11 rounded-2xl bg-white/10 text-white border border-white/15 text-lg font-semibold"
            >
              –
            </button>
            <input
              type="number"
              min={MIN_REST}
              max={MAX_REST}
              value={customRestInput}
              onChange={(e) => setCustomRestInput(e.target.value)}
              placeholder="Custom seconds"
              className="flex-1 h-11 rounded-2xl bg-white/10 border border-white/15 px-3 text-white placeholder-white/40 outline-none"
            />
            <button
              onClick={handleCustomRestSubmit}
              disabled={!customRestInput}
              className={`h-11 px-4 rounded-2xl bg-white text-slate-900 font-semibold ${
                !customRestInput ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              Set
            </button>
            <button
              onClick={() => applyRestDuration(restDisplayValue + 15)}
              className="h-11 w-11 rounded-2xl bg-white/10 text-white border border-white/15 text-lg font-semibold"
            >
              +
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Weight Units</div>
              <div className="text-white/70 text-xs mt-1">Display weight in kg or lbs</div>
            </div>
            <div className="flex items-center gap-2">
              {['kg', 'lbs'].map((unit) => (
                <button
                  key={unit}
                  onClick={() => applyUnits(unit)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    unit === weightUnit
                      ? 'bg-white text-slate-900 border-transparent'
                      : 'bg-white/10 text-white border-white/15'
                  }`}
                >
                  {unit.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Voice Feedback</div>
              <div className="text-white/70 text-xs mt-1">Audio confirmation after logging sets</div>
            </div>
            <button
              onClick={toggleVoiceFeedback}
              className={`px-3 py-1 rounded-full text-sm border ${
                voiceEnabled
                  ? 'bg-white text-slate-900 border-transparent'
                  : 'bg-white/10 text-white border-white/15'
              }`}
            >
              {voiceEnabled ? 'On' : 'Off'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Auto-advance Exercise</div>
              <div className="text-white/70 text-xs mt-1">Automatically move to next exercise</div>
            </div>
            <button
              onClick={toggleAutoAdvance}
              className={`px-3 py-1 rounded-full text-sm border ${
                autoAdvanceEnabled
                  ? 'bg-white text-slate-900 border-transparent'
                  : 'bg-white/10 text-white border-white/15'
              }`}
            >
              {autoAdvanceEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      </div>

      <div className="pulse-glass rounded-3xl p-6 space-y-4">
        <h2 className="text-white text-xl font-semibold mb-4">Data Management</h2>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full h-12 rounded-2xl bg-white/10 text-white border border-white/15 text-left px-4 font-medium"
          >
            Export Workout Data
          </button>
          <button
            onClick={handleClearHistory}
            className="w-full h-12 rounded-2xl bg-white/10 text-white border border-white/15 text-left px-4 font-medium"
          >
            Clear Workout History
          </button>
          <button
            onClick={handleReset}
            className="w-full h-12 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-400/30 text-left px-4 font-medium"
          >
            Reset App
          </button>
        </div>
      </div>

      <div className="pulse-glass rounded-3xl p-6 space-y-4">
        <h2 className="text-white text-xl font-semibold mb-4">About</h2>
        <div className="space-y-3 text-white/80 text-sm">
          <div>Version 1.0.0</div>
          <div>Built for focused workouts</div>
          <div className="text-white/60 text-xs mt-4">© 2024 Pulse Workout App</div>
        </div>
      </div>

      {showConfirm === 'clear' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirm(null)} />
          <div className="pulse-glass rounded-3xl p-6 max-w-sm w-full relative z-10">
            <h3 className="text-white text-xl font-bold mb-2">Clear History?</h3>
            <p className="text-white/80 text-sm mb-6">This will permanently delete all workout history. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 h-12 rounded-2xl bg-white/10 text-white border border-white/20 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearHistory}
                className="flex-1 h-12 rounded-2xl bg-rose-500 text-white font-semibold"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm === 'reset' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirm(null)} />
          <div className="pulse-glass rounded-3xl p-6 max-w-sm w-full relative z-10">
            <h3 className="text-white text-xl font-bold mb-2">Reset App?</h3>
            <p className="text-white/80 text-sm mb-6">This will reset all settings and clear all data. You'll need to complete onboarding again.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 h-12 rounded-2xl bg-white/10 text-white border border-white/20 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 h-12 rounded-2xl bg-rose-500 text-white font-semibold"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
