"use client";

import { useState, useMemo } from "react";
import { useData } from "@/components/providers/data-provider";
import { Student, StudentFormData } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { downloadCSV } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Users, Plus, Upload, Download, Trash2, Edit2, BookOpen,
  Filter, Check, X, AlertCircle
} from "lucide-react";

export default function StudentsPage() {
  const {
    students,
    exams,
    enrollments,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudentsCSV
  } = useData();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedSem, setSelectedSem] = useState("ALL");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [enrolledDetailsStudent, setEnrolledDetailsStudent] = useState<Student | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvContent, setCsvContent] = useState("");

  // Form inputs
  const [formData, setFormData] = useState<StudentFormData>({
    enrollment_number: "",
    full_name: "",
    email: "",
    department: "CSE",
    semester: 5,
    section: "A",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Departments list
  const departments = useMemo(() => {
    const set = new Set(students.map((s) => s.department));
    return ["ALL", ...Array.from(set)];
  }, [students]);

  // Semesters list
  const semesters = useMemo(() => {
    const set = new Set(students.map((s) => s.semester.toString()));
    return ["ALL", ...Array.from(set).sort()];
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.enrollment_number.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());

      const matchesDept = selectedDept === "ALL" || s.department === selectedDept;
      const matchesSem = selectedSem === "ALL" || s.semester.toString() === selectedSem;

      return matchesSearch && matchesDept && matchesSem;
    });
  }, [students, search, selectedDept, selectedSem]);

  // Student's enrolled exams
  const getStudentExams = (studentId: string) => {
    const studentEnrollments = enrollments.filter((e) => e.student_id === studentId);
    return studentEnrollments
      .map((e) => exams.find((x) => x.id === e.exam_id))
      .filter((x): x is typeof exams[0] => !!x);
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      enrollment_number: "",
      full_name: "",
      email: "",
      department: "CSE",
      semester: 5,
      section: "A",
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      enrollment_number: student.enrollment_number,
      full_name: student.full_name,
      email: student.email,
      department: student.department,
      semester: student.semester,
      section: student.section,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.enrollment_number.trim()) {
      errors.enrollment_number = "Enrollment number is required";
    }
    if (!formData.full_name.trim()) {
      errors.full_name = "Full name is required";
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errors.email = "Valid email is required";
    }
    if (!formData.section.trim()) {
      errors.section = "Section is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingStudent) {
      const res = updateStudent(editingStudent.id, formData);
      if (res) setIsFormOpen(false);
    } else {
      const res = addStudent(formData);
      if (res) setIsFormOpen(false);
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.error("No student records to export");
      return;
    }
    const headers = ["Enrollment Number", "Full Name", "Email", "Department", "Semester", "Section", "Enrolled Courses Count"];
    const rows = students.map((s) => [
      s.enrollment_number,
      `"${s.full_name}"`,
      s.email,
      s.department,
      s.semester,
      s.section,
      getStudentExams(s.id).length,
    ]);
    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(csvString, `examgraph_students_${new Date().toISOString().split("T")[0]}.csv`);
    toast.success("CSV export downloaded");
  };

  const handleImportCSVSubmit = () => {
    if (!csvContent.trim()) {
      toast.error("Please provide CSV content");
      return;
    }
    const result = importStudentsCSV(csvContent);
    if (result.success > 0) {
      toast.success(`Successfully imported ${result.success} students`);
      setIsImportOpen(false);
      setCsvContent("");
    } else {
      toast.error(`Import failed: ${result.errors[0] || "Unknown error"}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <SearchInput
            placeholder="Search by name, enrollment, or email..."
            value={search}
            onChange={setSearch}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="gap-1.5 text-xs">
            <Upload className="h-3.5 w-3.5" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button size="sm" onClick={handleOpenAdd} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filter Chips / Selectors */}
      <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg text-xs flex-wrap">
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Department:</span>
          <Select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-8 text-xs py-1"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === "ALL" ? "All Departments" : d}</option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Semester:</span>
          <Select
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
            className="h-8 text-xs py-1"
          >
            {semesters.map((s) => (
              <option key={s} value={s}>{s === "ALL" ? "All Semesters" : `Semester ${s}`}</option>
            ))}
          </Select>
        </div>

        {(selectedDept !== "ALL" || selectedSem !== "ALL" || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedDept("ALL"); setSelectedSem("ALL"); setSearch(""); }}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset Filters
          </Button>
        )}

        <div className="ml-auto text-muted-foreground font-medium">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      </div>

      {/* Students Data Table */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Students Found"
          description={
            students.length === 0
              ? "No student records are currently loaded in the system."
              : "No students match the active search and filter criteria."
          }
          action={
            students.length === 0 ? (
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add First Student
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrollment No.</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Semester / Sec</TableHead>
                <TableHead>Enrolled Exams</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const enrolled = getStudentExams(student.id);
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      {student.enrollment_number}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {student.full_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {student.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.department}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      Sem {student.semester} - {student.section}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setEnrolledDetailsStudent(student)}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{enrolled.length} Exams</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(student)}
                          title="Edit Student"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(student)}
                          title="Delete Student"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add / Edit Student Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingStudent ? "Edit Student Record" : "Register New Student"}
        description={
          editingStudent
            ? "Update existing student credentials and academic assignment."
            : "Enter student details. Enrollment number must be unique."
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <Input
            label="Enrollment Number"
            placeholder="e.g. 21103001"
            value={formData.enrollment_number}
            onChange={(e) => setFormData({ ...formData, enrollment_number: e.target.value })}
            error={formErrors.enrollment_number}
            required
          />

          <Input
            label="Full Name"
            placeholder="e.g. Aarav Sharma"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            error={formErrors.full_name}
            required
          />

          <Input
            label="University Email"
            type="email"
            placeholder="e.g. aarav.sharma@mail.edu"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="ME">ME</option>
              <option value="IT">IT</option>
              <option value="EE">EE</option>
            </Select>

            <Select
              label="Semester"
              value={formData.semester.toString()}
              onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </Select>

            <Input
              label="Section"
              placeholder="e.g. A"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              error={formErrors.section}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingStudent ? "Save Changes" : "Register Student"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Student"
        description={`Are you sure you want to delete ${deleteTarget?.full_name} (${deleteTarget?.enrollment_number})? This will also remove all exam enrollments and invalidate active timetables.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            deleteStudent(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />

      {/* Enrolled Courses Popup Modal */}
      <Dialog
        open={!!enrolledDetailsStudent}
        onOpenChange={(open) => !open && setEnrolledDetailsStudent(null)}
        title={`Enrolled Examinations: ${enrolledDetailsStudent?.full_name}`}
        description={`Enrollment: ${enrolledDetailsStudent?.enrollment_number} | Department: ${enrolledDetailsStudent?.department}`}
      >
        <div className="space-y-3 pt-2">
          {enrolledDetailsStudent && getStudentExams(enrolledDetailsStudent.id).length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              This student has not been assigned to any examinations yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {enrolledDetailsStudent &&
                getStudentExams(enrolledDetailsStudent.id).map((exam) => (
                  <div
                    key={exam.id}
                    className="p-2.5 rounded-lg border border-border bg-muted/30 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{exam.subject_name}</span>
                        <Badge variant="outline" className="font-mono">{exam.exam_code}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Dept: {exam.department} | Duration: {exam.duration_minutes} mins
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setEnrolledDetailsStudent(null)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Bulk CSV Import Modal */}
      <Dialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Bulk Import Students via CSV"
        description="Paste standard CSV text with columns: enrollment_number, full_name, email, department, semester, section"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-muted/40 rounded-md border border-border text-[11px] text-muted-foreground font-mono">
            enrollment_number,full_name,email,department,semester,section<br />
            21103099,Arun Kumar,arun@mail.edu,CSE,5,A
          </div>

          <textarea
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            placeholder="enrollment_number,full_name,email,department,semester,section..."
            rows={8}
            className="w-full text-xs font-mono p-3 rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportCSVSubmit}>
              Parse & Import Records
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

