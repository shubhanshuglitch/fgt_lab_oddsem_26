// ============================================================================
// DSATUR (Degree of Saturation) Coloring – Brélaz's Algorithm
// ============================================================================

import type { ConflictGraph, ColoringResult } from '@/types';
import { validateColoring } from './validation';

/**
 * DSATUR graph‑coloring algorithm.
 *
 * At each step the uncoloured vertex with the **highest saturation degree**
 * (number of distinct colours among its already‑coloured neighbours) is
 * chosen.  Ties are broken by:
 *   1. highest original (uncoloured) degree, then
 *   2. lexicographic exam‑ID order.
 *
 * The selected vertex is assigned the smallest colour not used by any of
 * its neighbours.
 */
export function dsaturColoring(graph: ConflictGraph): ColoringResult {
  const start = performance.now();

  const n = graph.vertices.length;
  const coloring: Record<string, number> = {};
  const vertexOrder: string[] = [];

  // Pre‑compute degrees
  const degree: Record<string, number> = {};
  for (const v of graph.vertices) {
    degree[v] = graph.adjacencyList.get(v)?.size ?? 0;
  }

  // Saturation degree: count of distinct colours among coloured neighbours.
  // We maintain a set of neighbour‑colours per vertex for O(1) lookup.
  const neighborColors = new Map<string, Set<number>>();
  for (const v of graph.vertices) {
    neighborColors.set(v, new Set<number>());
  }

  const uncolored = new Set<string>(graph.vertices);

  for (let i = 0; i < n; i++) {
    // Pick the uncoloured vertex with the highest saturation degree
    let bestVertex: string | null = null;
    let bestSat = -1;
    let bestDeg = -1;

    for (const v of uncolored) {
      const sat = neighborColors.get(v)!.size;
      const deg = degree[v];

      if (
        sat > bestSat ||
        (sat === bestSat && deg > bestDeg) ||
        (sat === bestSat && deg === bestDeg && (bestVertex === null || v.localeCompare(bestVertex) < 0))
      ) {
        bestVertex = v;
        bestSat = sat;
        bestDeg = deg;
      }
    }

    const vertex = bestVertex!;
    vertexOrder.push(vertex);

    // Find the smallest colour not used by any neighbour
    const usedColors = neighborColors.get(vertex)!;
    let color = 0;
    while (usedColors.has(color)) {
      color++;
    }
    coloring[vertex] = color;
    uncolored.delete(vertex);

    // Update saturation data for uncoloured neighbours
    const neighbors = graph.adjacencyList.get(vertex);
    if (neighbors) {
      for (const nb of neighbors) {
        if (uncolored.has(nb)) {
          neighborColors.get(nb)!.add(color);
        }
      }
    }
  }

  const numColors =
    Object.keys(coloring).length > 0
      ? Math.max(...Object.values(coloring)) + 1
      : 0;

  const executionTimeMs = performance.now() - start;

  // Build final saturation degrees snapshot
  const saturationDegrees: Record<string, number> = {};
  for (const v of graph.vertices) {
    saturationDegrees[v] = neighborColors.get(v)!.size;
  }

  const { isValid } = validateColoring(graph, coloring);

  return {
    coloring,
    numColors,
    executionTimeMs,
    algorithm: 'dsatur',
    isValid,
    vertexOrder,
    saturationDegrees,
  };
}
