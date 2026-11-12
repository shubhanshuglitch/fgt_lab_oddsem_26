"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
  Student, Exam, Enrollment, Room, Timetable, TimetableAssignment,
  SeatingAllocation, AlgorithmRun, DashboardStats, ColoringResult,
  AlgorithmComparison, ConflictGraph, GraphStats, SeatingResult,
  CSVImportResult, StudentFormData, ExamFormData, RoomFormData
} from "@/types";
import { generateId, parseCSV } from "@/lib/utils";
import * as store from "@/lib/database/demo-store";
import { loadDemoData as loadDemo } from "@/lib/database/demo-data";
import * as gc from "@/lib/algorithms/graph-construction";
import * as greedy from "@/lib/algorithms/greedy-coloring";
import * as dsatur from "@/lib/algorithms/dsatur-coloring";
import * as comparison from "@/lib/algorithms/algorithm-comparison";
import * as binPacking from "@/lib/algorithms/bin-packing";
import toast from "react-hot-toast";

interface DataContextType {
  // Data
  students: Student[];
  exams: Exam[];
  enrollments: Enrollment[];
  rooms: Room[];
  timetables: Timetable[];
  currentTimetable: Timetable | null;
  timetableAssignments: TimetableAssignment[];
  seatingAllocations: SeatingAllocation[];
  algorithmRuns: AlgorithmRun[];

  // Graph
  conflictGraph: ConflictGraph | null;
  graphStats: GraphStats | null;
  
  // Algorithm results
  lastComparison: AlgorithmComparison | null;
  lastSeatingResult: SeatingResult | null;

  // Dashboard
  dashboardStats: DashboardStats;

  // Loading state
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  refreshData: () => void;
  loadDemoData: () => void;
  clearAllData: () => void;

  // Student CRUD
  addStudent: (data: StudentFormData) => Student | null;
  updateStudent: (id: string, data: Partial<StudentFormData>) => Student | null;
  deleteStudent: (id: string) => boolean;
  importStudentsCSV: (csvText: string) => CSVImportResult;

  // Exam CRUD
  addExam: (data: ExamFormData) => Exam | null;
  updateExam: (id: string, data: Partial<ExamFormData>) => Exam | null;
  deleteExam: (id: string) => boolean;

  // Enrollment
  addEnrollment: (studentId: string, examId: string) => Enrollment | null;
  deleteEnrollment: (id: string) => boolean;
  bulkAddEnrollments: (pairs: { studentId: string; examId: string }[]) => { success: number; failed: number };

  // Room CRUD
  addRoom: (data: RoomFormData) => Room | null;
  updateRoom: (id: string, data: Partial<RoomFormData>) => Room | null;
  deleteRoom: (id: string) => boolean;

  // Graph & Algorithms
  buildGraph: () => Promise<ConflictGraph | null>;
  runGreedy: () => Promise<ColoringResult | null>;
  runDsatur: () => Promise<ColoringResult | null>;
  runComparison: () => Promise<AlgorithmComparison | null>;
  generateTimetable: (result: ColoringResult, name: string) => Timetable | null;
  generateSeating: (timetableId: string) => Promise<SeatingResult | null>;
  recalculateAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [timetableAssignments, setTimetableAssignments] = useState<TimetableAssignment[]>([]);
  const [seatingAllocations, setSeatingAllocations] = useState<SeatingAllocation[]>([]);
  const [algorithmRuns, setAlgorithmRuns] = useState<AlgorithmRun[]>([]);
  const [conflictGraph, setConflictGraph] = useState<ConflictGraph | null>(null);
  const [graphStats, setGraphStats] = useState<GraphStats | null>(null);
  const [lastComparison, setLastComparison] = useState<AlgorithmComparison | null>(null);
  const [lastSeatingResult, setLastSeatingResult] = useState<SeatingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  // Sync from store
  const syncFromStore = useCallback(() => {
    setStudents([...store.getAllStudents()]);
    setExams([...store.getAllExams()]);
    setEnrollments([...store.getAllEnrollments()]);
    setRooms([...store.getAllRooms()]);
    setTimetables([...store.getAllTimetables()]);
    
    const current = store.getCurrentTimetable();
    if (current) {
      setTimetableAssignments([...store.getTimetableAssignments(current.id)]);
      setSeatingAllocations([...store.getSeatingAllocationsForTimetable(current.id)]);
    } else {
      setTimetableAssignments([]);
      setSeatingAllocations([]);
    }
    setAlgorithmRuns([...store.getAllAlgorithmRuns()]);
  }, []);

