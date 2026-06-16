/**
 * Cubic Bezier Math Utilities
 */

// Helper to calculate a coordinate on the cubic bezier curve for parameter t
export function getBezierCoord(t, p1, p2) {
  // P0 = 0, P3 = 1
  const mt = 1 - t;
  return 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t;
}

// Helper to calculate derivative of coordinate with respect to t
export function getBezierDerivative(t, p1, p2) {
  const mt = 1 - t;
  return 3 * mt * mt * p1 + 6 * mt * t * (p2 - p1) + 3 * t * t * (1 - p2);
}

// Second derivative d2/dt2 for cubic bezier (P0=0, P3=1)
export function getBezierSecondDerivative(t, p1, p2) {
  // Formula: B''(t) = 6(1-t)(P2 - 2P1 + P0) + 6t(P3 - 2P2 + P1)
  // with P0 = 0, P3 = 1
  const mt = 1 - t;
  const term1 = 6 * mt * (p2 - 2 * p1 + 0);
  const term2 = 6 * t * (1 - 2 * p2 + p1);
  return term1 + term2;
}

/**
 * Solves for parameter t given x coordinate.
 * Uses Newton-Raphson with binary search fallback.
 */
export function solveT(x, p1x, p2x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  let t = x; // initial guess
  
  // Try Newton-Raphson iteration
  for (let i = 0; i < 12; i++) {
    const xVal = getBezierCoord(t, p1x, p2x) - x;
    if (Math.abs(xVal) < 1e-7) {
      return t;
    }
    const dx = getBezierDerivative(t, p1x, p2x);
    if (Math.abs(dx) < 1e-7) {
      break;
    }
    t -= xVal / dx;
  }

  // Fallback to Binary Search if Newton-Raphson didn't converge or failed
  let low = 0;
  let high = 1;
  t = x;

  for (let i = 0; i < 20; i++) {
    const xVal = getBezierCoord(t, p1x, p2x);
    if (Math.abs(xVal - x) < 1e-6) {
      return t;
    }
    if (xVal > x) {
      high = t;
    } else {
      low = t;
    }
    t = (low + high) / 2;
  }

  return t;
}

/**
 * Get position y for time x
 */
export function getBezierY(x, p1x, p1y, p2x, p2y) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const t = solveT(x, p1x, p2x);
  return getBezierCoord(t, p1y, p2y);
}

/**
 * Get rate of change dy/dx (velocity) at time x
 */
export function getBezierVelocity(x, p1x, p1y, p2x, p2y) {
  const t = solveT(x, p1x, p2x);
  const dx = getBezierDerivative(t, p1x, p2x);
  const dy = getBezierDerivative(t, p1y, p2y);
  
  if (Math.abs(dx) < 1e-5) {
    // Avoid division by zero, clamp velocity
    return dy > 0 ? 10 : -10;
  }
  return dy / dx;
}

/**
 * Samples position and velocity curves for plotting (0 to 1)
 */
export function sampleBezierCurve(p1x, p1y, p2x, p2y, samplesCount = 100) {
  const points = [];
  for (let i = 0; i <= samplesCount; i++) {
    const x = i / samplesCount;
    // For sampling the curve across time we solve t for the x coordinate then compute y
    const t = solveT(x, p1x, p2x);
    const y = getBezierCoord(t, p1y, p2y);
    const dy_dt = getBezierDerivative(t, p1y, p2y);
  const dx_dt = getBezierDerivative(t, p1x, p2x);
    // velocity relative to time x (dy/dx) - keep previous helper for backwards compatibility
    const velocity = getBezierVelocity(x, p1x, p1y, p2x, p2y);
    // acceleration as second derivative wrt t (d2y/dt2)
    const acc = getBezierSecondDerivative(t, p1y, p2y);
    points.push({ x, y, velocity, t, dy_dt, acc });
  }
  return points;
}
