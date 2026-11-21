// Twin Hunt — shared constants: layout, timing and scoring rules.
export const PANEL = { w: 560, h: 400, leftX: 40, rightX: 680, y: 20 };
export const CANVAS = { w: 1280, h: 440 };
export const LEVEL_TIME_SECONDS = 150;
export const HINTS_PER_LEVEL = 3;
export const POINTS_PER_FIND = 100;
export const COMBO_STEP_BONUS = 25;
export const COMBO_WINDOW_MS = 10000;
export const WRONG_CLICK_PENALTY_SECONDS = 5;
export const HINT_COST = 50;
export const TIME_BONUS_PER_SECOND = 5;

export const LEVELS = [
  { id: 'harbour', name: 'Sunrise Harbour', diffs: 7 },
  { id: 'cafe', name: 'The Cat Café', diffs: 7 },
  { id: 'garden', name: 'Firefly Garden', diffs: 7 },
];

export function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function starsForLevel(secondsLeft, wrongClicks) {
  if (secondsLeft >= 60 && wrongClicks === 0) return 3;
  if (secondsLeft >= 25 && wrongClicks <= 2) return 2;
  return 1;
}
