// ============================================================================
// Greedy Graph Coloring
// ============================================================================

import type { ConflictGraph, ColoringResult } from '@/types';
import { validateColoring } from './validation';

/**
 * Standard Greedy graph‐coloring algorithm.
 *
 * Vertices are processed in **decreasing degree** order (ties broken by
 * exam‐ID lexicographic order for determinism). Each vertex is assigned the
 * smallest colour not already used by any of its neighbours.
 */
export function greedyColoring(graph: ConflictGraph): ColoringResult {
  const start = performance.now();

  // Sort vertices by decreasing degree; ties broken by exam ID ascending
  const vertexOrder = [...graph.vertices].sort((a, b) => {
    const degA = graph.adjacencyList.get(a)?.size ?? 0;
    const degB = graph.adjacencyList.get(b)?.size ?? 0;
    if (degB !== degA) return degB - degA; // higher degree first
    return a.localeCompare(b); // lexicographic tie‑break
  });

  const coloring: Record<string, number> = {};

  for (const vertex of vertexOrder) {
    // Gather colours used by already‑coloured neighbours
    const usedColors = new Set<number>();
    const neighbors = graph.adjacencyList.get(vertex);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (coloring[neighbor] !== undefined) {
          usedColors.add(coloring[neighbor]);
        }
      }
    }

    // Find the smallest non‑negative integer not in usedColors
    let color = 0;
    while (usedColors.has(color)) {
      color++;
    }
    coloring[vertex] = color;
  }

  const numColors =
    Object.keys(coloring).length > 0
      ? Math.max(...Object.values(coloring)) + 1
      : 0;

  const executionTimeMs = performance.now() - start;

  const { isValid } = validateColoring(graph, coloring);

  return {
    coloring,
    numColors,
    executionTimeMs,
    algorithm: 'greedy',
    isValid,
    vertexOrder,
  };
}
