// ============================================================================
// Algorithm Comparison – Greedy vs DSATUR
// ============================================================================

import type { ConflictGraph, AlgorithmComparison } from '@/types';
import { greedyColoring } from './greedy-coloring';
import { dsaturColoring } from './dsatur-coloring';

/**
 * Run both Greedy and DSATUR on the same conflict graph, compare results,
 * and recommend the better algorithm.
 */
export function compareAlgorithms(
  graph: ConflictGraph,
): AlgorithmComparison {
  const greedy = greedyColoring(graph);
  const dsatur = dsaturColoring(graph);

  let recommended: 'greedy' | 'dsatur';
  let recommendationReason: string;

  if (dsatur.numColors < greedy.numColors) {
    recommended = 'dsatur';
    recommendationReason =
      `DSATUR uses fewer time slots (${dsatur.numColors} vs ${greedy.numColors}). ` +
      `Note: both algorithms are heuristic; DSATUR is not guaranteed to find the optimal chromatic number, ` +
      `but it generally performs better on sparse or structured graphs.`;
  } else if (greedy.numColors < dsatur.numColors) {
    recommended = 'greedy';
    recommendationReason =
      `Greedy uses fewer time slots (${greedy.numColors} vs ${dsatur.numColors}). ` +
      `Note: both algorithms are heuristic and neither is guaranteed optimal. ` +
      `On this particular graph, the degree‑ordered greedy produced a better result.`;
  } else {
    // Same number of colours — pick the faster one
    if (greedy.executionTimeMs <= dsatur.executionTimeMs) {
      recommended = 'greedy';
      recommendationReason =
        `Both algorithms use ${greedy.numColors} time slot(s). ` +
        `Greedy is recommended because it ran faster ` +
        `(${greedy.executionTimeMs.toFixed(2)} ms vs ${dsatur.executionTimeMs.toFixed(2)} ms). ` +
        `Note: both are heuristic approaches and neither guarantees the optimal solution.`;
    } else {
      recommended = 'dsatur';
      recommendationReason =
        `Both algorithms use ${dsatur.numColors} time slot(s). ` +
        `DSATUR is recommended because it ran faster ` +
        `(${dsatur.executionTimeMs.toFixed(2)} ms vs ${greedy.executionTimeMs.toFixed(2)} ms). ` +
        `Note: both are heuristic approaches and neither guarantees the optimal solution.`;
    }
  }

  return { greedy, dsatur, recommended, recommendationReason };
}
