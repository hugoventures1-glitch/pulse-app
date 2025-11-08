export const EXERCISE_LIBRARY = [
  {
    id: 'chest',
    label: 'Chest',
    exercises: [
      { name: 'Bench Press', aliases: ['bench press', 'barbell bench press'] },
      { name: 'Incline Bench Press', aliases: ['incline bench press', 'incline barbell bench press'] },
      { name: 'Decline Bench Press', aliases: ['decline bench press', 'decline barbell bench press'] },
      { name: 'Dumbbell Press', aliases: ['dumbbell bench press', 'db bench press'] },
      { name: 'Incline Dumbbell Press', aliases: ['incline dumbbell press', 'incline db press'] },
      { name: 'Dumbbell Flyes', aliases: ['dumbbell flyes', 'db flyes', 'chest flyes'] },
      { name: 'Cable Flyes', aliases: ['cable flyes', 'cable chest flyes'] },
      { name: 'Chest Dips', aliases: ['chest dips', 'dips'], bodyweight: true },
      { name: 'Push-ups', aliases: ['push ups', 'pushups'], bodyweight: true },
      { name: 'Machine Chest Press', aliases: ['machine chest press', 'chest press machine'] }
    ]
  },
  {
    id: 'back',
    label: 'Back',
    exercises: [
      { name: 'Deadlift', aliases: ['deadlift', 'conventional deadlift'] },
      { name: 'Barbell Rows', aliases: ['barbell rows', 'barbell row', 'bent over row'] },
      { name: 'Dumbbell Rows', aliases: ['dumbbell rows', 'db rows', 'one arm row'] },
      { name: 'T-Bar Rows', aliases: ['t-bar rows', 't bar row'] },
      { name: 'Cable Rows', aliases: ['cable rows', 'seated cable row'] },
      { name: 'Lat Pulldown', aliases: ['lat pulldown', 'lat pull down'] },
      { name: 'Pull-ups', aliases: ['pull ups', 'pullups'], bodyweight: true },
      { name: 'Chin-ups', aliases: ['chin ups', 'chinups'], bodyweight: true },
      { name: 'Face Pulls', aliases: ['face pulls', 'face pull'] },
      { name: 'Shrugs', aliases: ['shrugs', 'dumbbell shrugs', 'barbell shrugs'] },
      { name: 'Hyperextensions', aliases: ['hyperextensions', 'back extensions'] }
    ]
  },
  {
    id: 'legs',
    label: 'Legs',
    exercises: [
      { name: 'Squat', aliases: ['squat', 'back squat'] },
      { name: 'Front Squat', aliases: ['front squat'] },
      { name: 'Leg Press', aliases: ['leg press'] },
      { name: 'Leg Extension', aliases: ['leg extension', 'leg extensions'] },
      { name: 'Leg Curl', aliases: ['leg curl', 'leg curls', 'hamstring curl'] },
      { name: 'Romanian Deadlift', aliases: ['romanian deadlift', 'rdl'] },
      { name: 'Lunges', aliases: ['lunges', 'lunge'] },
      { name: 'Bulgarian Split Squat', aliases: ['bulgarian split squat', 'split squat'] },
      { name: 'Calf Raises', aliases: ['calf raises', 'calf raise'] },
      { name: 'Hack Squat', aliases: ['hack squat'] }
    ]
  },
  {
    id: 'shoulders',
    label: 'Shoulders',
    exercises: [
      { name: 'Overhead Press', aliases: ['overhead press', 'ohp', 'barbell overhead press'] },
      { name: 'Dumbbell Shoulder Press', aliases: ['dumbbell shoulder press', 'db shoulder press'] },
      { name: 'Lateral Raises', aliases: ['lateral raises', 'side raises'] },
      { name: 'Front Raises', aliases: ['front raises', 'front raise'] },
      { name: 'Rear Delt Flyes', aliases: ['rear delt flyes', 'rear delt fly'] },
      { name: 'Arnold Press', aliases: ['arnold press'] },
      { name: 'Upright Rows', aliases: ['upright rows', 'upright row'] },
      { name: 'Machine Shoulder Press', aliases: ['machine shoulder press', 'shoulder press machine'] }
    ]
  },
  {
    id: 'arms',
    label: 'Arms',
    exercises: [
      { name: 'Barbell Curl', aliases: ['barbell curl', 'barbell curls'] },
      { name: 'Dumbbell Curl', aliases: ['dumbbell curl', 'db curl', 'db curls'] },
      { name: 'Hammer Curl', aliases: ['hammer curl', 'hammer curls'] },
      { name: 'Preacher Curl', aliases: ['preacher curl', 'preacher curls'] },
      { name: 'Cable Curl', aliases: ['cable curl', 'cable curls'] },
      { name: 'Tricep Dips', aliases: ['tricep dips', 'bench dips'], bodyweight: true },
      { name: 'Tricep Pushdown', aliases: ['tricep pushdown', 'pushdown', 'rope pushdown'] },
      { name: 'Overhead Tricep Extension', aliases: ['overhead tricep extension', 'tricep extension overhead'] },
      { name: 'Skull Crushers', aliases: ['skull crushers', 'lying tricep extensions'] },
      { name: 'Close-Grip Bench', aliases: ['close grip bench', 'close grip bench press'] }
    ]
  },
  {
    id: 'core',
    label: 'Core',
    exercises: [
      { name: 'Planks', aliases: ['plank', 'planks'], bodyweight: true },
      { name: 'Crunches', aliases: ['crunches', 'crunch'], bodyweight: true },
      { name: 'Russian Twists', aliases: ['russian twists', 'russian twist'], bodyweight: true },
      { name: 'Leg Raises', aliases: ['leg raises', 'hanging leg raise'], bodyweight: true },
      { name: 'Cable Crunches', aliases: ['cable crunches', 'cable crunch'] },
      { name: 'Ab Wheel', aliases: ['ab wheel', 'ab rollout', 'ab rollouts'], bodyweight: true },
      { name: 'Mountain Climbers', aliases: ['mountain climbers', 'mountain climber'], bodyweight: true }
    ]
  }
];

export const FLAT_EXERCISES = EXERCISE_LIBRARY.flatMap(({ id, label, exercises }) =>
  exercises.map((exercise) => ({ ...exercise, groupId: id, groupLabel: label }))
);

export const EXERCISE_ALIAS_MAP = (() => {
  const entries = [];
  FLAT_EXERCISES.forEach((exercise) => {
    const aliases = new Set([exercise.name, ...(exercise.aliases || [])]);
    aliases.forEach((alias) => {
      entries.push([alias.toLowerCase(), exercise.name]);
    });
  });
  return new Map(entries);
})();

export const EXERCISE_NAME_SET = new Set(FLAT_EXERCISES.map((exercise) => exercise.name));

export const BODYWEIGHT_EXERCISES = new Set(
  FLAT_EXERCISES.filter((exercise) => exercise.bodyweight).map((exercise) => exercise.name)
);
