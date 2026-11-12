import { describe, it, expect } from "vitest";
import { buildConflictGraph, calculateGraphStats } from "../src/lib/algorithms/graph-construction";
import { greedyColoring } from "../src/lib/algorithms/greedy-coloring";
import { dsaturColoring } from "../src/lib/algorithms/dsatur-coloring";
import { validateColoring, validateSeating } from "../src/lib/algorithms/validation";
import { compareAlgorithms } from "../src/lib/algorithms/algorithm-comparison";
import { allocateSeating } from "../src/lib/algorithms/bin-packing";
import { Exam, Student, Enrollment, Room, TimetableAssignment } from "../src/types";

describe("Core Graph Algorithms Test Suite", () => {
  // Test Data Setup
  const sampleExams: Exam[] = [
    { id: "e1", exam_code: "CS101", subject_name: "Algorithms", department: "CSE", semester: 3, duration_minutes: 180, created_at: "", updated_at: "" },
    { id: "e2", exam_code: "CS102", subject_name: "OS", department: "CSE", semester: 3, duration_minutes: 180, created_at: "", updated_at: "" },
    { id: "e3", exam_code: "EC101", subject_name: "Signals", department: "ECE", semester: 3, duration_minutes: 180, created_at: "", updated_at: "" },
    { id: "e4", exam_code: "ME101", subject_name: "Thermo", department: "ME", semester: 3, duration_minutes: 180, created_at: "", updated_at: "" },
  ];

  const sampleStudents: Student[] = [
    { id: "s1", enrollment_number: "201", full_name: "Alice", email: "a@mail.edu", department: "CSE", semester: 3, section: "A", created_at: "", updated_at: "" },
    { id: "s2", enrollment_number: "202", full_name: "Bob", email: "b@mail.edu", department: "CSE", semester: 3, section: "A", created_at: "", updated_at: "" },
    { id: "s3", enrollment_number: "203", full_name: "Charlie", email: "c@mail.edu", department: "ECE", semester: 3, section: "A", created_at: "", updated_at: "" },
  ];

  const sampleEnrollments: Enrollment[] = [
    // Alice enrolled in e1 and e2 -> introduces conflict edge (e1, e2)
    { id: "en1", student_id: "s1", exam_id: "e1", created_at: "" },
    { id: "en1b", student_id: "s1", exam_id: "e2", created_at: "" },
    // Bob enrolled in e2 and e3 -> introduces conflict edge (e2, e3)
    { id: "en2", student_id: "s2", exam_id: "e2", created_at: "" },
    { id: "en2b", student_id: "s2", exam_id: "e3", created_at: "" },
    // Charlie enrolled only in e4 -> isolated vertex!
    { id: "en3", student_id: "s3", exam_id: "e4", created_at: "" },
  ];

  describe("1. Graph Construction Algorithm", () => {
    it("should construct vertices for all examinations", () => {
      const graph = buildConflictGraph(sampleExams, sampleEnrollments);
      expect(graph.vertices.length).toBe(4);
      expect(graph.vertices).toContain("e1");
      expect(graph.vertices).toContain("e2");
      expect(graph.vertices).toContain("e3");
      expect(graph.vertices).toContain("e4");
    });

    it("should create edges only between conflicting examinations", () => {
      const graph = buildConflictGraph(sampleExams, sampleEnrollments);
      expect(graph.edges.length).toBe(2);

      // (e1, e2) conflict via Alice
      const e1Neighbors = graph.adjacencyList.get("e1");
      expect(e1Neighbors?.has("e2")).toBe(true);
      expect(e1Neighbors?.has("e3")).toBe(false);

      // (e2, e3) conflict via Bob
      const e2Neighbors = graph.adjacencyList.get("e2");
      expect(e2Neighbors?.has("e1")).toBe(true);
      expect(e2Neighbors?.has("e3")).toBe(true);

      // e4 is isolated
      const e4Neighbors = graph.adjacencyList.get("e4");
      expect(e4Neighbors?.size).toBe(0);
    });

    it("should calculate accurate topological graph statistics", () => {
      const graph = buildConflictGraph(sampleExams, sampleEnrollments);
      const stats = calculateGraphStats(graph);

      expect(stats.totalVertices).toBe(4);
      expect(stats.totalEdges).toBe(2);
      expect(stats.maxDegree).toBe(2); // e2 has degree 2
      expect(stats.isolatedVertices).toBe(1); // e4 has degree 0
    });
  });

  describe("2. Greedy Graph Coloring Algorithm", () => {
    it("should produce a valid, conflict-free coloring", () => {
      const graph = buildConflictGraph(sampleExams, sampleEnrollments);
      const result = greedyColoring(graph);

      expect(result.isValid).toBe(true);
      expect(result.numColors).toBeGreaterThan(0);

      // Adjacent vertices must not share the same color
      expect(result.coloring["e1"]).not.toBe(result.coloring["e2"]);
      expect(result.coloring["e2"]).not.toBe(result.coloring["e3"]);

      // Verify with formal validation
      const validation = validateColoring(graph, result.coloring);
      expect(validation.isValid).toBe(true);
      expect(validation.conflicts.length).toBe(0);
    });
  });

  describe("3. DSATUR Graph Coloring Algorithm", () => {
    it("should color the graph dynamically respecting saturation degree", () => {
      const graph = buildConflictGraph(sampleExams, sampleEnrollments);
      const result = dsaturColoring(graph);

      expect(result.isValid).toBe(true);
      expect(result.numColors).toBeGreaterThan(0);
      expect(result.coloring["e1"]).not.toBe(result.coloring["e2"]);
      expect(result.coloring["e2"]).not.toBe(result.coloring["e3"]);

      const validation = validateColoring(graph, result.coloring);
      expect(validation.isValid).toBe(true);
      expect(validation.conflicts.length).toBe(0);
    });
  });

  describe("4. Algorithm Comparison & Heuristic Evaluation", () => {
    it("should run both Greedy and DSATUR and provide an automated recommendation", () => {
      const graph = buildConflictGraph(sampleExams, sampleEnrollments);
      const comparison = compareAlgorithms(graph);

      expect(comparison.greedy.isValid).toBe(true);
      expect(comparison.dsatur.isValid).toBe(true);
      expect(["greedy", "dsatur"]).toContain(comparison.recommended);
      expect(comparison.recommendationReason).toBeDefined();
    });
  });

  describe("5. Bin Packing Room Allocation (FFD)", () => {
    const sampleRooms: Room[] = [
      { id: "r1", room_name: "Room 101", building: "Main", floor: 1, capacity: 2, room_type: "lecture_hall", is_available: true, created_at: "", updated_at: "" },
      { id: "r2", room_name: "Room 102", building: "Main", floor: 1, capacity: 5, room_type: "lecture_hall", is_available: true, created_at: "", updated_at: "" },
    ];

    it("should allocate students without exceeding room capacities or duplicating seats", () => {
      const assignments: TimetableAssignment[] = [
        { id: "a1", timetable_id: "t1", exam_id: "e1", time_slot: 0 },
        { id: "a2", timetable_id: "t1", exam_id: "e3", time_slot: 0 },
      ];

      const seating = allocateSeating(
        "t1",
        assignments,
        sampleEnrollments,
        sampleRooms,
        sampleExams,
        sampleStudents
      );

      expect(seating.isComplete).toBe(true);
      expect(seating.errors.length).toBe(0);

      // Check slot allocation
      const slot0 = seating.slotAllocations.find((s) => s.timeSlot === 0);
      expect(slot0).toBeDefined();

      // No room should exceed maximum capacity
      slot0?.rooms.forEach((r) => {
        expect(r.occupiedSeats).toBeLessThanOrEqual(r.room.capacity);
      });
    });

    it("should report capacity error if students exceed total available hall seats", () => {
      const tinyRooms: Room[] = [
        { id: "r_tiny", room_name: "Micro Room", building: "Main", floor: 1, capacity: 1, room_type: "lecture_hall", is_available: true, created_at: "", updated_at: "" },
      ];

      // e1 has Alice (1 student), e3 has Bob (1 student) -> 2 students needed in Slot 0, but tiny room capacity is 1
      const assignments: TimetableAssignment[] = [
        { id: "a1", timetable_id: "t1", exam_id: "e1", time_slot: 0 },
        { id: "a2", timetable_id: "t1", exam_id: "e3", time_slot: 0 },
      ];

      const seating = allocateSeating(
        "t1",
        assignments,
        sampleEnrollments,
        tinyRooms,
        sampleExams,
        sampleStudents
      );

      expect(seating.isComplete).toBe(false);
      expect(seating.errors.length).toBeGreaterThan(0);
    });
  });
});

