import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const emptyExercise = (name = 'New Exercise') => ({
  name,
  sets: 3,
  reps: 10,
  weight: 0,
});

const buildWorkoutPreview = (program) => (
  program.days.flatMap((day) => day.exercises.map((exercise) => ({
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    weight: exercise.weight,
    setTargets: exercise.sets ? exercise.sets.map((set) => ({ weight: set.weight ?? exercise.weight ?? 0, reps: set.reps ?? exercise.reps ?? 0 })) : [{ weight: exercise.weight ?? 0, reps: exercise.reps ?? 0 }].filter(Boolean),
  })))
);

export default function CustomizeProgram() {
  const navigate = useNavigate();
  const location = useLocation();
  const programId = location.state?.programId || null;

  const {
    getProgramDefinition,
    getBaseProgram,
    saveCustomProgram,
    saveCustomWorkoutTemplate,
  } = useWorkout();

  const baseTemplate = useMemo(() => getBaseProgram(programId), [getBaseProgram, programId]);
  const existingProgram = useMemo(() => getProgramDefinition(programId), [getProgramDefinition, programId]);

  const [editedProgram, setEditedProgram] = useState(() => existingProgram ? deepClone(existingProgram) : null);
  const [pickerState, setPickerState] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [customWorkoutName, setCustomWorkoutName] = useState('');

  useEffect(() => {
    if (!programId || !baseTemplate) {
      navigate('/choose-program', { replace: true });
      return;
    }
    const source = existingProgram || {
      ...deepClone(baseTemplate),
      name: `My ${baseTemplate.name}`,
    };
    setEditedProgram(deepClone(source));
    setCustomWorkoutName(`${baseTemplate.name} - Modified`);
  }, [programId, baseTemplate, existingProgram, navigate]);

  if (!programId || !editedProgram || !baseTemplate) {
    return null;
  }

  const updateExerciseField = (dayIndex, exerciseIndex, field, value) => {
    setEditedProgram((prev) => {
      const next = deepClone(prev);
      const parsed = ['sets', 'reps', 'weight'].includes(field) ? parseInt(value, 10) || 0 : value;
      next.days[dayIndex].exercises[exerciseIndex][field] = parsed;
      return next;
    });
  };

  const removeExercise = (dayIndex, exerciseIndex) => {
    setEditedProgram((prev) => {
      const next = deepClone(prev);
      next.days[dayIndex].exercises.splice(exerciseIndex, 1);
      return next;
    });
  };

  const openPicker = (mode, payload) => {
    setPickerState({ mode, ...payload });
    setSearchTerm('');
  };

  const closePicker = () => {
    setPickerState(null);
    setSearchTerm('');
  };

  const handleSelectExercise = (exerciseName) => {
    if (!pickerState) return;
    setEditedProgram((prev) => {
      const next = deepClone(prev);
      const { mode, dayIndex, exerciseIndex } = pickerState;
      if (mode === 'swap') {
        next.days[dayIndex].exercises[exerciseIndex].name = exerciseName;
      } else if (mode === 'add') {
        next.days[dayIndex].exercises.push({ ...emptyExercise(exerciseName) });
      }
      return next;
    });
    closePicker();
  };

  const addExercise = (dayIndex) => {
    openPicker('add', { dayIndex });
  };

  const swapExercise = (dayIndex, exerciseIndex) => {
    openPicker('swap', { dayIndex, exerciseIndex });
  };

  const handleSave = () => {
    const sanitized = deepClone(editedProgram);
    sanitized.id = programId;
    sanitized.name = sanitized.name || `My ${baseTemplate.name}`;
    sanitized.days = sanitized.days.map((day) => ({
      name: day.name,
      exercises: day.exercises.map((exercise) => ({
        name: exercise.name,
        sets: Number(exercise.sets) || 0,
        reps: Number(exercise.reps) || 0,
        weight: Number(exercise.weight) || 0,
      })),
    }));
    saveCustomProgram(programId, sanitized);
    setShowSaveDialog(true);
  };

  const filteredLibrary = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return EXERCISE_LIBRARY;
    return EXERCISE_LIBRARY.map((group) => ({
      ...group,
      exercises: group.exercises.filter((exercise) => exercise.name.toLowerCase().includes(term)),
    })).filter((group) => group.exercises.length > 0);
  }, [searchTerm]);

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-[calc(160px+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-3xl font-bold">Customize Program</h1>
          <div className="text-white/70 text-sm mt-1">{baseTemplate.name}</div>
        </div>
        <button
          onClick={() => navigate('/choose-program')}
          className="px-4 h-9 rounded-full bg-white/10 text-white border border-white/10 text-sm"
        >
          Back
        </button>
      </div>

      <div className="space-y-4 mb-20">
        {editedProgram.days.map((day, dayIndex) => (
          <div key={dayIndex} className="pulse-glass rounded-3xl border border-white/15 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-white text-xl font-semibold">{day.name}</div>
                <div className="text-white/60 text-xs mt-1">{day.exercises.length} exercises</div>
              </div>
            </div>

            <div className="space-y-3">
              {day.exercises.map((exercise, exerciseIndex) => (
                <div key={`${exercise.name}-${exerciseIndex}`} className="rounded-2xl border border-white/10 p-3 bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-white font-semibold text-base">{exercise.name}</div>
                      <div className="text-white/60 text-xs mt-1">Sets, reps & weight</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => swapExercise(dayIndex, exerciseIndex)}
                        className="px-3 h-8 rounded-full bg-white/10 text-white border border-white/15 text-xs"
                      >
                        Swap
                      </button>
                      <button
                        onClick={() => removeExercise(dayIndex, exerciseIndex)}
                        className="px-3 h-8 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Sets</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={exercise.sets || 0}
                        onChange={(e) => updateExerciseField(dayIndex, exerciseIndex, 'sets', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-center focus:outline-none focus:border-cyan-400 transition"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Reps</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={exercise.reps || 0}
                        onChange={(e) => updateExerciseField(dayIndex, exerciseIndex, 'reps', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-center focus:outline-none focus:border-cyan-400 transition"
                      />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Weight (kg)</label>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={exercise.weight || 0}
                        onChange={(e) => updateExerciseField(dayIndex, exerciseIndex, 'weight', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-center focus:outline-none focus:border-cyan-400 transition"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addExercise(dayIndex)}
                className="w-full h-10 rounded-2xl border border-dashed border-white/20 text-white/80 text-sm bg-white/5 active:scale-[0.99] transition"
              >
                Add Exercise
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20">
        <div className="mx-auto w-full max-w-[375px] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
          <div className="pulse-glass rounded-2xl p-4 space-y-2">
            <button
              onClick={handleSave}
              className="w-full h-14 rounded-2xl font-bold text-lg bg-white text-slate-900 active:scale-[0.99] transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {pickerState && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={closePicker} />
          <div className="absolute inset-x-0 bottom-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
            <div className="pulse-glass rounded-3xl p-4 max-h-[70vh] overflow-y-auto no-scrollbar border border-white/15">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-lg font-semibold">
                  {pickerState.mode === 'swap' ? 'Swap Exercise' : 'Add Exercise'}
                </h3>
                <button
                  onClick={closePicker}
                  className="px-3 h-8 rounded-full bg-white/10 text-white border border-white/15 text-xs"
                >
                  Close
                </button>
              </div>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search exercises"
                className="w-full h-10 rounded-2xl bg-white/10 border border-white/20 px-3 text-white placeholder-white/40 outline-none mb-3"
              />
              <div className="space-y-3">
                {filteredLibrary.map((group) => (
                  <div key={group.id}>
                    <div className="text-white/70 text-xs uppercase tracking-wide mb-2">{group.label}</div>
                    <div className="space-y-2">
                      {group.exercises.map((exercise) => (
                        <button
                          key={exercise.name}
                          onClick={() => handleSelectExercise(exercise.name)}
                          className="w-full text-left px-3 py-2 rounded-2xl bg-white/10 border border-white/15 text-white text-sm active:bg-white/15 transition"
                        >
                          {exercise.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredLibrary.length === 0 && (
                  <div className="text-white/60 text-sm text-center py-8">No exercises found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSaveDialog(false)} />
          <div className="absolute inset-x-0 bottom-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
            <div className="pulse-glass rounded-3xl p-5 border border-white/15 space-y-4">
              <div>
                <h3 className="text-white text-lg font-semibold">Save as custom workout</h3>
                <p className="text-white/60 text-xs mt-1">This keeps the original {baseTemplate.name} intact.</p>
              </div>
              <input
                value={customWorkoutName}
                onChange={(e) => setCustomWorkoutName(e.target.value)}
                placeholder={`${baseTemplate.name} - Modified`}
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
                  onClick={() => {
                    const name = customWorkoutName.trim() || `${baseTemplate.name} - Modified`;
                    saveCustomWorkoutTemplate({
                      name,
                      sourceProgramId: programId,
                      sourceProgramName: baseTemplate.name,
                      exercises: buildWorkoutPreview(editedProgram).map((exercise) => ({
                        name: exercise.name,
                        sets: exercise.setTargets,
                      })),
                    });
                    setShowSaveDialog(false);
                    if (window?.__toast) window.__toast('Saved to My Workouts!');
                    navigate('/my-workouts');
                  }}
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
