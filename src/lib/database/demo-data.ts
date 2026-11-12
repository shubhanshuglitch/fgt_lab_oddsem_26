// ============================================================================
// ExamGraph - Demo Data Loader
// Populates the in-memory store with realistic university exam data
// ============================================================================

import {
  createStudent,
  createExam,
  createEnrollment,
  createRoom,
  clearAll,
  hasData,
} from './demo-store';

// ---------------------------------------------------------------------------
// loadDemoData  –  Idempotent: skips if data is already loaded
// ---------------------------------------------------------------------------

export function loadDemoData(force = false): void {
  if (hasData() && !force) return;

  // Reset to be safe
  clearAll();

  // ========================================================================
  // STUDENTS  (35 students across CSE, ECE, ME — semesters 3-5, sections A/B)
  // ========================================================================

  const studentDefs: {
    id: string;
    enrollment_number: string;
    full_name: string;
    email: string;
    department: string;
    semester: number;
    section: string;
  }[] = [
    // CSE — Semester 3 — Section A (5)
    { id: 'student-01', enrollment_number: '21CSE001', full_name: 'Aarav Sharma', email: 'aarav.sharma@university.edu', department: 'CSE', semester: 3, section: 'A' },
    { id: 'student-02', enrollment_number: '21CSE002', full_name: 'Priya Patel', email: 'priya.patel@university.edu', department: 'CSE', semester: 3, section: 'A' },
    { id: 'student-03', enrollment_number: '21CSE003', full_name: 'Rohan Gupta', email: 'rohan.gupta@university.edu', department: 'CSE', semester: 3, section: 'A' },
    { id: 'student-04', enrollment_number: '21CSE004', full_name: 'Ananya Singh', email: 'ananya.singh@university.edu', department: 'CSE', semester: 3, section: 'A' },
    { id: 'student-05', enrollment_number: '21CSE005', full_name: 'Vikram Reddy', email: 'vikram.reddy@university.edu', department: 'CSE', semester: 3, section: 'A' },

    // CSE — Semester 3 — Section B (5)
    { id: 'student-06', enrollment_number: '21CSE006', full_name: 'Meera Joshi', email: 'meera.joshi@university.edu', department: 'CSE', semester: 3, section: 'B' },
    { id: 'student-07', enrollment_number: '21CSE007', full_name: 'Arjun Nair', email: 'arjun.nair@university.edu', department: 'CSE', semester: 3, section: 'B' },
    { id: 'student-08', enrollment_number: '21CSE008', full_name: 'Kavya Menon', email: 'kavya.menon@university.edu', department: 'CSE', semester: 3, section: 'B' },
    { id: 'student-09', enrollment_number: '21CSE009', full_name: 'Siddharth Rao', email: 'siddharth.rao@university.edu', department: 'CSE', semester: 3, section: 'B' },
    { id: 'student-10', enrollment_number: '21CSE010', full_name: 'Nisha Verma', email: 'nisha.verma@university.edu', department: 'CSE', semester: 3, section: 'B' },

    // CSE — Semester 5 — Section A (4)
    { id: 'student-11', enrollment_number: '20CSE011', full_name: 'Rahul Deshmukh', email: 'rahul.deshmukh@university.edu', department: 'CSE', semester: 5, section: 'A' },
    { id: 'student-12', enrollment_number: '20CSE012', full_name: 'Pooja Iyer', email: 'pooja.iyer@university.edu', department: 'CSE', semester: 5, section: 'A' },
    { id: 'student-13', enrollment_number: '20CSE013', full_name: 'Aditya Kulkarni', email: 'aditya.kulkarni@university.edu', department: 'CSE', semester: 5, section: 'A' },
    { id: 'student-14', enrollment_number: '20CSE014', full_name: 'Sneha Bhatt', email: 'sneha.bhatt@university.edu', department: 'CSE', semester: 5, section: 'A' },

    // ECE — Semester 3 — Section A (5)
    { id: 'student-15', enrollment_number: '21ECE001', full_name: 'Karthik Sundaram', email: 'karthik.sundaram@university.edu', department: 'ECE', semester: 3, section: 'A' },
    { id: 'student-16', enrollment_number: '21ECE002', full_name: 'Divya Krishnan', email: 'divya.krishnan@university.edu', department: 'ECE', semester: 3, section: 'A' },
    { id: 'student-17', enrollment_number: '21ECE003', full_name: 'Manish Tiwari', email: 'manish.tiwari@university.edu', department: 'ECE', semester: 3, section: 'A' },
    { id: 'student-18', enrollment_number: '21ECE004', full_name: 'Ritu Saxena', email: 'ritu.saxena@university.edu', department: 'ECE', semester: 3, section: 'A' },
    { id: 'student-19', enrollment_number: '21ECE005', full_name: 'Suresh Pillai', email: 'suresh.pillai@university.edu', department: 'ECE', semester: 3, section: 'A' },

    // ECE — Semester 5 — Section A (4)
    { id: 'student-20', enrollment_number: '20ECE006', full_name: 'Anjali Kapoor', email: 'anjali.kapoor@university.edu', department: 'ECE', semester: 5, section: 'A' },
    { id: 'student-21', enrollment_number: '20ECE007', full_name: 'Deepak Mishra', email: 'deepak.mishra@university.edu', department: 'ECE', semester: 5, section: 'A' },
    { id: 'student-22', enrollment_number: '20ECE008', full_name: 'Fatima Sheikh', email: 'fatima.sheikh@university.edu', department: 'ECE', semester: 5, section: 'A' },
    { id: 'student-23', enrollment_number: '20ECE009', full_name: 'Gaurav Malhotra', email: 'gaurav.malhotra@university.edu', department: 'ECE', semester: 5, section: 'A' },

    // ECE — Semester 3 — Section B (3)
    { id: 'student-24', enrollment_number: '21ECE010', full_name: 'Harini Rajan', email: 'harini.rajan@university.edu', department: 'ECE', semester: 3, section: 'B' },
    { id: 'student-25', enrollment_number: '21ECE011', full_name: 'Ishaan Bhargava', email: 'ishaan.bhargava@university.edu', department: 'ECE', semester: 3, section: 'B' },
    { id: 'student-26', enrollment_number: '21ECE012', full_name: 'Jaya Ramesh', email: 'jaya.ramesh@university.edu', department: 'ECE', semester: 3, section: 'B' },

    // ME — Semester 3 — Section A (5)
    { id: 'student-27', enrollment_number: '21ME001', full_name: 'Kunal Agarwal', email: 'kunal.agarwal@university.edu', department: 'ME', semester: 3, section: 'A' },
    { id: 'student-28', enrollment_number: '21ME002', full_name: 'Lakshmi Narayan', email: 'lakshmi.narayan@university.edu', department: 'ME', semester: 3, section: 'A' },
    { id: 'student-29', enrollment_number: '21ME003', full_name: 'Mohit Chauhan', email: 'mohit.chauhan@university.edu', department: 'ME', semester: 3, section: 'A' },
    { id: 'student-30', enrollment_number: '21ME004', full_name: 'Neha Pandey', email: 'neha.pandey@university.edu', department: 'ME', semester: 3, section: 'A' },
    { id: 'student-31', enrollment_number: '21ME005', full_name: 'Om Prakash', email: 'om.prakash@university.edu', department: 'ME', semester: 3, section: 'A' },

    // ME — Semester 5 — Section A (4)
    { id: 'student-32', enrollment_number: '20ME006', full_name: 'Pallavi Sinha', email: 'pallavi.sinha@university.edu', department: 'ME', semester: 5, section: 'A' },
    { id: 'student-33', enrollment_number: '20ME007', full_name: 'Qadir Hussain', email: 'qadir.hussain@university.edu', department: 'ME', semester: 5, section: 'A' },
    { id: 'student-34', enrollment_number: '20ME008', full_name: 'Rashmi Dubey', email: 'rashmi.dubey@university.edu', department: 'ME', semester: 5, section: 'A' },
    { id: 'student-35', enrollment_number: '20ME009', full_name: 'Sameer Jain', email: 'sameer.jain@university.edu', department: 'ME', semester: 5, section: 'A' },
  ];

  for (const s of studentDefs) {
    createStudent(s);
  }

  // ========================================================================
  // EXAMS  (10 examinations)
  // ========================================================================
  //
  // Conflict design summary:
  //   E1 (DS)   ⟷ E2 (Algo) : heavy overlap (CSE sem-3 core pair)
  //   E1 (DS)   ⟷ E3 (Maths): moderate overlap (cross-dept sem-3)
  //   E2 (Algo) ⟷ E3 (Maths): moderate overlap
  //   E4 (DE)   ⟷ E5 (SS)   : heavy overlap (ECE sem-3 core pair)
  //   E4 (DE)   ⟷ E3 (Maths): light overlap (cross-dept)
  //   E6 (DBMS) ⟷ E7 (CN)   : moderate overlap (CSE sem-5)
  //   E6 (DBMS) ⟷ E8 (VLSI) : light overlap (cross-dept sem-5)
  //   E9 (Thermo)             : isolated — shares no students
  //   E10 (FEM)               : isolated — shares no students
  //
  // This forces at least 3 colours; greedy (alphabetical) may use 4
  // while DSATUR can find 3.

  const examDefs: {
    id: string;
    exam_code: string;
    subject_name: string;
    department: string;
    semester: number;
    duration_minutes: number;
  }[] = [
    { id: 'exam-01', exam_code: 'CS301', subject_name: 'Data Structures', department: 'CSE', semester: 3, duration_minutes: 180 },
    { id: 'exam-02', exam_code: 'CS302', subject_name: 'Design & Analysis of Algorithms', department: 'CSE', semester: 3, duration_minutes: 180 },
    { id: 'exam-03', exam_code: 'MA301', subject_name: 'Engineering Mathematics III', department: 'CSE', semester: 3, duration_minutes: 180 },
    { id: 'exam-04', exam_code: 'EC301', subject_name: 'Digital Electronics', department: 'ECE', semester: 3, duration_minutes: 180 },
    { id: 'exam-05', exam_code: 'EC302', subject_name: 'Signals & Systems', department: 'ECE', semester: 3, duration_minutes: 180 },
    { id: 'exam-06', exam_code: 'CS501', subject_name: 'Database Management Systems', department: 'CSE', semester: 5, duration_minutes: 180 },
    { id: 'exam-07', exam_code: 'CS502', subject_name: 'Computer Networks', department: 'CSE', semester: 5, duration_minutes: 180 },
    { id: 'exam-08', exam_code: 'EC501', subject_name: 'VLSI Design', department: 'ECE', semester: 5, duration_minutes: 180 },
    { id: 'exam-09', exam_code: 'ME301', subject_name: 'Thermodynamics', department: 'ME', semester: 3, duration_minutes: 180 },
    { id: 'exam-10', exam_code: 'ME501', subject_name: 'Finite Element Methods', department: 'ME', semester: 5, duration_minutes: 180 },
  ];

  for (const e of examDefs) {
    createExam(e);
  }

  // ========================================================================
  // ENROLLMENTS
  // ========================================================================
  //
  // Enrollment design produces this conflict adjacency:
  //
  //   E1 — E2  (8 shared)   E4 — E5  (7 shared)   E6 — E7  (4 shared)
  //   E1 — E3  (5 shared)   E4 — E3  (3 shared)   E6 — E8  (2 shared)
  //   E2 — E3  (4 shared)   E5 — E3  (2 shared)   E7 — E8  (2 shared)
  //
  //   E9  — (none)          E10 — (none)           isolated vertices
  //
  // Clique {E1,E2,E3} needs 3 colours.
  // Greedy on alphabetical order may need 4 due to E4/E5/E3 triangle.
  // DSATUR processes by saturation → typically finds 3.

  let enrollmentCounter = 0;
  function enroll(studentId: string, examId: string) {
    enrollmentCounter++;
    const padded = String(enrollmentCounter).padStart(3, '0');
    createEnrollment({ id: `enrollment-${padded}`, student_id: studentId, exam_id: examId });
  }

  // ----- E1: Data Structures (CS301) — CSE sem-3 core -----
  // students 01-10 (all CSE sem-3)
  enroll('student-01', 'exam-01');
  enroll('student-02', 'exam-01');
  enroll('student-03', 'exam-01');
  enroll('student-04', 'exam-01');
  enroll('student-05', 'exam-01');
  enroll('student-06', 'exam-01');
  enroll('student-07', 'exam-01');
  enroll('student-08', 'exam-01');
  enroll('student-09', 'exam-01');
  enroll('student-10', 'exam-01');

  // ----- E2: Algorithms (CS302) — CSE sem-3 core -----
  // students 01-08 (overlap 8 with E1)
  enroll('student-01', 'exam-02');
  enroll('student-02', 'exam-02');
  enroll('student-03', 'exam-02');
  enroll('student-04', 'exam-02');
  enroll('student-05', 'exam-02');
  enroll('student-06', 'exam-02');
  enroll('student-07', 'exam-02');
  enroll('student-08', 'exam-02');

  // ----- E3: Maths III (MA301) — cross-department sem-3 -----
  // CSE: students 01-05 (overlap 5 with E1, 5 with E2)
  // ECE: students 15-17 (overlap 3 with E4, 2 with E5)
  enroll('student-01', 'exam-03');
  enroll('student-02', 'exam-03');
  enroll('student-03', 'exam-03');
  enroll('student-04', 'exam-03');
  enroll('student-05', 'exam-03');
  enroll('student-15', 'exam-03');
  enroll('student-16', 'exam-03');
  enroll('student-17', 'exam-03');

  // ----- E4: Digital Electronics (EC301) — ECE sem-3 core -----
  // students 15-19, 24-26 (overlap with E3 via 15,16,17)
  enroll('student-15', 'exam-04');
  enroll('student-16', 'exam-04');
  enroll('student-17', 'exam-04');
  enroll('student-18', 'exam-04');
  enroll('student-19', 'exam-04');
  enroll('student-24', 'exam-04');
  enroll('student-25', 'exam-04');
  enroll('student-26', 'exam-04');

  // ----- E5: Signals & Systems (EC302) — ECE sem-3 core -----
  // students 15-19, 24,25 (overlap 7 with E4, overlap 2 with E3 via 15,16)
  enroll('student-15', 'exam-05');
  enroll('student-16', 'exam-05');
  enroll('student-17', 'exam-05');
  enroll('student-18', 'exam-05');
  enroll('student-19', 'exam-05');
  enroll('student-24', 'exam-05');
  enroll('student-25', 'exam-05');

  // ----- E6: DBMS (CS501) — CSE sem-5 -----
  // students 11-14 + cross-dept: 20,21
  enroll('student-11', 'exam-06');
  enroll('student-12', 'exam-06');
  enroll('student-13', 'exam-06');
  enroll('student-14', 'exam-06');
  enroll('student-20', 'exam-06');
  enroll('student-21', 'exam-06');

  // ----- E7: Computer Networks (CS502) — CSE sem-5 -----
  // students 11-14 (overlap 4 with E6) + cross-dept: 22,23
  enroll('student-11', 'exam-07');
  enroll('student-12', 'exam-07');
  enroll('student-13', 'exam-07');
  enroll('student-14', 'exam-07');
  enroll('student-22', 'exam-07');
  enroll('student-23', 'exam-07');

  // ----- E8: VLSI Design (EC501) — ECE sem-5 -----
  // students 20-23 (overlap 2 with E6 via 20,21; overlap 2 with E7 via 22,23)
  enroll('student-20', 'exam-08');
  enroll('student-21', 'exam-08');
  enroll('student-22', 'exam-08');
  enroll('student-23', 'exam-08');

  // ----- E9: Thermodynamics (ME301) — ME sem-3 — ISOLATED -----
  // students 27-31 (no overlap with any other exam)
  enroll('student-27', 'exam-09');
  enroll('student-28', 'exam-09');
  enroll('student-29', 'exam-09');
  enroll('student-30', 'exam-09');
  enroll('student-31', 'exam-09');

  // ----- E10: Finite Element Methods (ME501) — ME sem-5 — ISOLATED -----
  // students 32-35 (no overlap with any other exam)
  enroll('student-32', 'exam-10');
  enroll('student-33', 'exam-10');
  enroll('student-34', 'exam-10');
  enroll('student-35', 'exam-10');

  // ========================================================================
  // ROOMS  (6 rooms)
  // ========================================================================

  const roomDefs: {
    id: string;
    room_name: string;
    building: string;
    floor: number;
    capacity: number;
    room_type: 'lecture_hall' | 'lab' | 'seminar_room' | 'auditorium';
    is_available: boolean;
  }[] = [
    { id: 'room-01', room_name: 'LH-101', building: 'Academic Block A', floor: 1, capacity: 60, room_type: 'lecture_hall', is_available: true },
    { id: 'room-02', room_name: 'LH-201', building: 'Academic Block A', floor: 2, capacity: 50, room_type: 'lecture_hall', is_available: true },
    { id: 'room-03', room_name: 'LH-301', building: 'Academic Block B', floor: 3, capacity: 40, room_type: 'lecture_hall', is_available: true },
    { id: 'room-04', room_name: 'SR-102', building: 'Academic Block B', floor: 1, capacity: 35, room_type: 'seminar_room', is_available: true },
    { id: 'room-05', room_name: 'SR-202', building: 'Academic Block C', floor: 2, capacity: 30, room_type: 'seminar_room', is_available: true },
    { id: 'room-06', room_name: 'SR-302', building: 'Academic Block C', floor: 3, capacity: 25, room_type: 'seminar_room', is_available: true },
  ];

  for (const r of roomDefs) {
    createRoom(r);
  }
}
