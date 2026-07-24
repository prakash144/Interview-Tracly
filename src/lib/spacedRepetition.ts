export interface Sm2State {
  easinessFactor: number;
  repetitions: number;
  interval: number;
  nextReviewAt: number | null;
}

export function createSm2State(): Sm2State {
  return { easinessFactor: 2.5, repetitions: 0, interval: 0, nextReviewAt: null };
}

export function scheduleFirstReview(): Sm2State {
  const next = Date.now() + 86400000;
  return { easinessFactor: 2.5, repetitions: 0, interval: 1, nextReviewAt: next };
}

export function computeNextReview(state: Sm2State, quality: number): Sm2State {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let { easinessFactor, repetitions, interval } = state;

  if (q < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easinessFactor);
    repetitions += 1;
  }

  easinessFactor = easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easinessFactor < 1.3) easinessFactor = 1.3;

  return {
    easinessFactor,
    repetitions,
    interval,
    nextReviewAt: Date.now() + interval * 86400000,
  };
}
