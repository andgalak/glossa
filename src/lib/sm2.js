/**
 * SM-2 spaced repetition algorithm.
 *
 * Rating scale:
 *   1 = Hard   (struggled)
 *   3 = Medium (some effort)
 *   4 = Easy   (recalled well)
 *   5 = Too Easy — retire the card (interval set to 9999, retired: true)
 *
 * Returns updated { interval, ease_factor, repetitions, due_date, retired }.
 */
export function sm2(card, rating) {
  if (rating === 5) {
    const far = new Date();
    far.setDate(far.getDate() + 9999);
    return {
      interval: 9999,
      ease_factor: card.ease_factor,
      repetitions: card.repetitions,
      due_date: far.toISOString(),
      retired: true,
    };
  }

  let { interval, ease_factor: ef, repetitions } = card;

  if (rating === 1) {
    // Hard — reset to relearn
    repetitions = 0;
    interval = 1;
  } else {
    // Medium (3) or Easy (4)
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ef);
    }
    repetitions += 1;
  }

  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)), clamped to min 1.3
  ef = Math.max(1.3, ef + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    interval,
    ease_factor: ef,
    repetitions,
    due_date: dueDate.toISOString(),
    retired: false,
  };
}

/**
 * Weighted random selection from an array of cards.
 * Weight = 1 / ease_factor — lower EF (harder card) → higher weight → picked more often.
 * Retired cards are excluded.
 */
export function weightedPick(cards) {
  const pool = cards.filter(c => !c.retired);
  if (pool.length === 0) return null;
  const weights = pool.map(c => 1 / (c.ease_factor ?? 2.5));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
