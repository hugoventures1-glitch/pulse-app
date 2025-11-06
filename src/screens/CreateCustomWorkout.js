import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../state/WorkoutContext';

const COMMON_EXERCISES = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Shoulder Press',
  'Barbell Rows',
  'Pull-ups',
  'Bicep Curls',
  'Tricep Extensions',
  'Leg Press',
  'Leg Curls',
  'Calf Raises',
  'Lateral Raises',
  'Chest Flyes',
  'Lat Pulldowns',
  'Overhead Press',
  'Romanian Deadlift',
  'Lunges',
  'Dips',
  'Hammer Curls',
  'Face Pulls'
];

export default function CreateCustomWorkout() {
  const navigate = useNavigate();
  const { setWorkoutPlan } = useWorkout();
  
  const [selectedExercises, setSelectedExercises] = useState({});
  
  const toggleExercise = (exerciseName) => {
    setSelectedExercises(prev => {
      const newState = { ...prev };
      if (newState[exerciseName]) {
        delete newState[exerciseName];
      } else {
        newState[exerciseName] = {
          name: exerciseName,
          sets: 3,
          reps: 8,
          weight: 60
        };
      }
      return newState;
    });
  };

  const updateExercise = (exerciseName, field, value) => {
    setSelectedExercises(prev => ({
      ...prev,
      [exerciseName]: {
        ...prev[exerciseName],
        [field]: parseInt(value) || 0
      }
    }));
  };

  const handleStartWorkout = () => {
    const plan = Object.values(selectedExercises);
    if (plan.length === 0) {
      alert('Please select at least one exercise');
      return;
    }
    setWorkoutPlan(plan);
    navigate('/focus');
  };

  const selectedCount = Object.keys(selectedExercises).length;

  return (
    <div className="w-full max-w-[375px] px-4 pt-6 pb-32">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-3xl font-bold">Create Custom Workout</h1>
        <button 
          onClick={() => navigate('/workout')}
          className="px-4 h-9 rounded-full bg-white/10 text-white border border-white/10 text-sm"
        >
          Cancel
        </button>
      </div>

      {/* Selected count indicator */}
      {selectedCount > 0 && (
        <div className="mb-4 pulse-glass rounded-2xl px-4 py-2">
          <div className="text-white/90 text-sm">
            {selectedCount} exercise{selectedCount !== 1 ? 's' : ''} selected
          </div>
        </div>
      )}

      {/* Exercise selection list */}
      <div className="space-y-3 mb-6">
        <div className="text-white/90 text-lg font-semibold mb-2">Select Exercises</div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
          {COMMON_EXERCISES.map((exercise) => {
            const isSelected = !!selectedExercises[exercise];
            const exerciseData = selectedExercises[exercise];
            
            return (
              <div key={exercise} className="pulse-glass rounded-2xl overflow-hidden border border-white/15">
                {/* Exercise row with checkbox */}
                <button
                  onClick={() => toggleExercise(exercise)}
                  className="w-full flex items-center justify-between p-4 text-left active:bg-white/5 transition"
                >
                  <span className={`text-white font-medium ${isSelected ? 'font-semibold' : ''}`}>
                    {exercise}
                  </span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-cyan-500 border-cyan-500' 
                      : 'border-white/30'
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Expanded inputs for selected exercise */}
                {isSelected && exerciseData && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                    <div className="grid grid-cols-3 gap-2">
                      {/* Sets */}
                      <div>
                        <label className="text-white/70 text-xs mb-1 block">Sets</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={exerciseData.sets || 3}
                          onChange={(e) => updateExercise(exercise, 'sets', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-center focus:outline-none focus:border-cyan-400 transition"
                        />
                      </div>

                      {/* Reps */}
                      <div>
                        <label className="text-white/70 text-xs mb-1 block">Reps</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={exerciseData.reps || 8}
                          onChange={(e) => updateExercise(exercise, 'reps', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-center focus:outline-none focus:border-cyan-400 transition"
                        />
                      </div>

                      {/* Weight */}
                      <div>
                        <label className="text-white/70 text-xs mb-1 block">Weight (kg)</label>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={exerciseData.weight || 60}
                          onChange={(e) => updateExercise(exercise, 'weight', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-center focus:outline-none focus:border-cyan-400 transition"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom action buttons */}
      <div className="fixed inset-x-0 bottom-0 z-20">
        <div className="mx-auto w-full max-w-[375px] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
          <div className="pulse-glass rounded-2xl p-4 space-y-2">
            <button
              onClick={handleStartWorkout}
              disabled={selectedCount === 0}
              className={`w-full h-14 rounded-2xl font-bold text-lg transition ${
                selectedCount > 0
                  ? 'bg-white text-slate-900 active:scale-[0.99]'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              Start Workout
            </button>
            {selectedCount === 0 && (
              <p className="text-white/60 text-xs text-center">Select at least one exercise to start</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