  useEffect(() => {
    syncFromStore();
    setIsInitialized(true);
  }, [syncFromStore, dataVersion]);

  const refreshData = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  const currentTimetable = timetables.find((t) => t.is_current) || null;

  const dashboardStats: DashboardStats = {
    totalStudents: students.length,
    totalExams: exams.length,
    totalRooms: rooms.length,
    totalEnrollments: enrollments.length,
    totalTimeSlots: currentTimetable?.num_slots || 0,
    totalConflicts: graphStats?.totalEdges || 0,
    roomUtilization: lastSeatingResult?.overallUtilization
      ? Math.round(lastSeatingResult.overallUtilization)
      : 0,
    latestTimetable: currentTimetable,
  };

  // ===== Student CRUD =====
  const addStudent = useCallback((data: StudentFormData): Student | null => {
    try {
      const existing = store.getStudentByEnrollmentNumber(data.enrollment_number);
      if (existing) {
        toast.error(`Student with enrollment ${data.enrollment_number} already exists`);
        return null;
      }
      const student = store.createStudent(data);
      toast.success("Student added successfully");
      refreshData();
      return student;
    } catch {
      toast.error("Failed to add student");
      return null;
    }
  }, [refreshData]);

  const updateStudent = useCallback((id: string, data: Partial<StudentFormData>): Student | null => {
    try {
      const student = store.updateStudent(id, data);
      if (!student) {
        toast.error("Student not found");
        return null;
      }
      toast.success("Student updated successfully");
      refreshData();
      return student;
    } catch {
      toast.error("Failed to update student");
      return null;
    }
  }, [refreshData]);

  const deleteStudent = useCallback((id: string): boolean => {
    try {
      const result = store.deleteStudent(id);
      if (result) {
        toast.success("Student deleted successfully");
        refreshData();
      }
      return result;
    } catch {
      toast.error("Failed to delete student");
      return false;
    }
  }, [refreshData]);

