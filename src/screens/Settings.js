import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';

export default function Settings() {
  const navigate = useNavigate();
  const { prefs, setPrefs } = useWorkout();
  const restOptions = [30, 60, 90, 120, 150, 180, 210, 240];
  const [restSelection, setRestSelection] = useState(prefs?.restDuration || 90);
  const [customRestInput, setCustomRestInput] = useState('');
  
  // Load user profile from localStorage
  const [userProfile, setUserProfile] = useState(null);
  useEffect(() => {
    try {
      const profile = localStorage.getItem('userProfile');
      if (profile) setUserProfile(JSON.parse(profile));
    } catch(_) {}
  }, []);

  useEffect(() => {
    if (prefs?.restDuration) {
      setRestSelection(prefs.restDuration);
    }
  }, [prefs?.restDuration]);

  const updateRestDuration = (value) => {
    if (!value || Number.isNaN(value)) return;
    const sanitized = Math.max(15, Math.min(600, Math.round(value)));
    setRestSelection(sanitized);
    setPrefs(prev => ({ ...prev, restDuration: sanitized }));

    setUserProfile(prev => {
      if (prev) {
        const nextProfile = { ...prev, restDuration: `${sanitized}s` };
        try { localStorage.setItem('userProfile', JSON.stringify(nextProfile)); } catch(_) {}
        return nextProfile;
      }
      try {
        const stored = localStorage.getItem('userProfile');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.restDuration = `${sanitized}s`;
          localStorage.setItem('userProfile', JSON.stringify(parsed));
        }
      } catch(_) {}
      return prev;
    });

    if (window?.__toast) window.__toast(`Default rest set to ${sanitized}s`);
  };

  const handleCustomRestSubmit = () => {
    const parsed = parseInt(customRestInput, 10);
    if (!parsed || parsed <= 0) return;
    updateRestDuration(parsed);
    setCustomRestInput('');
  };

  const [showConfirm, setShowConfirm] = useState(null);

  const handleExport = () => {
    // Placeholder: Export workout data
    if (window.__toast) window.__toast('Export feature coming soon');
  };

  const handleClearHistory = () => {
    setShowConfirm('clear');
  };

  const handleReset = () => {
    setShowConfirm('reset');
  };

  const confirmClearHistory = () => {
    // Placeholder: Clear workout history
    if (window.__toast) window.__toast('Clear history feature coming soon');
    setShowConfirm(null);
  };

  const confirmReset = () => {
    // Placeholder: Reset app
    if (window.__toast) window.__toast('Reset app feature coming soon');
    setShowConfirm(null);
  };

  const handleEditProfile = () => {
    // Placeholder: Navigate to edit profile
    if (window.__toast) window.__toast('Edit profile coming soon');
  };

  return (
    <div className="w-full max-w-[375px] px-4 pt-8 pb-28 space-y-6">
      <h1 className="text-white text-3xl font-bold mb-6">Settings</h1>

      {/* User Profile Section */}
      <div className="pulse-glass rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-semibold">User Profile</h2>
          <button
            onClick={handleEditProfile}
            className="px-4 h-9 rounded-full bg-white/10 text-white border border-white/15 text-sm"
          >
            Edit
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-white/70 text-xs mb-1">Name</div>
            <div className="text-white font-medium">{userProfile?.name || 'Not set'}</div>
          </div>
          <div>
            <div className="text-white/70 text-xs mb-1">Fitness Goal</div>
            <div className="text-white font-medium">{userProfile?.goal || 'Not set'}</div>
          </div>
          <div>
            <div className="text-white/70 text-xs mb-1">Training Days/Week</div>
            <div className="text-white font-medium">{userProfile?.days || 'Not set'}</div>
          </div>
          {userProfile?.customDays?.length > 0 && (
            <div>
              <div className="text-white/70 text-xs mb-1">Preferred Schedule</div>
              <div className="text-white font-medium">{userProfile.customDays.join(', ')}</div>
            </div>
          )}
          <div>
            <div className="text-white/70 text-xs mb-1">Experience Level</div>
            <div className="text-white font-medium">{userProfile?.level || 'Not set'}</div>
          </div>
          {userProfile?.unit && (
            <div>
              <div className="text-white/70 text-xs mb-1">Preferred Units</div>
              <div className="text-white font-medium">{userProfile.unit}</div>
            </div>
          )}
        </div>
      </div>

      {/* App Settings Section */}
      <div className="pulse-glass rounded-3xl p-6 space-y-4">
        <h2 className="text-white text-xl font-semibold mb-4">App Settings</h2>
        <div className="space-y-4">
          {/* Rest Timer Default */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Default Rest Timer</div>
              <div className="text-white/70 text-xs mt-1">Default rest duration between sets</div>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">
              {restSelection || 90}s
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {restOptions.map(opt => (
              <button
                key={opt}
                onClick={() => updateRestDuration(opt)}
                className={`h-11 rounded-2xl border text-sm font-medium ${restSelection === opt ? 'bg-white text-slate-900 border-transparent' : 'bg-white/10 text-white border-white/15'}`}
              >
                {opt}s
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="15"
              max="600"
              value={customRestInput}
              onChange={e => setCustomRestInput(e.target.value)}
              placeholder="Custom seconds"
              className="flex-1 h-11 rounded-2xl bg-white/10 border border-white/15 px-3 text-white placeholder-white/40 outline-none"
            />
            <button
              onClick={handleCustomRestSubmit}
              className="h-11 px-4 rounded-2xl bg-white text-slate-900 font-semibold"
            >
              Save
            </button>
          </div>

          {/* Units Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Weight Units</div>
              <div className="text-white/70 text-xs mt-1">Display weight in kg or lbs</div>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">
              {prefs?.units || 'kg'}
            </div>
          </div>

          {/* Voice Feedback Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Voice Feedback</div>
              <div className="text-white/70 text-xs mt-1">Audio confirmation after logging sets</div>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">
              {prefs?.voiceFeedback !== false ? 'On' : 'Off'}
            </div>
          </div>

          {/* Auto-advance Exercise */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Auto-advance Exercise</div>
              <div className="text-white/70 text-xs mt-1">Automatically move to next exercise</div>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">
              {prefs?.autoAdvance !== false ? 'On' : 'Off'}
            </div>
          </div>
        </div>
      </div>

      {/* Data Management Section */}
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

      {/* About Section */}
      <div className="pulse-glass rounded-3xl p-6 space-y-4">
        <h2 className="text-white text-xl font-semibold mb-4">About</h2>
        <div className="space-y-3 text-white/80 text-sm">
          <div>Version 1.0.0</div>
          <div>Built for focused workouts</div>
          <div className="text-white/60 text-xs mt-4">© 2024 Pulse Workout App</div>
        </div>
      </div>

      {/* Confirmation Modals */}
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

