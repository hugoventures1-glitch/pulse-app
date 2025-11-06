// Extremely simple parser for gym phrases
// Examples:
//  - "bench press 185 for 8"
//  - "set three complete"
//  - "weight one eighty five, reps eight"

const numberWords = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

function wordNumberToInt(words) {
  if (words == null) return undefined;
  const tokens = String(words).toLowerCase().split(/\s+/);
  let total = 0;
  for (const t of tokens) {
    if (/^\d+$/.test(t)) return parseInt(t, 10);
    if (numberWords[t] != null) total += numberWords[t];
  }
  return total || undefined;
}

export function parseCommand(text) {
  if (!text) return {};
  const s = text.toLowerCase().replace(/[,\.]/g, ' ');

  // reps pattern: "for 8 reps" or "reps 8"
  let reps;
  let m = s.match(/(?:reps?\s*)(\w+)|for\s+(\w+)\s+reps?/);
  if (m) reps = wordNumberToInt(m[1] || m[2]);

  // weight pattern: "weight 185" or "one eighty five" followed by lbs/kilos is optional
  let weight;
  m = s.match(/weight\s+(\w+(?:\s+\w+){0,2})|(?:at|do|with)\s+(\d{2,3})/);
  if (m) weight = wordNumberToInt(m[1] || m[2]);
  if (!weight) {
    m = s.match(/(\d{2,3})\s*(?:lbs?|pounds?|kg|kilos?)/);
    if (m) weight = parseInt(m[1], 10);
  }

  // set complete pattern: "set 3 complete", "set three done"
  let setsDone;
  m = s.match(/set\s+(\w+)\s+(?:done|complete|completed|finished)/);
  if (m) setsDone = wordNumberToInt(m[1]);

  return { reps, weight, setsDone };
}