  const importStudentsCSV = useCallback((csvText: string): CSVImportResult => {
    const rows = parseCSV(csvText);
    const result: CSVImportResult = { success: 0, failed: 0, errors: [], total: rows.length - 1 };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 6) {
        result.failed++;
        result.errors.push(`Row ${i + 1}: insufficient columns`);
        continue;
      }
      try {
        const existing = store.getStudentByEnrollmentNumber(row[0]);
        if (existing) {
          result.failed++;
          result.errors.push(`Row ${i + 1}: enrollment ${row[0]} already exists`);
          continue;
        }
        store.createStudent({
          enrollment_number: row[0],
          full_name: row[1],
          email: row[2],
          department: row[3],
          semester: parseInt(row[4]),
          section: row[5],
        });
        result.success++;
      } catch (e) {
        result.failed++;
        result.errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'unknown error'}`);
      }
    }
    refreshData();
    return result;
  }, [refreshData]);

  // ===== Exam CRUD =====
  const addExam = useCallback((data: ExamFormData): Exam | null => {
    try {
      const existing = store.getExamByCode(data.exam_code);
      if (existing) {
        toast.error(`Exam with code ${data.exam_code} already exists`);
        return null;
      }
      const exam = store.createExam(data);
      toast.success("Exam added successfully");
      refreshData();
      return exam;
    } catch {
      toast.error("Failed to add exam");
      return null;
    }
  }, [refreshData]);

  const updateExam = useCallback((id: string, data: Partial<ExamFormData>): Exam | null => {
    try {
      const exam = store.updateExam(id, data);
      if (!exam) {
        toast.error("Exam not found");
        return null;
      }
      toast.success("Exam updated successfully");
      refreshData();
      return exam;
    } catch {
      toast.error("Failed to update exam");
      return null;
    }
  }, [refreshData]);

  const deleteExam = useCallback((id: string): boolean => {
    try {
      const result = store.deleteExam(id);
      if (result) {
        toast.success("Exam deleted successfully");
        refreshData();
      }
      return result;
    } catch {
      toast.error("Failed to delete exam");
      return false;
    }
  }, [refreshData]);

  // ===== Enrollment =====
  const addEnrollment = useCallback((studentId: string, examId: string): Enrollment | null => {
    try {
      const enrollment = store.createEnrollment({ student_id: studentId, exam_id: examId });
      toast.success("Enrollment added");
      refreshData();
      return enrollment;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add enrollment");
      return null;
    }
  }, [refreshData]);

  const deleteEnrollment = useCallback((id: string): boolean => {
    try {
      const result = store.deleteEnrollment(id);
      if (result) {
        toast.success("Enrollment removed");
        refreshData();
      }
      return result;
    } catch {
      toast.error("Failed to remove enrollment");
      return false;
    }
  }, [refreshData]);

  const bulkAddEnrollments = useCallback((pairs: { studentId: string; examId: string }[]) => {
    let success = 0;
    let failed = 0;
    for (const pair of pairs) {
      try {
        const result = store.createEnrollment({ student_id: pair.studentId, exam_id: pair.examId });
        if (result) success++;
        else failed++;
      } catch {
        failed++;
      }
    }
    refreshData();
    return { success, failed };
  }, [refreshData]);

  // ===== Room CRUD =====
  const addRoom = useCallback((data: RoomFormData): Room | null => {
    try {
      const room = store.createRoom(data);
      toast.success("Room added successfully");
      refreshData();
      return room;
    } catch {
      toast.error("Failed to add room");
      return null;
    }
  }, [refreshData]);

  const updateRoom = useCallback((id: string, data: Partial<RoomFormData>): Room | null => {
    try {
      const room = store.updateRoom(id, data);
      if (!room) {
        toast.error("Room not found");
        return null;
      }
      toast.success("Room updated successfully");
      refreshData();
      return room;
    } catch {
      toast.error("Failed to update room");
      return null;
    }
  }, [refreshData]);

  const deleteRoom = useCallback((id: string): boolean => {
    try {
      const result = store.deleteRoom(id);
      if (result) {
        toast.success("Room deleted successfully");
        refreshData();
      }
      return result;
    } catch {
      toast.error("Failed to delete room");
      return false;
    }
  }, [refreshData]);

  // ===== Graph & Algorithms =====
  const buildGraph = useCallback(async (): Promise<ConflictGraph | null> => {
    try {
      const currentExams = store.getAllExams();
      const currentEnrollments = store.getAllEnrollments();
      const graph = gc.buildConflictGraph(currentExams, currentEnrollments);
      const stats = gc.calculateGraphStats(graph);
      setConflictGraph(graph);
      setGraphStats(stats);
      return graph;
    } catch {
      toast.error("Failed to build conflict graph");
      return null;
    }
  }, []);

  const runGreedy = useCallback(async (): Promise<ColoringResult | null> => {
    try {
      const currentExams = store.getAllExams();
      const currentEnrollments = store.getAllEnrollments();
      const graph = gc.buildConflictGraph(currentExams, currentEnrollments);
      const stats = gc.calculateGraphStats(graph);
      setConflictGraph(graph);
      setGraphStats(stats);
      const result = greedy.greedyColoring(graph);
      return result;
    } catch {
      toast.error("Failed to run Greedy algorithm");
      return null;
    }
  }, []);

  const runDsatur = useCallback(async (): Promise<ColoringResult | null> => {
    try {
      const currentExams = store.getAllExams();
      const currentEnrollments = store.getAllEnrollments();
      const graph = gc.buildConflictGraph(currentExams, currentEnrollments);
      const stats = gc.calculateGraphStats(graph);
      setConflictGraph(graph);
      setGraphStats(stats);
      const result = dsatur.dsaturColoring(graph);
      return result;
    } catch {
      toast.error("Failed to run DSATUR algorithm");
      return null;
    }
  }, []);

  const runComparison = useCallback(async (): Promise<AlgorithmComparison | null> => {
    try {
      const currentExams = store.getAllExams();
      const currentEnrollments = store.getAllEnrollments();
      const graph = gc.buildConflictGraph(currentExams, currentEnrollments);
      const stats = gc.calculateGraphStats(graph);
      setConflictGraph(graph);
      setGraphStats(stats);

      const result = comparison.compareAlgorithms(graph);
      setLastComparison(result);

      store.saveAlgorithmRun({
        algorithm: 'greedy',
        num_colors: result.greedy.numColors,
        execution_time_ms: result.greedy.executionTimeMs,
        is_valid: result.greedy.isValid,
        graph_vertices: graph.vertices.length,
        graph_edges: graph.edges.length,
      });
      store.saveAlgorithmRun({
        algorithm: 'dsatur',
        num_colors: result.dsatur.numColors,
        execution_time_ms: result.dsatur.executionTimeMs,
        is_valid: result.dsatur.isValid,
        graph_vertices: graph.vertices.length,
        graph_edges: graph.edges.length,
      });
      refreshData();
      return result;
    } catch {
      toast.error("Failed to compare algorithms");
      return null;
    }
  }, [refreshData]);

  const generateTimetable = useCallback((result: ColoringResult, name: string): Timetable | null => {
    try {
      const timetable = store.saveTimetable({
        id: generateId(),
        name,
        algorithm: result.algorithm,
        num_slots: result.numColors,
        is_valid: result.isValid,
        is_current: true,
        execution_time_ms: result.executionTimeMs,
      });

      const assignments = Object.entries(result.coloring).map(([examId, slot]) => ({
        id: generateId(),
        timetable_id: timetable.id,
        exam_id: examId,
        time_slot: slot,
      }));
      store.saveTimetableAssignments(assignments);

      toast.success(`Timetable "${name}" generated with ${result.numColors} time slots`);
      refreshData();
      return timetable;
    } catch {
      toast.error("Failed to generate timetable");
      return null;
    }
  }, [refreshData]);

  const generateSeating = useCallback(async (timetableId: string): Promise<SeatingResult | null> => {
    try {
      const assignments = store.getTimetableAssignments(timetableId);
      const availableRooms = store.getAvailableRooms();
      const currentExams = store.getAllExams();
      const currentEnrollments = store.getAllEnrollments();
      const currentStudents = store.getAllStudents();
      
      if (assignments.length === 0) {
        toast.error("No timetable assignments found");
        return null;
      }
      if (availableRooms.length === 0) {
        toast.error("No available rooms");
        return null;
      }

      const result = binPacking.allocateSeating(
        timetableId, assignments, currentEnrollments, availableRooms, currentExams, currentStudents
      );

      store.deleteSeatingAllocationsForTimetable(timetableId);
      const allAllocations: Array<{
        id: string; timetable_id: string; time_slot: number; exam_id: string;
        room_id: string; student_id: string; seat_number: number;
      }> = [];
      for (const slot of result.slotAllocations) {
        for (const room of slot.rooms) {
          for (const alloc of room.allocations) {
            allAllocations.push({
              id: alloc.id || generateId(),
              timetable_id: alloc.timetable_id,
              time_slot: alloc.time_slot,
              exam_id: alloc.exam_id,
              room_id: alloc.room_id,
              student_id: alloc.student_id,
              seat_number: alloc.seat_number,
            });
          }
        }
      }
      store.saveSeatingAllocations(allAllocations);
      setLastSeatingResult(result);
      
      if (result.isComplete) {
        toast.success("Seating allocation completed successfully");
      } else {
        toast.error(`Seating allocation incomplete: ${result.errors.join(', ')}`);
      }

      refreshData();
      return result;
    } catch {
      toast.error("Failed to generate seating allocation");
      return null;
    }
  }, [refreshData]);

  const recalculateAll = useCallback(async () => {
    setIsLoading(true);
    try {
      toast.loading("Recalculating...", { id: "recalculate" });
      
      const currentExams = store.getAllExams();
      const currentEnrollments = store.getAllEnrollments();
      const currentStudents = store.getAllStudents();

      // 1. Rebuild graph
      const graph = gc.buildConflictGraph(currentExams, currentEnrollments);
      const stats = gc.calculateGraphStats(graph);
      setConflictGraph(graph);
      setGraphStats(stats);

      // 2. Run comparison
      const compResult = comparison.compareAlgorithms(graph);
      setLastComparison(compResult);

      // 3. Generate timetable from recommended algorithm
      const recommended = compResult.recommended === 'greedy' ? compResult.greedy : compResult.dsatur;
      
      store.saveAlgorithmRun({
        algorithm: 'greedy', num_colors: compResult.greedy.numColors,
        execution_time_ms: compResult.greedy.executionTimeMs, is_valid: compResult.greedy.isValid,
        graph_vertices: graph.vertices.length, graph_edges: graph.edges.length,
      });
      store.saveAlgorithmRun({
        algorithm: 'dsatur', num_colors: compResult.dsatur.numColors,
        execution_time_ms: compResult.dsatur.executionTimeMs, is_valid: compResult.dsatur.isValid,
        graph_vertices: graph.vertices.length, graph_edges: graph.edges.length,
      });

      const timetable = store.saveTimetable({
        id: generateId(),
        name: `Auto-generated (${compResult.recommended.toUpperCase()})`,
        algorithm: compResult.recommended,
        num_slots: recommended.numColors,
        is_valid: recommended.isValid,
        is_current: true,
        execution_time_ms: recommended.executionTimeMs,
      });

      const assignments = Object.entries(recommended.coloring).map(([examId, slot]) => ({
        id: generateId(),
        timetable_id: timetable.id,
        exam_id: examId,
        time_slot: slot,
      }));
      store.saveTimetableAssignments(assignments);

      // 4. Generate seating
      const savedAssignments = store.getTimetableAssignments(timetable.id);
      const availableRooms = store.getAvailableRooms();
      
      if (availableRooms.length > 0) {
        const seatingResult = binPacking.allocateSeating(
          timetable.id, savedAssignments, currentEnrollments, availableRooms, currentExams, currentStudents
        );
        
        store.deleteSeatingAllocationsForTimetable(timetable.id);
        const allAllocations: Array<{
          id: string; timetable_id: string; time_slot: number; exam_id: string;
          room_id: string; student_id: string; seat_number: number;
        }> = [];
        for (const slot of seatingResult.slotAllocations) {
          for (const room of slot.rooms) {
            for (const alloc of room.allocations) {
              allAllocations.push({
                id: alloc.id || generateId(),
                timetable_id: alloc.timetable_id,
                time_slot: alloc.time_slot,
                exam_id: alloc.exam_id,
                room_id: alloc.room_id,
                student_id: alloc.student_id,
                seat_number: alloc.seat_number,
              });
            }
          }
        }
        store.saveSeatingAllocations(allAllocations);
        setLastSeatingResult(seatingResult);
      }

      refreshData();
      toast.success("Recalculation complete!", { id: "recalculate" });
    } catch (e) {
      toast.error("Recalculation failed", { id: "recalculate" });
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [refreshData]);

  const loadDemoDataAction = useCallback(() => {
    try {
      loadDemo(true);
      toast.success("Demo data loaded successfully!");
      refreshData();
    } catch (e) {
      toast.error("Failed to load demo data");
      console.error(e);
    }
  }, [refreshData]);

  const clearAllData = useCallback(() => {
    try {
      store.clearAll();
      setConflictGraph(null);
      setGraphStats(null);
      setLastComparison(null);
      setLastSeatingResult(null);
      toast.success("All data cleared");
      refreshData();
    } catch {
      toast.error("Failed to clear data");
    }
  }, [refreshData]);

  return (
    <DataContext.Provider
      value={{
        students, exams, enrollments, rooms, timetables,
        currentTimetable, timetableAssignments, seatingAllocations,
        algorithmRuns, conflictGraph, graphStats, lastComparison,
        lastSeatingResult, dashboardStats, isLoading, isInitialized,
        refreshData, loadDemoData: loadDemoDataAction, clearAllData,
        addStudent, updateStudent, deleteStudent, importStudentsCSV,
        addExam, updateExam, deleteExam,
        addEnrollment, deleteEnrollment, bulkAddEnrollments,
        addRoom, updateRoom, deleteRoom,
        buildGraph, runGreedy, runDsatur, runComparison,
        generateTimetable, generateSeating, recalculateAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
