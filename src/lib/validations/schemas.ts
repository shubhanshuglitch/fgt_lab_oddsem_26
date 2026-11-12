import { z } from "zod";

export const studentSchema = z.object({
  enrollment_number: z
    .string()
    .min(3, "Enrollment number must be at least 3 characters")
    .max(20, "Enrollment number cannot exceed 20 characters")
    .regex(/^[A-Z0-9_-]+$/i, "Enrollment number can only contain alphanumeric characters, hyphens, and underscores"),
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  email: z
    .string()
    .email("Invalid email address"),
  department: z
    .string()
    .min(2, "Department is required"),
  semester: z
    .number()
    .int("Semester must be an integer")
    .min(1, "Semester must be between 1 and 8")
    .max(8, "Semester must be between 1 and 8"),
  section: z
    .string()
    .min(1, "Section is required")
    .max(5, "Section cannot exceed 5 characters"),
});

export const examSchema = z.object({
  exam_code: z
    .string()
    .min(2, "Exam code must be at least 2 characters")
    .max(20, "Exam code cannot exceed 20 characters")
    .regex(/^[A-Z0-9_-]+$/i, "Exam code can only contain alphanumeric characters, hyphens, and underscores"),
  subject_name: z
    .string()
    .min(3, "Subject name must be at least 3 characters")
    .max(100, "Subject name cannot exceed 100 characters"),
  department: z
    .string()
    .min(2, "Department is required"),
  semester: z
    .number()
    .int("Semester must be an integer")
    .min(1, "Semester must be between 1 and 8")
    .max(8, "Semester must be between 1 and 8"),
  duration_minutes: z
    .number()
    .int("Duration must be an integer")
    .min(15, "Duration must be at least 15 minutes")
    .max(360, "Duration cannot exceed 360 minutes"),
  exam_date: z.string().optional(),
});

export const roomSchema = z.object({
  room_name: z
    .string()
    .min(2, "Room name must be at least 2 characters")
    .max(50, "Room name cannot exceed 50 characters"),
  building: z
    .string()
    .min(1, "Building is required")
    .max(50, "Building cannot exceed 50 characters"),
  floor: z
    .number()
    .int("Floor must be an integer")
    .min(-2, "Floor cannot be lower than basement 2")
    .max(20, "Floor cannot exceed 20"),
  capacity: z
    .number()
    .int("Capacity must be an integer")
    .min(1, "Room capacity must be a positive number (at least 1 seat)"),
  room_type: z.enum(["lecture_hall", "lab", "seminar_room", "auditorium"], {
    message: "Invalid room type",
  }),
  is_available: z.boolean().default(true),
});

export const enrollmentSchema = z.object({
  student_id: z.string().uuid("Invalid student ID").or(z.string().min(1, "Student is required")),
  exam_id: z.string().uuid("Invalid exam ID").or(z.string().min(1, "Exam is required")),
});
