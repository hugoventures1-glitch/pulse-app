import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';

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
  const selectionRef = useRef(null);

  useEffect(() => {
    if (editingTemplate) {
      setSelectedExercises(clone(editingTemplate.exercises || []).map((exercise) => ({
        name: exercise.name,
        sets: clone(exercise.sets || exercise.setTargets || DEFAULT_SETS),
      })));
      setWorkoutName(editingTemplate.name || 'My Workout');
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
    return EXERCISE_LIBRARY.map((group) => ({
      ...group,
      exercises: group.exercises.filter((exercise) => exercise.name.toLowerCase().includes(term)),
    })).filter((group) => group.exercises.length > 0);
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

  const updateSetField = (exerciseIndex, setIndex, field, value) => {
    setSelectedExercises((prev) => {
      const next = clone(prev);
      const parsed = parseInt(value, 10);
      next[exerciseIndex].sets[setIndex][field] = Number.isFinite(parsed) ? parsed : 0;
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

  const copyPreviousSet = (exerciseIndex, setIndex) => {
    setSelectedExercises((prev) => {
      const next = clone(prev);
      if (setIndex === 0) return prev;
      const source = next[exerciseIndex].sets[setIndex - 1];
      next[exerciseIndex].sets[setIndex] = { ...source };
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

  const handleStartWorkout = () => {
    if (selectedExercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }
    const plan = buildPlanFromTemplate({ exercises: selectedExercises });
    setWorkoutPlan(plan);
    navigate('/focus');
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
    const name = workoutName.trim() || 'My Workout';
    const template = {
      id: editingWorkoutId || undefined,
      name,
      exercises: selectedExercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets,
      })),
    };
    saveCustomWorkoutTemplate(template);
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
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-semibold">2. Configure Sets</h2>
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

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-[60px,1fr,1fr,auto] bg-white/5 text-white/60 text-xs uppercase tracking-wide">
                <div className="px-3 py-2">Set</div>
                <div className="px-3 py-2">Weight (kg)</div>
                <div className="px-3 py-2">Reps</div>
                <div className="px-3 py-2 text-right">Actions</div>
              </div>
              {exercise.sets.map((set, setIndex) => (
                <div key={setIndex} className="grid grid-cols-[60px,1fr,1fr,auto] border-t border-white/10 bg-white/5">
                  <div className="px-3 py-3 text-white text-sm flex items-center">#{setIndex + 1}</div>
                  <div className="px-3 py-2 flex items-center">
                    <div className="w-full">
                      <div className="text-white/50 text-[10px] uppercase tracking-wide mb-1">Weight (kg)</div>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={set.weight}
                        onChange={(e) => updateSetField(exerciseIndex, setIndex, 'weight', e.target.value)}
                        className="w-full h-10 rounded-xl bg-white/10 border border-white/20 text-white text-center focus:outline-none focus:border-cyan-400 transition"
                      />
                    </div>
                  </div>
                  <div className="px-3 py-2 flex items-center">
                    <div className="w-full">
                      <div className="text-white/50 text-[10px] uppercase tracking-wide mb-1">Reps</div>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={set.reps}
                        onChange={(e) => updateSetField(exerciseIndex, setIndex, 'reps', e.target.value)}
                        className="w-full h-10 rounded-xl bg-white/10 border border-white/20 text-white text-center focus:outline-none focus:border-cyan-400 transition"
                      />
                    </div>
                  </div>
                  <div className="px-3 py-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => copyPreviousSet(exerciseIndex, setIndex)}
                      disabled={setIndex === 0}
                      className={`px-3 h-9 rounded-xl border text-xs ${setIndex === 0 ? 'border-white/20 text-white/30 cursor-not-allowed' : 'border-white/20 text-white hover:border-white/40'}`}
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => removeSet(exerciseIndex, setIndex)}
                      disabled={exercise.sets.length <= 1}
                      className={`px-3 h-9 rounded-xl border text-xs ${exercise.sets.length <= 1 ? 'border-white/20 text-white/30 cursor-not-allowed' : 'border-white/20 text-white hover:border-white/40'}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => addSet(exerciseIndex)}
              className="w-full h-10 rounded-2xl border border-dashed border-white/20 text-white/80 text-sm bg-white/5 active:scale-[0.99] transition"
            >
              + Add Set
            </button>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-[calc(180px+env(safe-area-inset-bottom))] space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-3xl font-bold">Create Custom Workout</h1>
        <button
          onClick={() => navigate('/workout')}
          className="px-4 h-9 rounded-full bg-white/10 text-white border border-white/10 text-sm"
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
                  className={`w-full h-12 rounded-2xl font-bold text-lg transition ${
                    selectedExercises.length > 0
                      ? 'bg-white text-slate-900 active:scale-[0.99]'
                      : 'bg-white/10 text-white/50 cursor-not-allowed'
                  }`}
                >
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
                    className="flex-1 h-12 rounded-2xl bg-white/10 text-white border border-cyan-400/40 font-medium active:scale-[0.99] transition"
                  >
                    Save Workout
                  </button>
                  <button
                    onClick={handleStartWorkout}
                    disabled={selectedExercises.length === 0}
                    className={`flex-1 h-12 rounded-2xl font-bold text-lg transition ${
                      selectedExercises.length > 0
                        ? 'bg-white text-slate-900 active:scale-[0.99]'
                        : 'bg-white/10 text-white/50 cursor-not-allowed'
                    }`}
                  >
                    Start Workout
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

