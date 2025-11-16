import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';

// Custom SVG icons
const EditIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const PlayIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const SaveIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const DEFAULT_SETS = [
  { weight: 60, reps: 10 },
  { weight: 60, reps: 10 },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

export default function CreateCustomWorkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    setWorkoutPlan,
    saveCustomWorkoutTemplate,
    getSavedWorkoutById,
    buildPlanFromTemplate,
  } = useWorkout();

  const editingWorkoutId = location.state?.editWorkoutId || null;
  const editingTemplate = editingWorkoutId ? getSavedWorkoutById(editingWorkoutId) : null;

  const [selectedExercises, setSelectedExercises] = useState([]);
  const [openGroups, setOpenGroups] = useState(() => (
    EXERCISE_LIBRARY.reduce((acc, group) => ({ ...acc, [group.id]: true }), {})
  ));
  const [searchTerm, setSearchTerm] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [step, setStep] = useState('select');
  const [savedWorkoutId, setSavedWorkoutId] = useState(null); // Track ID after saving to prevent duplicates
  const selectionRef = useRef(null);

  useEffect(() => {
    if (editingTemplate) {
      setSelectedExercises(clone(editingTemplate.exercises || []).map((exercise) => ({
        name: exercise.name,
        sets: clone(exercise.sets || exercise.setTargets || DEFAULT_SETS),
      })));
      setWorkoutName(editingTemplate.name || 'My Workout');
      setSavedWorkoutId(editingTemplate.id || null); // Set saved ID when editing
      setStep('configure');
    }
  }, [editingTemplate]);

  useEffect(() => {
    if (!editingTemplate && selectedExercises.length === 0) {
      setSelectedExercises([]);
      setStep('select');
    }
  }, [editingTemplate, selectedExercises.length]);

  const selectedExerciseNames = useMemo(() => selectedExercises.map((item) => item.name), [selectedExercises]);

  const filteredLibrary = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return EXERCISE_LIBRARY;
    
    return EXERCISE_LIBRARY.map((group) => {
      // Check if the search term matches the group label (muscle group)
      const groupMatches = group.label.toLowerCase().includes(term) || group.id.toLowerCase().includes(term);
      
      // Filter exercises that match the search term
      const matchingExercises = group.exercises.filter((exercise) => {
        // Check exercise name
        const nameMatches = exercise.name.toLowerCase().includes(term);
        
        // Check aliases if they exist
        const aliasMatches = exercise.aliases?.some(alias => 
          alias.toLowerCase().includes(term)
        ) || false;
        
        // Include if either name or alias matches
        return nameMatches || aliasMatches;
      });
      
      // If group label matches OR there are matching exercises, include the group
      if (groupMatches && matchingExercises.length === 0) {
        // If group matches but no exercises match, show all exercises in that group
        return {
          ...group,
          exercises: group.exercises
        };
      }
      
      // Otherwise, only include if there are matching exercises
      return matchingExercises.length > 0 ? {
        ...group,
        exercises: matchingExercises
      } : null;
    }).filter((group) => group !== null && group.exercises.length > 0);
  }, [searchTerm]);

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const addExercise = (exerciseName) => {
    setSelectedExercises((prev) => {
      if (prev.find((item) => item.name === exerciseName)) {
        return prev;
      }
      return [...prev, { name: exerciseName, sets: clone(DEFAULT_SETS) }];
    });
  };

  const removeExercise = (index) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExerciseByName = (name) => {
    setSelectedExercises((prev) => prev.filter((item) => item.name !== name));
  };

  const moveExercise = (index, direction) => {
    setSelectedExercises((prev) => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const handleNumberInput = (value) => {
    if (value === '') return '';
    const cleaned = value.replace(/^0+/, '');
    return cleaned === '' ? '' : parseInt(cleaned, 10);
  };

  const updateSetField = (exerciseIndex, setIndex, field, value) => {
    setSelectedExercises((prev) => {
      const next = clone(prev);
      const processed = handleNumberInput(value);
      next[exerciseIndex].sets[setIndex][field] = processed === '' ? 0 : processed;
      return next;
    });
  };

  const addSet = (exerciseIndex) => {
    setSelectedExercises((prev) => {
      const next = clone(prev);
      const lastSet = next[exerciseIndex].sets[next[exerciseIndex].sets.length - 1] || { weight: 0, reps: 0 };
      next[exerciseIndex].sets.push({ ...lastSet });
      return next;
    });
  };

  const removeSet = (exerciseIndex, setIndex) => {
    setSelectedExercises((prev) => {
      const next = clone(prev);
      if (next[exerciseIndex].sets.length <= 1) return prev;
      next[exerciseIndex].sets.splice(setIndex, 1);
      return next;
    });
  };

  const adjustSetValue = (exerciseIndex, setIndex, field, delta) => {
    setSelectedExercises((prev) => {
      const next = clone(prev);
      const current = next[exerciseIndex].sets[setIndex][field] || 0;
      const minimum = field === 'reps' ? 1 : 0;
      const nextValue = Math.max(minimum, current + delta);
      next[exerciseIndex].sets[setIndex][field] = nextValue;
      return next;
    });
  };

  // Helper function to save workout (used by both Start and Save buttons)
  const saveWorkoutTemplate = () => {
    const name = workoutName.trim() || 'My Workout';
    
    // Determine the workout ID:
    // 1. Use savedWorkoutId if we've already saved (prevents duplicates)
    // 2. Use editingWorkoutId if editing existing workout
    // 3. Generate new ID if this is a new workout
    let workoutId = savedWorkoutId || editingWorkoutId || null;
    
    // If no ID exists, generate one upfront (matches format used in saveCustomWorkoutTemplate)
    if (!workoutId) {
      workoutId = `cw-${Date.now()}`;
      setSavedWorkoutId(workoutId); // Track it to prevent duplicates on subsequent saves
    }
    
    const template = {
      id: workoutId,
      name,
      exercises: selectedExercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets,
      })),
    };
    
    // Save the workout (will update if ID exists, create new otherwise)
    saveCustomWorkoutTemplate(template);
    
    return template;
  };

  const handleStartWorkout = () => {
    if (selectedExercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }
    
    // Check if this is an update (editing existing workout) or new save
    const isUpdate = !!editingWorkoutId;
    
    // Auto-save workout before starting
    saveWorkoutTemplate();
    
    // Show toast notification
    if (window?.__toast) {
      window.__toast(isUpdate ? 'Workout updated and started' : 'Workout saved and started');
    }
    
    // Then navigate to workout preview
    const plan = buildPlanFromTemplate({ exercises: selectedExercises });
    setWorkoutPlan(plan);
    navigate('/workout-preview', { 
      state: { 
        workoutId: savedWorkoutId || undefined,
        workoutName: workoutName || 'My Workout'
      } 
    });
  };

  const handleSaveWorkout = () => {
    if (selectedExercises.length === 0) {
      if (window?.__toast) window.__toast('Add exercises before saving');
      return;
    }
    if (!workoutName.trim()) {
      setWorkoutName('My Workout');
    }
    setShowSaveDialog(true);
  };

  const confirmSaveWorkout = () => {
    // Save workout (will use existing ID if already saved via Start Workout, preventing duplicates)
    saveWorkoutTemplate();
    setShowSaveDialog(false);
    if (window?.__toast) window.__toast('Workout saved to library');
    navigate('/my-workouts');
  };

  const totalSets = selectedExercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);

  const renderSelectionStep = () => (
    <section ref={selectionRef} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-semibold">1. Choose Exercises</h2>
        <div className="text-white/60 text-xs">{selectedExercises.length} selected</div>
      </div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search exercises"
        className="w-full h-11 rounded-2xl bg-white/10 border border-white/20 px-4 text-white placeholder-white/40 outline-none"
      />

      {selectedExercises.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedExercises.map((exercise) => (
            <span
              key={exercise.name}
              className="px-3 h-8 rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-400/30 text-xs flex items-center gap-2"
            >
              {exercise.name}
              <button
                onClick={() => removeExerciseByName(exercise.name)}
                className="w-5 h-5 rounded-full bg-cyan-500/30 text-white flex items-center justify-center"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="space-y-3 max-h-[360px] overflow-y-auto no-scrollbar">
        {filteredLibrary.map((group) => {
          const isOpen = openGroups[group.id];
          return (
            <div key={group.id} className="pulse-glass rounded-3xl border border-white/15 overflow-hidden">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-white/5 transition"
              >
                <div>
                  <div className="text-white font-semibold text-lg">{group.label}</div>
                  <div className="text-white/60 text-xs">{group.exercises.length} exercises</div>
                </div>
                <svg
                  className={`w-4 h-4 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                  {group.exercises.map((exercise) => {
                    const isSelected = selectedExerciseNames.includes(exercise.name);
                    return (
                      <button
                        key={exercise.name}
                        onClick={() => addExercise(exercise.name)}
                        className={`text-left px-3 py-2 rounded-2xl border text-sm transition ${
                          isSelected
                            ? 'bg-white text-slate-900 border-transparent'
                            : 'bg-white/10 text-white border-white/15'
                        }`}
                      >
                        {exercise.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {filteredLibrary.length === 0 && (
          <div className="text-white/60 text-sm text-center py-6">No exercises found.</div>
        )}
      </div>
    </section>
  );

  const renderConfigureStep = () => (
    <section className="space-y-4 pb-36">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('select')}
            className="h-10 w-10 rounded-xl bg-white/10 text-white border border-white/20 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            title="Back to exercises"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-white text-xl font-semibold">2. Configure Sets</h2>
        </div>
        <div className="text-white/60 text-xs">
          {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} • {totalSets} set{totalSets !== 1 ? 's' : ''}
        </div>
      </div>

      {selectedExercises.length === 0 && (
        <div className="text-white/50 text-sm text-center py-12">
          Add exercises to build your workout.
        </div>
      )}

      <div className="space-y-4">
        {selectedExercises.map((exercise, exerciseIndex) => (
          <div key={exercise.name} className="pulse-glass rounded-3xl border border-white/15 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-white text-lg font-semibold">{exercise.name}</div>
                <div className="text-white/60 text-xs mt-1">{exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveExercise(exerciseIndex, -1)}
                  disabled={exerciseIndex === 0}
                  className={`px-3 h-8 rounded-full border text-xs ${exerciseIndex === 0 ? 'border-white/20 text-white/30 cursor-not-allowed' : 'border-white/20 text-white hover:border-white/40'}`}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveExercise(exerciseIndex, 1)}
                  disabled={exerciseIndex === selectedExercises.length - 1}
                  className={`px-3 h-8 rounded-full border text-xs ${exerciseIndex === selectedExercises.length - 1 ? 'border-white/20 text-white/30 cursor-not-allowed' : 'border-white/20 text-white hover:border-white/40'}`}
                >
                  ↓
                </button>
                <button
                  onClick={() => removeExercise(exerciseIndex)}
                  className="px-3 h-8 rounded-full bg-rose-500/15 text-rose-200 border border-rose-400/30 text-xs"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {exercise.sets.map((set, setIndex) => {
                const isWeightMin = set.weight <= 0;
                const isRepsMin = set.reps <= 1;
                return (
                  <div key={setIndex} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-semibold">Set #{setIndex + 1}</span>
                    <button
                      onClick={() => removeSet(exerciseIndex, setIndex)}
                      disabled={exercise.sets.length <= 1}
                      className={`h-8 w-8 rounded-full border text-white text-base leading-none flex items-center justify-center transition ${
                        exercise.sets.length <= 1
                          ? 'border-white/20 text-white/30 cursor-not-allowed'
                          : 'border-white/20 text-white hover:border-white/40'
                      }`}
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5">
                      <div className="text-white/50 text-[10px] uppercase tracking-[0.2em] mb-2.5 font-medium">Weight (kg)</div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={isWeightMin}
                          onClick={() => adjustSetValue(exerciseIndex, setIndex, 'weight', -1)}
                          className={`h-10 w-10 rounded-full border text-white text-xl flex items-center justify-center transition flex-shrink-0 ${
                            isWeightMin
                              ? 'border-white/15 bg-white/5 text-white/30 cursor-not-allowed'
                              : 'border-white/15 bg-white/10 hover:border-white/35 active:scale-[0.96]'
                          }`}
                        >
                          −
                        </button>
                        <input
                          type="tel"
                          inputMode="numeric"
                          min="0"
                          max="500"
                          step="1"
                          value={set.weight || ''}
                          onChange={(e) => updateSetField(exerciseIndex, setIndex, 'weight', e.target.value)}
                          className="flex-1 h-12 rounded-xl bg-black/20 border border-white/10 text-white text-center text-xl font-bold focus:outline-none focus:border-cyan-400 transition min-w-0"
                        />
                        <button
                          onClick={() => adjustSetValue(exerciseIndex, setIndex, 'weight', 1)}
                          className="h-10 w-10 rounded-full border border-white/15 bg-white/10 text-white text-xl flex items-center justify-center transition hover:border-white/35 active:scale-[0.96] flex-shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5">
                      <div className="text-white/50 text-[10px] uppercase tracking-[0.2em] mb-2.5 font-medium">Reps</div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={isRepsMin}
                          onClick={() => adjustSetValue(exerciseIndex, setIndex, 'reps', -1)}
                          className={`h-10 w-10 rounded-full border text-white text-xl flex items-center justify-center transition flex-shrink-0 ${
                            isRepsMin
                              ? 'border-white/15 bg-white/5 text-white/30 cursor-not-allowed'
                              : 'border-white/15 bg-white/10 hover:border-white/35 active:scale-[0.96]'
                          }`}
                        >
                          −
                        </button>
                        <input
                          type="tel"
                          inputMode="numeric"
                          min="1"
                          max="50"
                          step="1"
                          value={set.reps || ''}
                          onChange={(e) => updateSetField(exerciseIndex, setIndex, 'reps', e.target.value)}
                          className="flex-1 h-12 rounded-xl bg-black/20 border border-white/10 text-white text-center text-xl font-bold focus:outline-none focus:border-cyan-400 transition min-w-0"
                        />
                        <button
                          onClick={() => adjustSetValue(exerciseIndex, setIndex, 'reps', 1)}
                          className="h-10 w-10 rounded-full border border-white/15 bg-white/10 text-white text-xl flex items-center justify-center transition hover:border-white/35 active:scale-[0.96] flex-shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => addSet(exerciseIndex)}
            className="w-full h-11 rounded-2xl border border-dashed border-white/20 text-white/80 text-sm font-semibold bg-white/5 active:scale-[0.99] transition"
          >
            + Add Set
          </button>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-[calc(180px+env(safe-area-inset-bottom))] space-y-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400/30 to-emerald-400/20 flex items-center justify-center">
            <EditIcon className="w-5 h-5 text-green-300" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold">{editingTemplate ? 'Edit Workout' : 'Create Custom Workout'}</h1>
            <p className="text-white/60 text-sm">{editingTemplate ? 'Update your routine' : 'Build your own routine'}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/workout')}
          className="px-4 h-9 rounded-xl bg-white/10 text-white border border-white/15 text-sm transition-transform hover:scale-105 active:scale-95"
        >
          Cancel
        </button>
      </div>

      {step === 'select' ? renderSelectionStep() : renderConfigureStep()}

      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto w-full max-w-[375px] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
          <div className="pulse-glass rounded-2xl p-4 space-y-3">
            {step === 'select' ? (
              <>
                <div className="flex items-center justify-between text-white/70 text-sm">
                  <div>{selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} selected</div>
                </div>
                <button
                  onClick={() => setStep('configure')}
                  disabled={selectedExercises.length === 0}
                  className={`w-full h-12 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                    selectedExercises.length > 0
                      ? 'text-white shadow-lg hover:scale-105 active:scale-95'
                      : 'bg-white/10 text-white/50 cursor-not-allowed'
                  }`}
                  style={selectedExercises.length > 0 ? {
                    background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
                    boxShadow: '0 4px 16px rgba(255, 149, 0, 0.3)'
                  } : {}}
                >
                  <PlayIcon className="w-5 h-5" />
                  Continue
                </button>
                {selectedExercises.length === 0 && (
                  <div className="text-white/60 text-xs text-center">Select exercises to continue</div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-white/70 text-sm">
                  <div>{selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''}</div>
                  <div>{totalSets} total sets</div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('select')}
                    className="flex-1 h-12 rounded-2xl bg-white/10 text-white border border-white/20 font-medium active:scale-[0.99] transition"
                  >
                    Add Exercise
                  </button>
                  <button
                    onClick={handleSaveWorkout}
                    className="flex-1 h-12 rounded-xl bg-white/10 text-white border border-white/20 font-medium active:scale-95 transition-all hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <SaveIcon className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={handleStartWorkout}
                    disabled={selectedExercises.length === 0}
                    className={`flex-1 h-12 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                      selectedExercises.length > 0
                        ? 'text-white shadow-lg hover:scale-105 active:scale-95'
                        : 'bg-white/10 text-white/50 cursor-not-allowed'
                    }`}
                    style={selectedExercises.length > 0 ? {
                      background: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
                      boxShadow: '0 4px 16px rgba(255, 149, 0, 0.3)'
                    } : {}}
                  >
                    <PlayIcon className="w-5 h-5" />
                    Start
                  </button>
                </div>
                {selectedExercises.length === 0 && (
                  <div className="text-white/60 text-xs text-center">Add exercises to enable Start Workout</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSaveDialog(false)} />
          <div className="absolute inset-x-0 bottom-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
            <div className="pulse-glass rounded-3xl p-5 border border-white/15 space-y-4">
              <div>
                <h3 className="text-white text-lg font-semibold">Name your workout</h3>
                <p className="text-white/60 text-xs mt-1">Save this routine to your library for quick access.</p>
              </div>
              <input
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g. Lower Body Power"
                className="w-full h-11 rounded-2xl bg-white/10 border border-white/20 px-4 text-white placeholder-white/30 outline-none"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 h-11 rounded-2xl bg-white/10 text-white border border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSaveWorkout}
                  className="flex-1 h-11 rounded-2xl bg-white text-slate-900 font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

