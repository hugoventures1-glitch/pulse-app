// Workout program templates
export const WORKOUT_PROGRAMS = [
  {
    id: 'push-pull-legs',
    name: 'Push Pull Legs',
    daysPerWeek: 6,
    description: 'Build muscle with 6-day split focusing on push, pull, and leg movements',
    days: [
      {
        name: 'Push Day',
        exercises: [
          { name: 'Bench Press', sets: 4, reps: 8, weight: 80 },
          { name: 'Overhead Press', sets: 3, reps: 10, weight: 50 },
          { name: 'Incline DB Press', sets: 3, reps: 12, weight: 60 },
          { name: 'Tricep Dips', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Pull Day',
        exercises: [
          { name: 'Deadlift', sets: 4, reps: 6, weight: 120 },
          { name: 'Pull-ups', sets: 3, reps: 10, weight: 0 },
          { name: 'Barbell Rows', sets: 3, reps: 10, weight: 80 },
          { name: 'Bicep Curls', sets: 3, reps: 12, weight: 30 }
        ]
      },
      {
        name: 'Legs Day',
        exercises: [
          { name: 'Squat', sets: 4, reps: 8, weight: 100 },
          { name: 'Leg Press', sets: 3, reps: 12, weight: 120 },
          { name: 'Leg Curls', sets: 3, reps: 12, weight: 50 },
          { name: 'Calf Raises', sets: 4, reps: 15, weight: 80 }
        ]
      },
      {
        name: 'Push Day',
        exercises: [
          { name: 'Bench Press', sets: 4, reps: 8, weight: 80 },
          { name: 'Overhead Press', sets: 3, reps: 10, weight: 50 },
          { name: 'Incline DB Press', sets: 3, reps: 12, weight: 60 },
          { name: 'Tricep Dips', sets: 3, reps: 12, weight: 0 }
        ]
      },
      {
        name: 'Pull Day',
        exercises: [
          { name: 'Deadlift', sets: 4, reps: 6, weight: 120 },
          { name: 'Pull-ups', sets: 3, reps: 10, weight: 0 },
          { name: 'Barbell Rows', sets: 3, reps: 10, weight: 80 },
          { name: 'Bicep Curls', sets: 3, reps: 12, weight: 30 }
        ]
      },
      {
        name: 'Legs Day',
        exercises: [
          { name: 'Squat', sets: 4, reps: 8, weight: 100 },
          { name: 'Leg Press', sets: 3, reps: 12, weight: 120 },
          { name: 'Leg Curls', sets: 3, reps: 12, weight: 50 },
          { name: 'Calf Raises', sets: 4, reps: 15, weight: 80 }
        ]
      }
    ]
  },
  {
    id: 'upper-lower',
    name: 'Upper Lower Split',
    daysPerWeek: 4,
    description: '4-day split balancing upper and lower body strength',
    days: [
      {
        name: 'Upper Day 1',
        exercises: [
          { name: 'Bench Press', sets: 4, reps: 8, weight: 80 },
          { name: 'Barbell Rows', sets: 4, reps: 8, weight: 80 },
          { name: 'Overhead Press', sets: 3, reps: 10, weight: 50 },
          { name: 'Pull-ups', sets: 3, reps: 10, weight: 0 },
          { name: 'Bicep Curls', sets: 3, reps: 12, weight: 30 }
        ]
      },
      {
        name: 'Lower Day 1',
        exercises: [
          { name: 'Squat', sets: 4, reps: 8, weight: 100 },
          { name: 'Romanian Deadlift', sets: 3, reps: 10, weight: 100 },
          { name: 'Leg Press', sets: 3, reps: 12, weight: 120 },
          { name: 'Leg Curls', sets: 3, reps: 12, weight: 50 }
        ]
      },
      {
        name: 'Upper Day 2',
        exercises: [
          { name: 'Incline Press', sets: 4, reps: 8, weight: 70 },
          { name: 'Lat Pulldown', sets: 4, reps: 10, weight: 60 },
          { name: 'DB Press', sets: 3, reps: 12, weight: 50 },
          { name: 'Face Pulls', sets: 3, reps: 15, weight: 30 }
        ]
      },
      {
        name: 'Lower Day 2',
        exercises: [
          { name: 'Deadlift', sets: 4, reps: 6, weight: 120 },
          { name: 'Front Squat', sets: 3, reps: 8, weight: 80 },
          { name: 'Lunges', sets: 3, reps: 12, weight: 60 },
          { name: 'Calf Raises', sets: 4, reps: 15, weight: 80 }
        ]
      }
    ]
  },
  {
    id: 'full-body',
    name: 'Full Body',
    daysPerWeek: 3,
    description: 'Train everything in each session - perfect for beginners',
    days: [
      {
        name: 'Day 1',
        exercises: [
          { name: 'Squat', sets: 4, reps: 8, weight: 100 },
          { name: 'Bench Press', sets: 4, reps: 8, weight: 80 },
          { name: 'Barbell Rows', sets: 3, reps: 10, weight: 80 },
          { name: 'Overhead Press', sets: 3, reps: 10, weight: 50 },
          { name: 'Bicep Curls', sets: 3, reps: 12, weight: 30 }
        ]
      },
      {
        name: 'Day 2',
        exercises: [
          { name: 'Deadlift', sets: 4, reps: 6, weight: 120 },
          { name: 'Incline Press', sets: 3, reps: 10, weight: 70 },
          { name: 'Pull-ups', sets: 3, reps: 10, weight: 0 },
          { name: 'Lateral Raises', sets: 3, reps: 12, weight: 15 },
          { name: 'Tricep Extensions', sets: 3, reps: 12, weight: 30 }
        ]
      },
      {
        name: 'Day 3',
        exercises: [
          { name: 'Leg Press', sets: 4, reps: 12, weight: 120 },
          { name: 'DB Bench', sets: 4, reps: 10, weight: 60 },
          { name: 'Lat Pulldown', sets: 3, reps: 10, weight: 60 },
          { name: 'DB Shoulder Press', sets: 3, reps: 10, weight: 50 },
          { name: 'Calf Raises', sets: 3, reps: 15, weight: 80 }
        ]
      }
    ]
  },
  {
    id: 'strength-focus',
    name: 'Strength Focus',
    daysPerWeek: 4,
    description: 'Build maximum strength with heavy 5x5 compound lifts',
    days: [
      {
        name: 'Legs',
        exercises: [
          { name: 'Squat', sets: 5, reps: 5, weight: 120 },
          { name: 'Leg Press', sets: 3, reps: 8, weight: 140 },
          { name: 'Leg Curls', sets: 3, reps: 10, weight: 60 }
        ]
      },
      {
        name: 'Push',
        exercises: [
          { name: 'Bench Press', sets: 5, reps: 5, weight: 90 },
          { name: 'Incline Press', sets: 3, reps: 8, weight: 70 },
          { name: 'Tricep Dips', sets: 3, reps: 10, weight: 0 }
        ]
      },
      {
        name: 'Pull',
        exercises: [
          { name: 'Deadlift', sets: 5, reps: 5, weight: 140 },
          { name: 'Barbell Rows', sets: 3, reps: 8, weight: 90 },
          { name: 'Lat Pulldown', sets: 3, reps: 10, weight: 70 }
        ]
      },
      {
        name: 'Shoulders',
        exercises: [
          { name: 'Overhead Press', sets: 5, reps: 5, weight: 60 },
          { name: 'Lateral Raises', sets: 3, reps: 12, weight: 15 },
          { name: 'Face Pulls', sets: 3, reps: 15, weight: 30 }
        ]
      }
    ]
  }
];

