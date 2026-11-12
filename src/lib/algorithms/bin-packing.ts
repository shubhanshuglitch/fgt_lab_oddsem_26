// ============================================================================
// Bin‑Packing – First‑Fit Decreasing Room Allocation
// ============================================================================

import type {
  TimetableAssignment,
  Enrollment,
  Room,
  Exam,
  Student,
  SeatingAllocation,
  RoomAllocation,
  SlotAllocation,
  SeatingResult,
} from '@/types';
import { generateId } from '@/lib/utils';

/**
 * Allocate students to rooms for every time slot using First‑Fit Decreasing
 * bin packing.
 *
 * For each slot:
 *   1. Identify exams scheduled in that slot.
 *   2. Collect unique students for those exams.
 *   3. Sort available rooms by capacity descending (FFD).
 *   4. Group students by exam.
 *   5. Assign exam groups to rooms, preferring unsplit placement.
 *   6. If a group cannot fit whole, split it across rooms.
 *   7. Assign sequential seat numbers within each room.
 */
export function allocateSeating(
  timetableId: string,
  assignments: TimetableAssignment[],
  enrollments: Enrollment[],
  rooms: Room[],
  exams: Exam[],
  students: Student[],
): SeatingResult {
  const errors: string[] = [];

  // Lookups
  const examLookup = new Map<string, Exam>();
  for (const exam of exams) examLookup.set(exam.id, exam);

  const studentLookup = new Map<string, Student>();
  for (const s of students) studentLookup.set(s.id, s);

  // Map exam_id → set of student IDs
  const examStudents = new Map<string, Set<string>>();
  for (const enr of enrollments) {
    let set = examStudents.get(enr.exam_id);
    if (!set) {
      set = new Set<string>();
      examStudents.set(enr.exam_id, set);
    }
    set.add(enr.student_id);
  }

  // Group assignments by time slot
  const slotMap = new Map<number, TimetableAssignment[]>();
  for (const a of assignments) {
    let list = slotMap.get(a.time_slot);
    if (!list) {
      list = [];
      slotMap.set(a.time_slot, list);
    }
    list.push(a);
  }

  // Available rooms sorted by capacity descending (FFD order)
  const sortedRooms = rooms
    .filter((r) => r.is_available)
    .sort((a, b) => b.capacity - a.capacity);

  const slotAllocations: SlotAllocation[] = [];
  let grandTotalSeats = 0;
  let grandTotalCapacity = 0;

  const sortedSlots = Array.from(slotMap.keys()).sort((a, b) => a - b);

  for (const slot of sortedSlots) {
    const slotAssignments = slotMap.get(slot)!;
    const slotExamIds = slotAssignments.map((a) => a.exam_id);

    // Collect unique students for this slot, grouped by exam
    const examGroups: { examId: string; studentIds: string[] }[] = [];
    const slotStudentIds = new Set<string>();

    for (const examId of slotExamIds) {
      const sids = examStudents.get(examId);
      if (sids) {
        const arr = Array.from(sids).sort(); // deterministic order
        examGroups.push({ examId, studentIds: arr });
        for (const s of arr) slotStudentIds.add(s);
      } else {
        examGroups.push({ examId, studentIds: [] });
      }
    }

    // Sort exam groups by size descending (FFD)
    examGroups.sort((a, b) => b.studentIds.length - a.studentIds.length);

    // Track remaining capacity per room for this slot
    const roomRemaining = new Map<string, number>();
    const roomAllocations = new Map<string, SeatingAllocation[]>();
    const roomExamGroups = new Map<
      string,
      { exam: Exam; students: Student[]; startSeat: number; endSeat: number }[]
    >();
    const roomSeatCounter = new Map<string, number>(); // next seat in room

    for (const room of sortedRooms) {
      roomRemaining.set(room.id, room.capacity);
      roomAllocations.set(room.id, []);
      roomExamGroups.set(room.id, []);
      roomSeatCounter.set(room.id, 1);
    }

    // Track which rooms already host exams (for "prefer unshared" heuristic)
    const roomExamSet = new Map<string, Set<string>>();
    for (const room of sortedRooms) {
      roomExamSet.set(room.id, new Set<string>());
    }

    let unallocatedStudents = 0;

    for (const group of examGroups) {
      let remaining = [...group.studentIds];

      while (remaining.length > 0) {
        // Prefer a room that hasn't been assigned another exam yet
        let targetRoom: Room | undefined;

        // First pass: rooms with no other exam AND enough capacity for the whole group
        for (const room of sortedRooms) {
          const cap = roomRemaining.get(room.id)!;
          const examsInRoom = roomExamSet.get(room.id)!;
          if (cap >= remaining.length && examsInRoom.size === 0) {
            targetRoom = room;
            break;
          }
        }

        // Second pass: any room with enough capacity for the whole group
        if (!targetRoom) {
          for (const room of sortedRooms) {
            if (roomRemaining.get(room.id)! >= remaining.length) {
              targetRoom = room;
              break;
            }
          }
        }

        // Third pass: room with the most remaining capacity (split)
        if (!targetRoom) {
          let maxCap = 0;
          for (const room of sortedRooms) {
            const cap = roomRemaining.get(room.id)!;
            if (cap > maxCap) {
              maxCap = cap;
              targetRoom = room;
            }
          }
        }

        if (!targetRoom || roomRemaining.get(targetRoom.id)! <= 0) {
          // Truly no capacity left
          unallocatedStudents += remaining.length;
          errors.push(
            `Slot ${slot + 1}: insufficient room capacity for exam ${examLookup.get(group.examId)?.exam_code ?? group.examId}. ` +
              `${remaining.length} student(s) could not be allocated.`,
          );
          break;
        }

        const cap = roomRemaining.get(targetRoom.id)!;
        const batch = remaining.splice(0, cap);
        const startSeat = roomSeatCounter.get(targetRoom.id)!;

        const batchAllocations: SeatingAllocation[] = batch.map(
          (studentId, idx) => ({
            id: generateId(),
            timetable_id: timetableId,
            time_slot: slot,
            exam_id: group.examId,
            room_id: targetRoom!.id,
            student_id: studentId,
            seat_number: startSeat + idx,
          }),
        );

        roomAllocations.get(targetRoom.id)!.push(...batchAllocations);
        roomSeatCounter.set(targetRoom.id, startSeat + batch.length);
        roomRemaining.set(targetRoom.id, cap - batch.length);
        roomExamSet.get(targetRoom.id)!.add(group.examId);

        const batchStudents = batch
          .map((sid) => studentLookup.get(sid))
          .filter((s): s is Student => s !== undefined);

        roomExamGroups.get(targetRoom.id)!.push({
          exam: examLookup.get(group.examId)!,
          students: batchStudents,
          startSeat,
          endSeat: startSeat + batch.length - 1,
        });
      }
    }

    // Build RoomAllocation objects for rooms that were used
    const slotRoomAllocations: RoomAllocation[] = [];
    for (const room of sortedRooms) {
      const allocs = roomAllocations.get(room.id)!;
      if (allocs.length === 0) continue;

      const occupiedSeats = allocs.length;
      const remainingCap = roomRemaining.get(room.id)!;
      const utilizationPercent =
        room.capacity > 0 ? (occupiedSeats / room.capacity) * 100 : 0;

      slotRoomAllocations.push({
        room,
        allocations: allocs,
        examGroups: roomExamGroups.get(room.id)!,
        occupiedSeats,
        remainingCapacity: remainingCap,
        utilizationPercent,
      });
    }

    const totalStudents = slotStudentIds.size;
    const totalSeatsUsed = slotRoomAllocations.reduce(
      (sum, ra) => sum + ra.occupiedSeats,
      0,
    );

    const slotCapacity = slotRoomAllocations.reduce(
      (sum, ra) => sum + ra.room.capacity,
      0,
    );

    slotAllocations.push({
      timeSlot: slot,
      exams: slotExamIds
        .map((eid) => examLookup.get(eid))
        .filter((e): e is Exam => e !== undefined),
      rooms: slotRoomAllocations,
      totalStudents,
      totalSeatsUsed,
      unallocatedStudents,
    });

    grandTotalSeats += totalSeatsUsed;
    grandTotalCapacity += slotCapacity;
  }

  const totalCapacity = sortedRooms.reduce((s, r) => s + r.capacity, 0);
  const overallUtilization =
    grandTotalCapacity > 0 ? (grandTotalSeats / grandTotalCapacity) * 100 : 0;

  const isComplete =
    errors.length === 0 &&
    slotAllocations.every((sa) => sa.unallocatedStudents === 0);

  return {
    slotAllocations,
    totalSeatsUsed: grandTotalSeats,
    totalCapacity,
    overallUtilization,
    errors,
    isComplete,
  };
}
