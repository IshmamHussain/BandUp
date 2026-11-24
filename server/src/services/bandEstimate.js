// Band estimate (report defect B3 / faculty item 4).
//
// The old estimate was simply the band of the LATEST result in any module,
// so one 5-question passage could move it by several bands. Now:
//   1. Per module, take the most recent RECENT_RESULTS_PER_MODULE results
//      and compute a weighted mean:
//        - reading / listening: weighted by number of questions (a 40-question
//          test counts 8x a 5-question one; capped at 40),
//        - writing: Task 2 counts double, as in the real IELTS Writing score,
//        - speaking: every test counts equally.
//   2. The overall band is the mean of the module bands that have results,
//      rounded the IELTS way (to the nearest half band, .25 and .75 round up).
// Pure functions only, so they are easy to test and reuse.

export const RECENT_RESULTS_PER_MODULE = 5;
export const MODULES = ['reading', 'listening', 'writing', 'speaking'];

/** IELTS rounding: 6.25 -> 6.5, 6.75 -> 7.0, 6.1 -> 6.0. */
export function roundToHalfBand(value) {
  // The epsilon keeps 6.25 (which can be 6.2499999 in floating point) rounding up.
  return Math.round(value * 2 + 1e-9) / 2;
}

/** Weight of one result within its module. */
export function resultWeight(module, result) {
  if (module === 'reading' || module === 'listening') {
    return Math.min(Math.max(Number(result.total) || 0, 1), 40);
  }
  if (module === 'writing') return result.taskType === 'task2' ? 2 : 1;
  return 1;
}

/**
 * Band for one module from its results (newest first).
 * @param {string} module
 * @param {{ band: number, total?: number, taskType?: string }[]} results
 * @returns {{ band: number | null, count: number }}
 */
export function moduleBand(module, results) {
  const recent = results
    .filter((r) => Number.isFinite(Number(r.band)))
    .slice(0, RECENT_RESULTS_PER_MODULE);
  if (recent.length === 0) return { band: null, count: 0 };

  let weighted = 0;
  let weights = 0;
  for (const r of recent) {
    const w = resultWeight(module, r);
    weighted += Number(r.band) * w;
    weights += w;
  }
  return { band: roundToHalfBand(weighted / weights), count: recent.length };
}

/**
 * Full estimate from each module's recent results (newest first).
 * @param {Record<string, object[]>} resultsByModule
 * @returns {{ overall: number | null, modules: Record<string, { band: number | null, count: number }>, modulesCounted: number }}
 */
export function estimateBand(resultsByModule) {
  const modules = {};
  for (const m of MODULES) modules[m] = moduleBand(m, resultsByModule[m] || []);

  const bands = MODULES.map((m) => modules[m].band).filter((b) => b !== null);
  const overall = bands.length ? roundToHalfBand(bands.reduce((a, b) => a + b, 0) / bands.length) : null;
  return { overall, modules, modulesCounted: bands.length };
}
