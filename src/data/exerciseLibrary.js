export const EXERCISE_LIBRARY = [
  {
    id: 'chest',
    label: 'Chest',
    exercises: [
      { name: 'Bench Press', aliases: ['bench press', 'barbell bench press', 'flat bench'], equipment: 'Barbell' },
      { name: 'Incline Bench Press', aliases: ['incline bench press', 'incline barbell bench press'], equipment: 'Barbell' },
      { name: 'Decline Bench Press', aliases: ['decline bench press', 'decline barbell bench press'], equipment: 'Barbell' },
      { name: 'Close-Grip Bench Press', aliases: ['close grip bench press', 'close grip bench'], equipment: 'Barbell' },
      { name: 'Wide-Grip Bench Press', aliases: ['wide grip bench press', 'wide grip bench'], equipment: 'Barbell' },
      { name: 'Dumbbell Press', aliases: ['dumbbell bench press', 'db bench press', 'dumbbell flat press'], equipment: 'Dumbbell' },
      { name: 'Incline Dumbbell Press', aliases: ['incline dumbbell press', 'incline db press'], equipment: 'Dumbbell' },
      { name: 'Decline Dumbbell Press', aliases: ['decline dumbbell press', 'decline db press'], equipment: 'Dumbbell' },
      { name: 'Dumbbell Flyes', aliases: ['dumbbell flyes', 'db flyes', 'chest flyes'], equipment: 'Dumbbell' },
      { name: 'Incline Dumbbell Flyes', aliases: ['incline dumbbell flyes', 'incline flyes'], equipment: 'Dumbbell' },
      { name: 'Decline Dumbbell Flyes', aliases: ['decline dumbbell flyes', 'decline flyes'], equipment: 'Dumbbell' },
      { name: 'Cable Flyes', aliases: ['cable flyes', 'cable chest flyes'], equipment: 'Cable' },
      { name: 'Incline Cable Flyes', aliases: ['incline cable flyes'], equipment: 'Cable' },
      { name: 'Decline Cable Flyes', aliases: ['decline cable flyes'], equipment: 'Cable' },
      { name: 'Chest Dips', aliases: ['chest dips', 'dips', 'weighted dips'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Push-ups', aliases: ['push ups', 'pushups', 'push up'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Incline Push-ups', aliases: ['incline push ups', 'incline pushups'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Decline Push-ups', aliases: ['decline push ups', 'decline pushups'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Wide Push-ups', aliases: ['wide push ups', 'wide pushups'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Diamond Push-ups', aliases: ['diamond push ups', 'diamond pushups'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Machine Chest Press', aliases: ['machine chest press', 'chest press machine'], equipment: 'Machine' },
      { name: 'Pec Deck', aliases: ['pec deck', 'pec deck fly'], equipment: 'Machine' },
      { name: 'Cable Crossover', aliases: ['cable crossover', 'cable crossovers'], equipment: 'Cable' },
      { name: 'Kettlebell Floor Press', aliases: ['kettlebell floor press', 'kb floor press'], equipment: 'Kettlebell' },
      { name: 'Resistance Band Chest Press', aliases: ['band chest press', 'resistance band press'], equipment: 'Resistance Band' }
    ]
  },
  {
    id: 'back',
    label: 'Back',
    exercises: [
      { name: 'Deadlift', aliases: ['deadlift', 'conventional deadlift', 'sumo deadlift'], equipment: 'Barbell' },
      { name: 'Romanian Deadlift', aliases: ['romanian deadlift', 'rdl'], equipment: 'Barbell' },
      { name: 'Sumo Deadlift', aliases: ['sumo deadlift', 'sumo dl'], equipment: 'Barbell' },
      { name: 'Trap Bar Deadlift', aliases: ['trap bar deadlift', 'hex bar deadlift'], equipment: 'Barbell' },
      { name: 'Barbell Rows', aliases: ['barbell rows', 'barbell row', 'bent over row', 'barbell bent over row'], equipment: 'Barbell' },
      { name: 'Pendlay Row', aliases: ['pendlay row', 'pendlay rows'], equipment: 'Barbell' },
      { name: 'Yates Row', aliases: ['yates row', 'yates rows'], equipment: 'Barbell' },
      { name: 'Dumbbell Rows', aliases: ['dumbbell rows', 'db rows', 'one arm row', 'one arm dumbbell row'], equipment: 'Dumbbell' },
      { name: 'Incline Dumbbell Row', aliases: ['incline dumbbell row', 'incline db row'], equipment: 'Dumbbell' },
      { name: 'Chest Supported Row', aliases: ['chest supported row', 'chest supported rows'], equipment: 'Dumbbell' },
      { name: 'T-Bar Rows', aliases: ['t-bar rows', 't bar row', 'tbar row'], equipment: 'Barbell' },
      { name: 'Cable Rows', aliases: ['cable rows', 'seated cable row', 'seated row'], equipment: 'Cable' },
      { name: 'Cable High Row', aliases: ['cable high row', 'high cable row'], equipment: 'Cable' },
      { name: 'Lat Pulldown', aliases: ['lat pulldown', 'lat pull down', 'wide grip lat pulldown'], equipment: 'Cable' },
      { name: 'Close-Grip Lat Pulldown', aliases: ['close grip lat pulldown', 'close grip pulldown'], equipment: 'Cable' },
      { name: 'Reverse-Grip Lat Pulldown', aliases: ['reverse grip lat pulldown', 'reverse pulldown'], equipment: 'Cable' },
      { name: 'Pull-ups', aliases: ['pull ups', 'pullups', 'pull up'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Chin-ups', aliases: ['chin ups', 'chinups', 'chin up'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Wide-Grip Pull-ups', aliases: ['wide grip pull ups', 'wide pullups'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Close-Grip Pull-ups', aliases: ['close grip pull ups', 'close pullups'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Weighted Pull-ups', aliases: ['weighted pull ups', 'weighted pullups'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Face Pulls', aliases: ['face pulls', 'face pull'], equipment: 'Cable' },
      { name: 'Shrugs', aliases: ['shrugs', 'dumbbell shrugs', 'barbell shrugs'], equipment: 'Barbell' },
      { name: 'Barbell Shrugs', aliases: ['barbell shrugs', 'bb shrugs'], equipment: 'Barbell' },
      { name: 'Dumbbell Shrugs', aliases: ['dumbbell shrugs', 'db shrugs'], equipment: 'Dumbbell' },
      { name: 'Hyperextensions', aliases: ['hyperextensions', 'back extensions'], equipment: 'Bodyweight' },
      { name: 'Good Mornings', aliases: ['good mornings', 'good morning'], equipment: 'Barbell' },
      { name: 'Reverse Flyes', aliases: ['reverse flyes', 'rear delt flyes'], equipment: 'Dumbbell' },
      { name: 'Cable Reverse Flyes', aliases: ['cable reverse flyes', 'rear cable flyes'], equipment: 'Cable' },
      { name: 'Seated Cable Row', aliases: ['seated cable row', 'seated row machine'], equipment: 'Cable' },
      { name: 'Machine Row', aliases: ['machine row', 'rowing machine'], equipment: 'Machine' },
      { name: 'Machine Lat Pulldown', aliases: ['machine lat pulldown', 'lat pulldown machine'], equipment: 'Machine' },
      { name: 'Kettlebell Swing', aliases: ['kettlebell swing', 'kb swing'], equipment: 'Kettlebell' },
      { name: 'Kettlebell Row', aliases: ['kettlebell row', 'kb row'], equipment: 'Kettlebell' },
      { name: 'Resistance Band Rows', aliases: ['band rows', 'resistance band row'], equipment: 'Resistance Band' }
    ]
  },
  {
    id: 'legs',
    label: 'Legs',
    exercises: [
      { name: 'Squat', aliases: ['squat', 'back squat', 'barbell squat'], equipment: 'Barbell' },
      { name: 'Front Squat', aliases: ['front squat', 'front squats'], equipment: 'Barbell' },
      { name: 'Overhead Squat', aliases: ['overhead squat', 'oh squat'], equipment: 'Barbell' },
      { name: 'Goblet Squat', aliases: ['goblet squat', 'goblet squats'], equipment: 'Dumbbell' },
      { name: 'Bulgarian Split Squat', aliases: ['bulgarian split squat', 'split squat', 'bulgarian squat'], equipment: 'Dumbbell' },
      { name: 'Leg Press', aliases: ['leg press', 'leg press machine'], equipment: 'Machine' },
      { name: 'Hack Squat', aliases: ['hack squat', 'hack squats'], equipment: 'Machine' },
      { name: 'Leg Extension', aliases: ['leg extension', 'leg extensions', 'quad extension'], equipment: 'Machine' },
      { name: 'Leg Curl', aliases: ['leg curl', 'leg curls', 'hamstring curl', 'hamstring curls'], equipment: 'Machine' },
      { name: 'Lying Leg Curl', aliases: ['lying leg curl', 'lying hamstring curl'], equipment: 'Machine' },
      { name: 'Seated Leg Curl', aliases: ['seated leg curl', 'seated hamstring curl'], equipment: 'Machine' },
      { name: 'Romanian Deadlift', aliases: ['romanian deadlift', 'rdl', 'romanian deadlifts'], equipment: 'Barbell' },
      { name: 'Dumbbell RDL', aliases: ['dumbbell rdl', 'db rdl', 'dumbbell romanian deadlift'], equipment: 'Dumbbell' },
      { name: 'Lunges', aliases: ['lunges', 'lunge', 'walking lunges'], equipment: 'Dumbbell' },
      { name: 'Walking Lunges', aliases: ['walking lunges', 'walking lunge'], equipment: 'Dumbbell' },
      { name: 'Reverse Lunges', aliases: ['reverse lunges', 'reverse lunge'], equipment: 'Dumbbell' },
      { name: 'Side Lunges', aliases: ['side lunges', 'lateral lunges', 'side lunge'], equipment: 'Bodyweight' },
      { name: 'Calf Raises', aliases: ['calf raises', 'calf raise', 'standing calf raises'], equipment: 'Dumbbell' },
      { name: 'Seated Calf Raises', aliases: ['seated calf raises', 'seated calf raise'], equipment: 'Machine' },
      { name: 'Standing Calf Raises', aliases: ['standing calf raises', 'standing calf raise'], equipment: 'Machine' },
      { name: 'Barbell Calf Raises', aliases: ['barbell calf raises', 'bb calf raises'], equipment: 'Barbell' },
      { name: 'Hip Thrust', aliases: ['hip thrust', 'hip thrusts', 'glute bridge'], equipment: 'Barbell' },
      { name: 'Step-ups', aliases: ['step ups', 'step ups', 'box step ups'], equipment: 'Dumbbell' },
      { name: 'Leg Press', aliases: ['leg press'], equipment: 'Machine' },
      { name: 'Wall Sit', aliases: ['wall sit', 'wall sits'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Jump Squats', aliases: ['jump squats', 'jump squat'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Pistol Squats', aliases: ['pistol squats', 'pistol squat'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Glute Bridge', aliases: ['glute bridge', 'glute bridges'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Single-Leg Deadlift', aliases: ['single leg deadlift', 'single leg rdl'], equipment: 'Dumbbell' },
      { name: 'Stiff-Leg Deadlift', aliases: ['stiff leg deadlift', 'stiff leg dl'], equipment: 'Barbell' },
      { name: 'Kettlebell Swings', aliases: ['kettlebell swings', 'kb swings'], equipment: 'Kettlebell' },
      { name: 'Kettlebell Goblet Squat', aliases: ['kettlebell goblet squat', 'kb goblet squat'], equipment: 'Kettlebell' },
      { name: 'Resistance Band Squat', aliases: ['band squat', 'resistance band squat'], equipment: 'Resistance Band' }
    ]
  },
  {
    id: 'shoulders',
    label: 'Shoulders',
    exercises: [
      { name: 'Overhead Press', aliases: ['overhead press', 'ohp', 'barbell overhead press', 'strict press'], equipment: 'Barbell' },
      { name: 'Push Press', aliases: ['push press', 'push press'], equipment: 'Barbell' },
      { name: 'Behind the Neck Press', aliases: ['behind the neck press', 'btn press'], equipment: 'Barbell' },
      { name: 'Dumbbell Shoulder Press', aliases: ['dumbbell shoulder press', 'db shoulder press', 'dumbbell press'], equipment: 'Dumbbell' },
      { name: 'Seated Dumbbell Press', aliases: ['seated dumbbell press', 'seated db press'], equipment: 'Dumbbell' },
      { name: 'Standing Dumbbell Press', aliases: ['standing dumbbell press', 'standing db press'], equipment: 'Dumbbell' },
      { name: 'Arnold Press', aliases: ['arnold press', 'arnold presses'], equipment: 'Dumbbell' },
      { name: 'Lateral Raises', aliases: ['lateral raises', 'side raises', 'lateral raise'], equipment: 'Dumbbell' },
      { name: 'Cable Lateral Raises', aliases: ['cable lateral raises', 'cable side raises'], equipment: 'Cable' },
      { name: 'Front Raises', aliases: ['front raises', 'front raise'], equipment: 'Dumbbell' },
      { name: 'Barbell Front Raises', aliases: ['barbell front raises', 'bb front raise'], equipment: 'Barbell' },
      { name: 'Cable Front Raises', aliases: ['cable front raises'], equipment: 'Cable' },
      { name: 'Rear Delt Flyes', aliases: ['rear delt flyes', 'rear delt fly', 'rear delt raise'], equipment: 'Dumbbell' },
      { name: 'Cable Rear Delt Flyes', aliases: ['cable rear delt flyes', 'cable rear delt'], equipment: 'Cable' },
      { name: 'Bent-Over Lateral Raises', aliases: ['bent over lateral raises', 'bent over raise'], equipment: 'Dumbbell' },
      { name: 'Upright Rows', aliases: ['upright rows', 'upright row'], equipment: 'Barbell' },
      { name: 'Dumbbell Upright Rows', aliases: ['dumbbell upright rows', 'db upright row'], equipment: 'Dumbbell' },
      { name: 'Machine Shoulder Press', aliases: ['machine shoulder press', 'shoulder press machine'], equipment: 'Machine' },
      { name: 'Pike Push-ups', aliases: ['pike push ups', 'pike pushups'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Handstand Push-ups', aliases: ['handstand push ups', 'handstand pushups'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Kettlebell Press', aliases: ['kettlebell press', 'kb press'], equipment: 'Kettlebell' },
      { name: 'Resistance Band Lateral Raises', aliases: ['band lateral raises', 'resistance band raises'], equipment: 'Resistance Band' }
    ]
  },
  {
    id: 'arms',
    label: 'Arms',
    exercises: [
      // Biceps
      { name: 'Barbell Curl', aliases: ['barbell curl', 'barbell curls', 'bb curl'], equipment: 'Barbell' },
      { name: 'Dumbbell Curl', aliases: ['dumbbell curl', 'db curl', 'db curls', 'dumbbell bicep curl'], equipment: 'Dumbbell' },
      { name: 'Hammer Curl', aliases: ['hammer curl', 'hammer curls'], equipment: 'Dumbbell' },
      { name: 'Preacher Curl', aliases: ['preacher curl', 'preacher curls'], equipment: 'Barbell' },
      { name: 'Dumbbell Preacher Curl', aliases: ['dumbbell preacher curl', 'db preacher curl'], equipment: 'Dumbbell' },
      { name: 'Cable Curl', aliases: ['cable curl', 'cable curls', 'cable bicep curl'], equipment: 'Cable' },
      { name: 'Cable Hammer Curl', aliases: ['cable hammer curl', 'cable hammer curls'], equipment: 'Cable' },
      { name: 'Concentration Curl', aliases: ['concentration curl', 'concentration curls'], equipment: 'Dumbbell' },
      { name: 'Incline Dumbbell Curl', aliases: ['incline dumbbell curl', 'incline db curl'], equipment: 'Dumbbell' },
      { name: '21s', aliases: ['21s', 'barbell 21s'], equipment: 'Barbell' },
      { name: 'Spider Curl', aliases: ['spider curl', 'spider curls'], equipment: 'Barbell' },
      { name: 'Drag Curl', aliases: ['drag curl', 'drag curls'], equipment: 'Barbell' },
      // Triceps
      { name: 'Tricep Dips', aliases: ['tricep dips', 'bench dips', 'dips'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Weighted Dips', aliases: ['weighted dips', 'weighted tricep dips'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Tricep Pushdown', aliases: ['tricep pushdown', 'pushdown', 'rope pushdown', 'tricep cable pushdown'], equipment: 'Cable' },
      { name: 'Overhead Tricep Extension', aliases: ['overhead tricep extension', 'tricep extension overhead'], equipment: 'Dumbbell' },
      { name: 'Cable Overhead Extension', aliases: ['cable overhead extension', 'cable overhead tricep'], equipment: 'Cable' },
      { name: 'Skull Crushers', aliases: ['skull crushers', 'lying tricep extensions', 'lying extension'], equipment: 'Barbell' },
      { name: 'Dumbbell Skull Crushers', aliases: ['dumbbell skull crushers', 'db skull crushers'], equipment: 'Dumbbell' },
      { name: 'Close-Grip Bench Press', aliases: ['close grip bench press', 'close grip bench', 'cg bench'], equipment: 'Barbell' },
      { name: 'Diamond Push-ups', aliases: ['diamond push ups', 'diamond pushups'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Tricep Kickback', aliases: ['tricep kickback', 'tricep kickbacks'], equipment: 'Dumbbell' },
      { name: 'Cable Kickback', aliases: ['cable kickback', 'cable tricep kickback'], equipment: 'Cable' },
      { name: 'Overhead Cable Extension', aliases: ['overhead cable extension', 'cable overhead extension'], equipment: 'Cable' },
      { name: 'French Press', aliases: ['french press', 'french presses'], equipment: 'Dumbbell' },
      { name: 'Resistance Band Curl', aliases: ['band curl', 'resistance band curl'], equipment: 'Resistance Band' },
      { name: 'Resistance Band Tricep Extension', aliases: ['band tricep extension', 'resistance band extension'], equipment: 'Resistance Band' }
    ]
  },
  {
    id: 'core',
    label: 'Core',
    exercises: [
      { name: 'Planks', aliases: ['plank', 'planks', 'forearm plank'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Side Planks', aliases: ['side plank', 'side planks'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Crunches', aliases: ['crunches', 'crunch', 'ab crunch'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Bicycle Crunches', aliases: ['bicycle crunches', 'bicycle crunch'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Russian Twists', aliases: ['russian twists', 'russian twist'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Weighted Russian Twists', aliases: ['weighted russian twists', 'weighted russian twist'], equipment: 'Dumbbell' },
      { name: 'Leg Raises', aliases: ['leg raises', 'hanging leg raise', 'lying leg raises'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Hanging Leg Raises', aliases: ['hanging leg raises', 'hanging leg raise'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Cable Crunches', aliases: ['cable crunches', 'cable crunch'], equipment: 'Cable' },
      { name: 'Ab Wheel', aliases: ['ab wheel', 'ab rollout', 'ab rollouts'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Mountain Climbers', aliases: ['mountain climbers', 'mountain climber'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Dead Bug', aliases: ['dead bug', 'dead bugs'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Bird Dog', aliases: ['bird dog', 'bird dogs'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Flutter Kicks', aliases: ['flutter kicks', 'flutter kick'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'V-Ups', aliases: ['v ups', 'v ups', 'v sit ups'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Toes to Bar', aliases: ['toes to bar', 'ttb'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'L-Sit', aliases: ['l sit', 'l sits'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Hollow Body Hold', aliases: ['hollow body hold', 'hollow hold'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Woodchoppers', aliases: ['woodchoppers', 'cable woodchoppers'], equipment: 'Cable' },
      { name: 'Pallof Press', aliases: ['pallof press', 'pallof presses'], equipment: 'Cable' },
      { name: 'Kettlebell Swing', aliases: ['kettlebell swing', 'kb swing'], equipment: 'Kettlebell' },
      { name: 'Resistance Band Crunches', aliases: ['band crunches', 'resistance band crunch'], equipment: 'Resistance Band' }
    ]
  },
  {
    id: 'full-body',
    label: 'Full Body',
    exercises: [
      { name: 'Burpees', aliases: ['burpees', 'burpee'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Thrusters', aliases: ['thrusters', 'thruster'], equipment: 'Barbell' },
      { name: 'Dumbbell Thrusters', aliases: ['dumbbell thrusters', 'db thrusters'], equipment: 'Dumbbell' },
      { name: 'Kettlebell Swings', aliases: ['kettlebell swings', 'kb swings'], equipment: 'Kettlebell' },
      { name: 'Turkish Get-ups', aliases: ['turkish get ups', 'turkish getup'], equipment: 'Kettlebell' },
      { name: 'Clean and Press', aliases: ['clean and press', 'clean press'], equipment: 'Barbell' },
      { name: 'Snatch', aliases: ['snatch', 'barbell snatch'], equipment: 'Barbell' },
      { name: 'Clean', aliases: ['clean', 'barbell clean'], equipment: 'Barbell' },
      { name: 'Jerk', aliases: ['jerk', 'barbell jerk'], equipment: 'Barbell' },
      { name: 'Kettlebell Clean and Press', aliases: ['kettlebell clean and press', 'kb clean press'], equipment: 'Kettlebell' },
      { name: 'Bear Crawl', aliases: ['bear crawl', 'bear crawls'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Crab Walk', aliases: ['crab walk', 'crab walks'], bodyweight: true, equipment: 'Bodyweight' },
      { name: 'Man Makers', aliases: ['man makers', 'man maker'], equipment: 'Dumbbell' }
    ]
  }
];

// Helper function to merge custom exercises with core library
export function getMergedExerciseLibrary(customExercises = []) {
  // Group custom exercises by muscle group
  const customByGroup = {};
  customExercises.forEach((exercise) => {
    const groupId = exercise.groupId || 'full-body';
    if (!customByGroup[groupId]) {
      customByGroup[groupId] = [];
    }
    customByGroup[groupId].push({
      ...exercise,
      groupId,
      groupLabel: exercise.groupLabel || 'Custom'
    });
  });

  // Merge with core library
  return EXERCISE_LIBRARY.map((group) => {
    const customExercisesInGroup = customByGroup[group.id] || [];
    return {
      ...group,
      exercises: [...group.exercises, ...customExercisesInGroup]
    };
  }).concat(
    // Add any custom exercises in groups not in core library
    Object.keys(customByGroup)
      .filter(groupId => !EXERCISE_LIBRARY.find(g => g.id === groupId))
      .map(groupId => ({
        id: groupId,
        label: customByGroup[groupId][0].groupLabel || 'Custom',
        exercises: customByGroup[groupId]
      }))
  );
}

export const FLAT_EXERCISES = EXERCISE_LIBRARY.flatMap(({ id, label, exercises }) =>
  exercises.map((exercise) => ({ 
    ...exercise, 
    groupId: id, 
    groupLabel: label,
    equipment: exercise.equipment || 'Other',
    isCustom: false
  }))
);

// Create alias map including custom exercises
export function getExerciseAliasMap(customExercises = []) {
  const allExercises = [...FLAT_EXERCISES, ...customExercises];
  const entries = [];
  allExercises.forEach((exercise) => {
    const aliases = new Set([exercise.name, ...(exercise.aliases || [])]);
    aliases.forEach((alias) => {
      entries.push([alias.toLowerCase(), exercise.name]);
    });
  });
  return new Map(entries);
}

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

// Export function to get all exercises (core + custom)
export function getAllExercises(customExercises = []) {
  return [...FLAT_EXERCISES, ...customExercises];
}

export const EXERCISE_NAME_SET = new Set(FLAT_EXERCISES.map((exercise) => exercise.name));

export const BODYWEIGHT_EXERCISES = new Set(
  FLAT_EXERCISES.filter((exercise) => exercise.bodyweight).map((exercise) => exercise.name)
);
