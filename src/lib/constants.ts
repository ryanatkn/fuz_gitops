/**
 * Maximum number of iterations for fixed-point iteration during publishing.
 * Used in both plan generation and actual publishing to resolve transitive dependency cascades.
 *
 * In practice, most repos converge in 2-3 iterations.
 * Deep dependency chains may require more iterations.
 */
export const MAX_ITERATIONS = 10;
