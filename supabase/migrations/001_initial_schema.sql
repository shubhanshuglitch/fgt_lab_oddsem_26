-- ============================================================================
-- Dynamic Graph Coloring Based Exam Timetabling & Seating Plan Generator
-- Migration: 001_initial_schema.sql
-- ============================================================================

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester >= 1 AND semester <= 8),
    section VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for searching students
CREATE INDEX IF NOT EXISTS idx_students_enrollment ON students(enrollment_number);
CREATE INDEX IF NOT EXISTS idx_students_dept_sem ON students(department, semester);

-- 2. Exams / Subjects Table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_code VARCHAR(50) UNIQUE NOT NULL,
    subject_name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester >= 1 AND semester <= 8),
    duration_minutes INT NOT NULL DEFAULT 180 CHECK (duration_minutes > 0),
    exam_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exams_code ON exams(exam_code);
CREATE INDEX IF NOT EXISTS idx_exams_dept_sem ON exams(department, semester);

-- 3. Enrollments Table (Many-to-Many between Students and Exams)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_student_exam UNIQUE(student_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_exam ON enrollments(exam_id);

-- 4. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_name VARCHAR(100) UNIQUE NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor INT NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    room_type VARCHAR(50) NOT NULL DEFAULT 'lecture_hall',
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rooms_available ON rooms(is_available);

-- 5. Timetables Table
CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    algorithm VARCHAR(50) NOT NULL CHECK (algorithm IN ('greedy', 'dsatur')),
    num_slots INT NOT NULL CHECK (num_slots >= 0),
    is_valid BOOLEAN NOT NULL DEFAULT true,
    is_current BOOLEAN NOT NULL DEFAULT false,
    execution_time_ms DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_timetables_current ON timetables(is_current);

-- 6. Timetable Assignments (Slot assignment for each exam)
CREATE TABLE IF NOT EXISTS timetable_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    time_slot INT NOT NULL CHECK (time_slot >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_timetable_exam UNIQUE(timetable_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_timetable ON timetable_assignments(timetable_id);
CREATE INDEX IF NOT EXISTS idx_assignments_slot ON timetable_assignments(timetable_id, time_slot);

-- 7. Seating Allocations Table (Specific student allocated to room and seat for an exam)
CREATE TABLE IF NOT EXISTS seating_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    time_slot INT NOT NULL,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    seat_number INT NOT NULL CHECK (seat_number > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_slot_room_seat UNIQUE(timetable_id, time_slot, room_id, seat_number),
    CONSTRAINT uq_slot_student UNIQUE(timetable_id, time_slot, student_id)
);

CREATE INDEX IF NOT EXISTS idx_seating_timetable_slot ON seating_allocations(timetable_id, time_slot);
CREATE INDEX IF NOT EXISTS idx_seating_room ON seating_allocations(room_id);
CREATE INDEX IF NOT EXISTS idx_seating_student ON seating_allocations(student_id);

-- 8. Algorithm Runs Table (Historical execution metrics for audit and comparison)
CREATE TABLE IF NOT EXISTS algorithm_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    algorithm VARCHAR(50) NOT NULL CHECK (algorithm IN ('greedy', 'dsatur')),
    num_colors INT NOT NULL,
    execution_time_ms DOUBLE PRECISION NOT NULL,
    is_valid BOOLEAN NOT NULL,
    graph_vertices INT NOT NULL,
    graph_edges INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Row Level Security (RLS) Policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE algorithm_runs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for authenticated and anon roles in demo/standard mode
CREATE POLICY "Allow anon read all" ON students FOR SELECT USING (true);
CREATE POLICY "Allow anon insert all" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update all" ON students FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete all" ON students FOR DELETE USING (true);

CREATE POLICY "Allow anon read all" ON exams FOR SELECT USING (true);
CREATE POLICY "Allow anon insert all" ON exams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update all" ON exams FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete all" ON exams FOR DELETE USING (true);

CREATE POLICY "Allow anon read all" ON enrollments FOR SELECT USING (true);
CREATE POLICY "Allow anon insert all" ON enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update all" ON enrollments FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete all" ON enrollments FOR DELETE USING (true);

CREATE POLICY "Allow anon read all" ON rooms FOR SELECT USING (true);
CREATE POLICY "Allow anon insert all" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update all" ON rooms FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete all" ON rooms FOR DELETE USING (true);

CREATE POLICY "Allow anon read all" ON timetables FOR SELECT USING (true);
CREATE POLICY "Allow anon insert all" ON timetables FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update all" ON timetables FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete all" ON timetables FOR DELETE USING (true);

CREATE POLICY "Allow anon read all" ON timetable_assignments FOR SELECT USING (true);
CREATE POLICY "Allow anon insert all" ON timetable_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update all" ON timetable_assignments FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete all" ON timetable_assignments FOR DELETE USING (true);

CREATE POLICY "Allow anon read all" ON seating_allocations FOR SELECT USING (true);
CREATE POLICY "Allow anon insert all" ON seating_allocations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update all" ON seating_allocations FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete all" ON seating_allocations FOR DELETE USING (true);

CREATE POLICY "Allow anon read all" ON algorithm_runs FOR SELECT USING (true);
CREATE POLICY "Allow anon insert all" ON algorithm_runs FOR INSERT WITH CHECK (true);
