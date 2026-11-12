// ============================================================================
// ExamGraph - Type Definitions
// Dynamic Graph Coloring Based Exam Timetabling & Seating Plan Generator
// ============================================================================

// Student
export interface Student {
  id: string;
  enrollment_number: string;
  full_name: string;
  email: string;
  department: string;
  semester: number;
  section: string;
  created_at: string;
  updated_at: string;
}

// Exam
export interface Exam {
  id: string;
  exam_code: string;
  subject_name: string;
  department: string;
  semester: number;
  duration_minutes: number;
  exam_date?: string;
  created_at: string;
  updated_at: string;
}

// Enrollment (student-exam relationship)
export interface Enrollment {
  id: string;
  student_id: string;
  exam_id: string;
  created_at: string;
  student?: Student;
  exam?: Exam;
}

// Examination Room
export interface Room {
  id: string;
  room_name: string;
  building: string;
  floor: number;
  capacity: number;
  room_type: 'lecture_hall' | 'lab' | 'seminar_room' | 'auditorium';
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Graph Types
// ============================================================================

export interface ConflictEdge {
  exam1_id: string;
  exam2_id: string;
  shared_students: string[]; // student IDs
  weight: number; // number of shared students
}

export interface ConflictGraph {
  vertices: string[]; // exam IDs
  adjacencyList: Map<string, Set<string>>;
  edges: ConflictEdge[];
  edgeWeights: Map<string, number>; // "examA_examB" -> weight
}

export interface GraphStats {
  totalVertices: number;
  totalEdges: number;
  maxDegree: number;
  minDegree: number;
  avgDegree: number;
  isolatedVertices: number;
  density: number;
  degreeDistribution: Record<number, number>;
}

// ============================================================================
// Coloring / Algorithm Types
// ============================================================================

export interface ColoringResult {
  coloring: Record<string, number>; // exam_id -> color (time slot)
  numColors: number;
  executionTimeMs: number;
  algorithm: 'greedy' | 'dsatur';
  isValid: boolean;
  vertexOrder: string[];
  saturationDegrees?: Record<string, number>;
}

export interface AlgorithmComparison {
  greedy: ColoringResult;
  dsatur: ColoringResult;
  recommended: 'greedy' | 'dsatur';
  recommendationReason: string;
}

// ============================================================================
// Timetable Types
// ============================================================================

export interface Timetable {
  id: string;
  name: string;
  algorithm: 'greedy' | 'dsatur';
  num_slots: number;
  is_valid: boolean;
  is_current: boolean;
  created_at: string;
  execution_time_ms: number;
}

export interface TimetableAssignment {
  id: string;
  timetable_id: string;
  exam_id: string;
  time_slot: number;
  exam?: Exam;
}

// ============================================================================
// Seating Allocation Types
// ============================================================================

export interface SeatingAllocation {
  id: string;
  timetable_id: string;
  time_slot: number;
  exam_id: string;
  room_id: string;
  student_id: string;
  seat_number: number;
  room?: Room;
  exam?: Exam;
  student?: Student;
}

export interface RoomAllocation {
  room: Room;
  allocations: SeatingAllocation[];
  examGroups: { exam: Exam; students: Student[]; startSeat: number; endSeat: number }[];
  occupiedSeats: number;
  remainingCapacity: number;
  utilizationPercent: number;
}

export interface SlotAllocation {
  timeSlot: number;
  exams: Exam[];
  rooms: RoomAllocation[];
  totalStudents: number;
  totalSeatsUsed: number;
  unallocatedStudents: number;
}

export interface SeatingResult {
  slotAllocations: SlotAllocation[];
  totalSeatsUsed: number;
  totalCapacity: number;
  overallUtilization: number;
  errors: string[];
  isComplete: boolean;
}

// ============================================================================
// Algorithm Run (history)
// ============================================================================

export interface AlgorithmRun {
  id: string;
  algorithm: 'greedy' | 'dsatur';
  num_colors: number;
  execution_time_ms: number;
  is_valid: boolean;
  graph_vertices: number;
  graph_edges: number;
  created_at: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  totalStudents: number;
  totalExams: number;
  totalRooms: number;
  totalEnrollments: number;
  totalTimeSlots: number;
  totalConflicts: number;
  roomUtilization: number;
  latestTimetable: Timetable | null;
}

// ============================================================================
// CSV Import/Export
// ============================================================================

export interface CSVImportResult {
  success: number;
  failed: number;
  errors: string[];
  total: number;
}

// ============================================================================
// Cytoscape Visualization Types
// ============================================================================

export interface CytoscapeNode {
  data: {
    id: string;
    label: string;
    color?: number;
    degree?: number;
    department?: string;
    semester?: number;
    studentCount?: number;
  };
}

export interface CytoscapeEdge {
  data: {
    id: string;
    source: string;
    target: string;
    weight: number;
    sharedStudents?: string[];
  };
}

// ============================================================================
// Form Types
// ============================================================================

export interface StudentFormData {
  enrollment_number: string;
  full_name: string;
  email: string;
  department: string;
  semester: number;
  section: string;
}

export interface ExamFormData {
  exam_code: string;
  subject_name: string;
  department: string;
  semester: number;
  duration_minutes: number;
  exam_date?: string;
}

export interface RoomFormData {
  room_name: string;
  building: string;
  floor: number;
  capacity: number;
  room_type: 'lecture_hall' | 'lab' | 'seminar_room' | 'auditorium';
  is_available: boolean;
}

// ============================================================================
// UI State Types
// ============================================================================

export type SortDirection = 'asc' | 'desc';

export interface TableSort {
  column: string;
  direction: SortDirection;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

