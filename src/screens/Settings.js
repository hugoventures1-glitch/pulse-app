import React, { useCallback, useEffect, useState } from 'react';
import { useWorkout } from '../state/WorkoutContext';
import { 
  getAllPRs, 
  deletePR, 
  clearAllPRs, 
  getPRSettings, 
  updatePRSettings, 
  formatPRDate 
} from '../utils/personalRecords';

// Custom SVG icons
const SettingsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

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
  const { prefs, setPrefs, exportHistory, getRetentionInfo } = useWorkout();
  const [userProfile, setUserProfile] = useState(null);
  const [draftProfile, setDraftProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [customRestInput, setCustomRestInput] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);
  const [retentionInfo, setRetentionInfo] = useState(null);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [prSettings, setPRSettings] = useState(getPRSettings());

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

  useEffect(() => {
    if (getRetentionInfo) {
      setRetentionInfo(getRetentionInfo());
    }
  }, [getRetentionInfo]);

  // Load PRs on mount
  useEffect(() => {
    setPersonalRecords(getAllPRs());
    setPRSettings(getPRSettings());
  }, []);

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

  // PR Management functions
  const togglePRNotifications = () => {
    const newSettings = { ...prSettings, notificationsEnabled: !prSettings.notificationsEnabled };
    updatePRSettings(newSettings);
    setPRSettings(newSettings);
    if (window?.__toast) window.__toast(`PR notifications ${newSettings.notificationsEnabled ? 'enabled' : 'disabled'}`);
  };

  const togglePRSound = () => {
    const newSettings = { ...prSettings, soundEnabled: !prSettings.soundEnabled };
    updatePRSettings(newSettings);
    setPRSettings(newSettings);
    if (window?.__toast) window.__toast(`PR sound ${newSettings.soundEnabled ? 'enabled' : 'disabled'}`);
  };

  const handleDeletePR = (prId) => {
    if (window.confirm('Delete this personal record?')) {
      deletePR(prId);
      setPersonalRecords(getAllPRs());
      if (window?.__toast) window.__toast('PR deleted');
    }
  };

  const handleClearAllPRs = () => {
    if (window.confirm('Delete all personal records? This cannot be undone.')) {
      clearAllPRs();
      setPersonalRecords([]);
      if (window?.__toast) window.__toast('All PRs cleared');
    }
  };

  const handleExport = () => {
    try {
      const exportData = exportHistory();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pulse-workout-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (window.__toast) window.__toast('Workout data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      if (window.__toast) window.__toast('Export failed. Please try again.');
    }
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
    <div className="w-full max-w-[375px] px-4 pt-6 pb-28 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/30 to-pink-400/20 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-purple-300" />
        </div>
        <div>
          <h1 className="text-white text-2xl font-bold">Settings</h1>
          <p className="text-white/60 text-sm">Customize your experience</p>
        </div>
      </div>

      <div className="pulse-glass rounded-2xl p-5 space-y-4 border border-white/15">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-cyan-300" />
            <h2 className="text-white text-lg font-semibold">User Profile</h2>
          </div>
          {isEditingProfile ? (
            <div className="flex gap-2">
              <button
                onClick={cancelProfileEdit}
                className="px-3 h-9 rounded-xl bg-white/10 text-white border border-white/15 text-sm transition-transform hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 h-9 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 text-slate-900 font-semibold text-sm shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105 active:scale-95"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={startEditProfile}
              className="px-4 h-9 rounded-xl bg-white/10 text-white border border-white/15 text-sm transition-transform hover:scale-105 active:scale-95"
            >
              Edit
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
                className="mt-1 w-full h-11 rounded-xl bg-white/10 border border-white/20 px-4 text-white placeholder-white/40 outline-none focus-glow transition-all"
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
                      className={`h-10 rounded-xl border text-sm font-medium transition-all hover:scale-105 active:scale-95 ${
                        selected
                          ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-white border-transparent shadow-lg'
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
                className="mt-1 w-full h-11 rounded-xl bg-white/10 border border-white/20 px-4 text-white text-sm outline-none focus-glow transition-all"
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

      {/* Personal Records Section - Moved to between User Profile and App Settings */}
      <div className="pulse-glass rounded-2xl p-5 space-y-4 border border-white/15">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <h2 className="text-white text-lg font-semibold">Personal Records</h2>
          </div>
          {personalRecords.length > 0 && (
            <span className="text-white/60 text-xs bg-white/10 px-2 py-1 rounded-full">
              {personalRecords.length}
            </span>
          )}
        </div>

        {/* PR Settings */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium text-sm">PR Notifications</div>
              <div className="text-white/60 text-xs mt-0.5">Show celebration when you hit a PR</div>
            </div>
            <button
              onClick={togglePRNotifications}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-transform hover:scale-105 active:scale-95 ${
                prSettings.notificationsEnabled
                  ? 'bg-cyan-500 text-white border-transparent'
                  : 'bg-white/10 text-white border border-white/20'
              }`}
            >
              {prSettings.notificationsEnabled ? 'On' : 'Off'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium text-sm">PR Sound</div>
              <div className="text-white/60 text-xs mt-0.5">Play sound when PR is achieved</div>
            </div>
            <button
              onClick={togglePRSound}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-transform hover:scale-105 active:scale-95 ${
                prSettings.soundEnabled
                  ? 'bg-cyan-500 text-white border-transparent'
                  : 'bg-white/10 text-white border border-white/20'
              }`}
            >
              {prSettings.soundEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* PR List - More visible */}
        {personalRecords.length > 0 ? (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {personalRecords.map((pr) => (
              <div
                key={pr.id}
                className="rounded-xl p-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm mb-1 truncate">
                    {pr.exercise}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-white/70">
                    <span className="font-medium text-white/90">
                      {pr.weight.toFixed(pr.weight % 1 === 0 ? 0 : 1)}{pr.unit || 'kg'}
                    </span>
                    <span className="text-white/50">×</span>
                    <span className="font-medium text-white/90">{pr.reps} reps</span>
                    <span className="text-white/50">•</span>
                    <span>{formatPRDate(pr.date)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePR(pr.id)}
                  className="px-2 h-8 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-medium transition-transform hover:scale-105 active:scale-95 flex-shrink-0 flex items-center justify-center"
                  title="Delete PR"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-white/10 rounded-xl bg-white/5">
            <div className="text-white/60 text-sm mb-1">
              No personal records yet
            </div>
            <div className="text-white/40 text-xs">
              Log sets to track your PRs automatically
            </div>
          </div>
        )}

        {/* Clear All PRs Button */}
        {personalRecords.length > 0 && (
          <button
            onClick={handleClearAllPRs}
            className="w-full h-10 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-medium transition-transform hover:scale-105 active:scale-95"
          >
            Clear All PRs
          </button>
        )}
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
        
        {/* Data Retention Info */}
        <div className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-white font-medium text-sm mb-2">Data Retention: 6 months</div>
          <div className="text-white/70 text-xs space-y-1">
            <div>• Detailed logs kept for 6 months</div>
            <div>• Personal records kept forever</div>
            <div>• Older data archived as summaries</div>
          </div>
          {retentionInfo && (
            <div className="mt-3 pt-3 border-t border-white/10 text-white/60 text-xs space-y-1">
              <div>Recent entries: {retentionInfo.recentEntries}</div>
              <div>Archived entries: {retentionInfo.oldEntries}</div>
              <div>Personal records: {retentionInfo.totalPRs}</div>
              <div>Monthly summaries: {retentionInfo.monthlySummaries}</div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full h-12 rounded-2xl bg-white/10 text-white border border-white/15 text-left px-4 font-medium"
          >
            Export Full History
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

      <div className="pulse-glass rounded-3xl p-6 space-y-4" style={{ borderRadius: '24px' }}>
        <h2 className="text-white text-2xl font-bold mb-4" style={{ fontSize: '24px' }}>About</h2>
        <div className="space-y-3 text-white/80 text-sm" style={{ fontSize: '14px' }}>
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
