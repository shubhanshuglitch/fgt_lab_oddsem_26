// ============================================================================
// Validation – Coloring & Seating
// ============================================================================

import type { ConflictGraph, SeatingAllocation, Room } from '@/types';

/**
 * Validate a graph coloring: no two adjacent vertices may share a colour.
 */
export function validateColoring(
  graph: ConflictGraph,
  coloring: Record<string, number>,
): {
  isValid: boolean;
  conflicts: { exam1: string; exam2: string; color: number }[];
} {
  const conflicts: { exam1: string; exam2: string; color: number }[] = [];

  for (const edge of graph.edges) {
    const c1 = coloring[edge.exam1_id];
    const c2 = coloring[edge.exam2_id];
    if (c1 !== undefined && c2 !== undefined && c1 === c2) {
      conflicts.push({
        exam1: edge.exam1_id,
        exam2: edge.exam2_id,
        color: c1,
      });
    }
  }

  return { isValid: conflicts.length === 0, conflicts };
}

/**
 * Validate a set of seating allocations against room constraints.
 *
 * Checks:
 * 1. No room exceeds its capacity in any time slot.
 * 2. No student is allocated multiple seats in the same time slot.
 * 3. Every allocation references a valid room.
 */
export function validateSeating(
  allocations: SeatingAllocation[],
  rooms: Room[],
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const roomLookup = new Map<string, Room>();
  for (const room of rooms) {
    roomLookup.set(room.id, room);
  }

  // ---- Check 3: every allocation has a valid room ----
  for (const alloc of allocations) {
    if (!roomLookup.has(alloc.room_id)) {
      errors.push(
        `Allocation ${alloc.id}: room ${alloc.room_id} does not exist.`,
      );
    }
  }

  // Group allocations by (time_slot, room_id)
  const slotRoomMap = new Map<string, SeatingAllocation[]>();
  for (const alloc of allocations) {
    const key = `${alloc.time_slot}_${alloc.room_id}`;
    let list = slotRoomMap.get(key);
    if (!list) {
      list = [];
      slotRoomMap.set(key, list);
    }
    list.push(alloc);
  }

  // ---- Check 1: capacity ----
  for (const [key, allocs] of slotRoomMap.entries()) {
    const [slotStr, roomId] = key.split('_');
    const room = roomLookup.get(roomId);
    if (room && allocs.length > room.capacity) {
      errors.push(
        `Room ${room.room_name} in slot ${Number(slotStr) + 1} has ${allocs.length} students but capacity is ${room.capacity}.`,
      );
    }
  }

  // ---- Check 2: student uniqueness per slot ----
  const slotStudentMap = new Map<number, Map<string, string[]>>(); // slot → studentId → alloc ids
  for (const alloc of allocations) {
    let studentMap = slotStudentMap.get(alloc.time_slot);
    if (!studentMap) {
      studentMap = new Map();
      slotStudentMap.set(alloc.time_slot, studentMap);
    }
    let ids = studentMap.get(alloc.student_id);
    if (!ids) {
      ids = [];
      studentMap.set(alloc.student_id, ids);
    }
    ids.push(alloc.id);
  }

  for (const [slot, studentMap] of slotStudentMap.entries()) {
    for (const [studentId, allocIds] of studentMap.entries()) {
      if (allocIds.length > 1) {
        errors.push(
          `Student ${studentId} has ${allocIds.length} seats in slot ${slot + 1}.`,
        );
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}
