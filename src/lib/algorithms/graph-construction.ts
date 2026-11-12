// ============================================================================
// Graph Construction - Build conflict graph from exam/enrollment data
// ============================================================================

import type {
  Exam,
  Enrollment,
  ConflictGraph,
  ConflictEdge,
  GraphStats,
  CytoscapeNode,
  CytoscapeEdge,
} from '@/types';
import { edgeKey } from '@/lib/utils';

/**
 * Build a conflict graph from exam and enrollment data.
 *
 * A vertex is created for every exam. An edge connects two exams whenever
 * at least one student is enrolled in both; the edge weight equals the
 * number of shared students.
 */
export function buildConflictGraph(
  exams: Exam[],
  enrollments: Enrollment[],
): ConflictGraph {
  const vertices = exams.map((e) => e.id);

  // Map: student_id → set of exam_ids the student is enrolled in
  const studentExams = new Map<string, Set<string>>();
  for (const enrollment of enrollments) {
    let examSet = studentExams.get(enrollment.student_id);
    if (!examSet) {
      examSet = new Set<string>();
      studentExams.set(enrollment.student_id, examSet);
    }
    examSet.add(enrollment.exam_id);
  }

  // For every pair of exams sharing at least one student, record the edge
  const sharedMap = new Map<string, string[]>(); // edgeKey → student IDs

  for (const [studentId, examSet] of studentExams.entries()) {
    const examArr = Array.from(examSet);
    for (let i = 0; i < examArr.length; i++) {
      for (let j = i + 1; j < examArr.length; j++) {
        const key = edgeKey(examArr[i], examArr[j]);
        let list = sharedMap.get(key);
        if (!list) {
          list = [];
          sharedMap.set(key, list);
        }
        list.push(studentId);
      }
    }
  }

  // Build adjacency list
  const adjacencyList = new Map<string, Set<string>>();
  for (const v of vertices) {
    adjacencyList.set(v, new Set<string>());
  }

  const edges: ConflictEdge[] = [];
  const edgeWeights = new Map<string, number>();

  for (const [key, students] of sharedMap.entries()) {
    const [exam1, exam2] = key.split('_');
    // Only include edges for exams that are in the vertex set
    if (!adjacencyList.has(exam1) || !adjacencyList.has(exam2)) continue;

    edges.push({
      exam1_id: exam1,
      exam2_id: exam2,
      shared_students: students,
      weight: students.length,
    });

    edgeWeights.set(key, students.length);
    adjacencyList.get(exam1)!.add(exam2);
    adjacencyList.get(exam2)!.add(exam1);
  }

  return { vertices, adjacencyList, edges, edgeWeights };
}

/**
 * Calculate statistics for a conflict graph.
 */
export function calculateGraphStats(graph: ConflictGraph): GraphStats {
  const totalVertices = graph.vertices.length;
  const totalEdges = graph.edges.length;

  const degrees: number[] = graph.vertices.map(
    (v) => graph.adjacencyList.get(v)?.size ?? 0,
  );

  const maxDegree = degrees.length > 0 ? Math.max(...degrees) : 0;
  const minDegree = degrees.length > 0 ? Math.min(...degrees) : 0;
  const avgDegree =
    degrees.length > 0
      ? degrees.reduce((sum, d) => sum + d, 0) / degrees.length
      : 0;

  const isolatedVertices = degrees.filter((d) => d === 0).length;

  // Density = 2E / V(V-1) for simple undirected graph
  const density =
    totalVertices > 1
      ? (2 * totalEdges) / (totalVertices * (totalVertices - 1))
      : 0;

  // Degree distribution: degree → count of vertices with that degree
  const degreeDistribution: Record<number, number> = {};
  for (const d of degrees) {
    degreeDistribution[d] = (degreeDistribution[d] ?? 0) + 1;
  }

  return {
    totalVertices,
    totalEdges,
    maxDegree,
    minDegree,
    avgDegree,
    isolatedVertices,
    density,
    degreeDistribution,
  };
}

/**
 * Convert a ConflictGraph into Cytoscape.js element arrays for visualization.
 */
export function toCytoscapeElements(
  graph: ConflictGraph,
  exams: Exam[],
  coloring?: Record<string, number>,
): { nodes: CytoscapeNode[]; edges: CytoscapeEdge[] } {
  const examLookup = new Map<string, Exam>();
  for (const exam of exams) {
    examLookup.set(exam.id, exam);
  }

  // Count students per exam from the edges (sum of shared‐student lists per vertex)
  // This is a rough proxy; the caller can refine via enrollments if needed.

  const nodes: CytoscapeNode[] = graph.vertices.map((v) => {
    const exam = examLookup.get(v);
    const degree = graph.adjacencyList.get(v)?.size ?? 0;

    return {
      data: {
        id: v,
        label: exam ? `${exam.exam_code}\n${exam.subject_name}` : v,
        color: coloring?.[v],
        degree,
        department: exam?.department,
        semester: exam?.semester,
      },
    };
  });

  const edges: CytoscapeEdge[] = graph.edges.map((e) => ({
    data: {
      id: edgeKey(e.exam1_id, e.exam2_id),
      source: e.exam1_id,
      target: e.exam2_id,
      weight: e.weight,
      sharedStudents: e.shared_students,
    },
  }));

  return { nodes, edges };
}
