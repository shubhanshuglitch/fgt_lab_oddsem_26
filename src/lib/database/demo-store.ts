// ============================================================================
// ExamGraph - In-Memory Demo Data Store
// Singleton pattern using module-level variables (server-side)
// ============================================================================

import {
  Student,
  Exam,
  Enrollment,
  Room,
  Timetable,
  TimetableAssignment,
  SeatingAllocation,
  AlgorithmRun,
} from '@/types';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Module-level storage (singleton – persists across requests in dev server)
// ---------------------------------------------------------------------------

let students: Student[] = [];
let exams: Exam[] = [];
let enrollments: Enrollment[] = [];
let rooms: Room[] = [];
let timetables: Timetable[] = [];
let timetableAssignments: TimetableAssignment[] = [];
let seatingAllocations: SeatingAllocation[] = [];
let algorithmRuns: AlgorithmRun[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

/**
 * Mark every timetable as not current and not valid.
 * Called whenever underlying data (students / exams / enrollments) changes.
 */
export function invalidateTimetables(): void {
  for (const t of timetables) {
    t.is_current = false;
    t.is_valid = false;
  }
}

/** Check whether the store has any data loaded. */
export function hasData(): boolean {
  return students.length > 0;
}

/** Reset everything. */
export function clearAll(): void {
  students = [];
  exams = [];
  enrollments = [];
  rooms = [];
  timetables = [];
  timetableAssignments = [];
  seatingAllocations = [];
  algorithmRuns = [];
}

// ============================================================================
// STUDENTS
// ============================================================================

export function getAllStudents(): Student[] {
  return students;
}

export function getStudentById(id: string): Student | undefined {
  return students.find((s) => s.id === id);
}

export function getStudentByEnrollmentNumber(enrollmentNumber: string): Student | undefined {
  return students.find((s) => s.enrollment_number === enrollmentNumber);
}

export function createStudent(data: Omit<Student, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Student {
  const timestamp = now();
  const student: Student = {
    id: data.id ?? randomUUID(),
    enrollment_number: data.enrollment_number,
    full_name: data.full_name,
    email: data.email,
    department: data.department,
    semester: data.semester,
    section: data.section,
    created_at: timestamp,
    updated_at: timestamp,
  };
  students.push(student);
  return student;
}

export function updateStudent(id: string, data: Partial<Omit<Student, 'id' | 'created_at'>>): Student | undefined {
  const student = students.find((s) => s.id === id);
  if (!student) return undefined;
  Object.assign(student, data, { updated_at: now() });
  invalidateTimetables();
  return student;
}

export function deleteStudent(id: string): boolean {
  const idx = students.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  students.splice(idx, 1);
  // Cascade: remove enrollments for this student
  enrollments = enrollments.filter((e) => e.student_id !== id);
  invalidateTimetables();
  return true;
}

export function searchStudents(filters: {
  name?: string;
  department?: string;
  semester?: number;
  section?: string;
}): Student[] {
  return students.filter((s) => {
    if (filters.name && !s.full_name.toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.department && s.department !== filters.department) return false;
    if (filters.semester !== undefined && s.semester !== filters.semester) return false;
    if (filters.section && s.section !== filters.section) return false;
    return true;
  });
}

// ============================================================================
// EXAMS
// ============================================================================

export function getAllExams(): Exam[] {
  return exams;
}

export function getExamById(id: string): Exam | undefined {
  return exams.find((e) => e.id === id);
}

export function getExamByCode(code: string): Exam | undefined {
  return exams.find((e) => e.exam_code === code);
}

export function createExam(data: Omit<Exam, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Exam {
  const timestamp = now();
  const exam: Exam = {
    id: data.id ?? randomUUID(),
    exam_code: data.exam_code,
    subject_name: data.subject_name,
    department: data.department,
    semester: data.semester,
    duration_minutes: data.duration_minutes,
    exam_date: data.exam_date,
    created_at: timestamp,
    updated_at: timestamp,
  };
  exams.push(exam);
  return exam;
}

export function updateExam(id: string, data: Partial<Omit<Exam, 'id' | 'created_at'>>): Exam | undefined {
  const exam = exams.find((e) => e.id === id);
  if (!exam) return undefined;
  Object.assign(exam, data, { updated_at: now() });
  invalidateTimetables();
  return exam;
}

export function deleteExam(id: string): boolean {
  const idx = exams.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  exams.splice(idx, 1);
  // Cascade: remove enrollments for this exam
  enrollments = enrollments.filter((e) => e.exam_id !== id);
  invalidateTimetables();
  return true;
}

export function searchExams(filters: {
  subject?: string;
  department?: string;
  semester?: number;
}): Exam[] {
  return exams.filter((e) => {
    if (filters.subject && !e.subject_name.toLowerCase().includes(filters.subject.toLowerCase())) return false;
    if (filters.department && e.department !== filters.department) return false;
    if (filters.semester !== undefined && e.semester !== filters.semester) return false;
    return true;
  });
}

// ============================================================================
// ENROLLMENTS
// ============================================================================

export function getAllEnrollments(): Enrollment[] {
  return enrollments;
}

export function createEnrollment(
  data: Omit<Enrollment, 'id' | 'created_at' | 'student' | 'exam'> & { id?: string },
): Enrollment {
  // Validate student exists
  const student = getStudentById(data.student_id);
  if (!student) throw new Error(`Student with id "${data.student_id}" not found`);

  // Validate exam exists
  const exam = getExamById(data.exam_id);
  if (!exam) throw new Error(`Exam with id "${data.exam_id}" not found`);

  // Validate no duplicate enrollment
  const duplicate = enrollments.find(
    (e) => e.student_id === data.student_id && e.exam_id === data.exam_id,
  );
  if (duplicate) throw new Error(`Enrollment already exists for student "${data.student_id}" in exam "${data.exam_id}"`);

  const enrollment: Enrollment = {
    id: data.id ?? randomUUID(),
    student_id: data.student_id,
    exam_id: data.exam_id,
    created_at: now(),
  };
  enrollments.push(enrollment);
  invalidateTimetables();
  return enrollment;
}

export function deleteEnrollment(id: string): boolean {
  const idx = enrollments.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  enrollments.splice(idx, 1);
  invalidateTimetables();
  return true;
}

export function getEnrollmentsForStudent(studentId: string): Enrollment[] {
  return enrollments.filter((e) => e.student_id === studentId);
}

export function getEnrollmentsForExam(examId: string): Enrollment[] {
  return enrollments.filter((e) => e.exam_id === examId);
}

/**
 * Return enrollments enriched with student and exam objects.
 */
export function getEnrollmentsWithDetails(): Enrollment[] {
  return enrollments.map((e) => ({
    ...e,
    student: getStudentById(e.student_id),
    exam: getExamById(e.exam_id),
  }));
}

// ============================================================================
// ROOMS
// ============================================================================

export function getAllRooms(): Room[] {
  return rooms;
}

export function getRoomById(id: string): Room | undefined {
  return rooms.find((r) => r.id === id);
}

export function createRoom(data: Omit<Room, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Room {
  const timestamp = now();
  const room: Room = {
    id: data.id ?? randomUUID(),
    room_name: data.room_name,
    building: data.building,
    floor: data.floor,
    capacity: data.capacity,
    room_type: data.room_type,
    is_available: data.is_available,
    created_at: timestamp,
    updated_at: timestamp,
  };
  rooms.push(room);
  return room;
}

export function updateRoom(id: string, data: Partial<Omit<Room, 'id' | 'created_at'>>): Room | undefined {
  const room = rooms.find((r) => r.id === id);
  if (!room) return undefined;
  Object.assign(room, data, { updated_at: now() });
  return room;
}

export function deleteRoom(id: string): boolean {
  const idx = rooms.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  rooms.splice(idx, 1);
  return true;
}

export function getAvailableRooms(): Room[] {
  return rooms.filter((r) => r.is_available);
}

export function searchRooms(filters: {
  building?: string;
  floor?: number;
  room_type?: Room['room_type'];
  minCapacity?: number;
}): Room[] {
  return rooms.filter((r) => {
    if (filters.building && r.building !== filters.building) return false;
    if (filters.floor !== undefined && r.floor !== filters.floor) return false;
    if (filters.room_type && r.room_type !== filters.room_type) return false;
    if (filters.minCapacity !== undefined && r.capacity < filters.minCapacity) return false;
    return true;
  });
}

// ============================================================================
// TIMETABLES
// ============================================================================

export function getAllTimetables(): Timetable[] {
  return timetables;
}

export function getTimetableById(id: string): Timetable | undefined {
  return timetables.find((t) => t.id === id);
}

export function getCurrentTimetable(): Timetable | undefined {
  return timetables.find((t) => t.is_current);
}

/**
 * Save (insert or update) a timetable. If `is_current` is true, all other
 * timetables are marked as not current first.
 */
export function saveTimetable(data: Omit<Timetable, 'created_at'> & { created_at?: string }): Timetable {
  if (data.is_current) {
    for (const t of timetables) {
      t.is_current = false;
    }
  }

  const existing = timetables.find((t) => t.id === data.id);
  if (existing) {
    Object.assign(existing, data);
    return existing;
  }

  const timetable: Timetable = {
    id: data.id,
    name: data.name,
    algorithm: data.algorithm,
    num_slots: data.num_slots,
    is_valid: data.is_valid,
    is_current: data.is_current,
    created_at: data.created_at ?? now(),
    execution_time_ms: data.execution_time_ms,
  };
  timetables.push(timetable);
  return timetable;
}

export function deleteTimetable(id: string): boolean {
  const idx = timetables.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  timetables.splice(idx, 1);
  // Cascade
  timetableAssignments = timetableAssignments.filter((a) => a.timetable_id !== id);
  seatingAllocations = seatingAllocations.filter((a) => a.timetable_id !== id);
  return true;
}

// ============================================================================
// TIMETABLE ASSIGNMENTS
// ============================================================================

export function saveTimetableAssignments(batch: TimetableAssignment[]): TimetableAssignment[] {
  timetableAssignments.push(...batch);
  return batch;
}

export function getTimetableAssignments(timetableId: string): TimetableAssignment[] {
  return timetableAssignments.filter((a) => a.timetable_id === timetableId);
}

export function deleteTimetableAssignments(timetableId: string): void {
  timetableAssignments = timetableAssignments.filter((a) => a.timetable_id !== timetableId);
}

// ============================================================================
// SEATING ALLOCATIONS
// ============================================================================

export function saveSeatingAllocations(batch: SeatingAllocation[]): SeatingAllocation[] {
  seatingAllocations.push(...batch);
  return batch;
}

export function getSeatingAllocationsForTimetable(timetableId: string): SeatingAllocation[] {
  return seatingAllocations.filter((a) => a.timetable_id === timetableId);
}

export function deleteSeatingAllocationsForTimetable(timetableId: string): void {
  seatingAllocations = seatingAllocations.filter((a) => a.timetable_id !== timetableId);
}

export function getSeatingAllocationsForStudent(studentId: string): SeatingAllocation[] {
  return seatingAllocations.filter((a) => a.student_id === studentId);
}

// ============================================================================
// ALGORITHM RUNS
// ============================================================================

export function saveAlgorithmRun(data: Omit<AlgorithmRun, 'id' | 'created_at'> & { id?: string }): AlgorithmRun {
  const run: AlgorithmRun = {
    id: data.id ?? randomUUID(),
    algorithm: data.algorithm,
    num_colors: data.num_colors,
    execution_time_ms: data.execution_time_ms,
    is_valid: data.is_valid,
    graph_vertices: data.graph_vertices,
    graph_edges: data.graph_edges,
    created_at: now(),
  };
  algorithmRuns.push(run);
  return run;
}

export function getAllAlgorithmRuns(): AlgorithmRun[] {
  return algorithmRuns;
}
