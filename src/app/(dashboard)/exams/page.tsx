"use client";

import { useState, useMemo } from "react";
import { useData } from "@/components/providers/data-provider";
import { Exam, ExamFormData } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { downloadCSV } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  BookOpen, Plus, Download, Trash2, Edit2, Users,
  Filter, Clock, Calendar, Check
} from "lucide-react";

export default function ExamsPage() {
  const {
    exams,
    students,
    enrollments,
    addExam,
    updateExam,
    deleteExam
  } = useData();

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedSem, setSelectedSem] = useState("ALL");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [enrolledStudentsExam, setEnrolledStudentsExam] = useState<Exam | null>(null);

  const [formData, setFormData] = useState<ExamFormData>({
    exam_code: "",
    subject_name: "",
    department: "CSE",
    semester: 5,
    duration_minutes: 180,
    exam_date: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const departments = useMemo(() => {
    const set = new Set(exams.map((e) => e.department));
    return ["ALL", ...Array.from(set)];
  }, [exams]);

  const semesters = useMemo(() => {
    const set = new Set(exams.map((e) => e.semester.toString()));
    return ["ALL", ...Array.from(set).sort()];
  }, [exams]);

  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const matchesSearch =
        e.exam_code.toLowerCase().includes(search.toLowerCase()) ||
        e.subject_name.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase());

      const matchesDept = selectedDept === "ALL" || e.department === selectedDept;
      const matchesSem = selectedSem === "ALL" || e.semester.toString() === selectedSem;

      return matchesSearch && matchesDept && matchesSem;
    });
  }, [exams, search, selectedDept, selectedSem]);

  const getExamStudents = (examId: string) => {
    const examEnrollments = enrollments.filter((e) => e.exam_id === examId);
    return examEnrollments
      .map((e) => students.find((s) => s.id === e.student_id))
      .filter((s): s is typeof students[0] => !!s);
  };

  const handleOpenAdd = () => {
    setEditingExam(null);
    setFormData({
      exam_code: "",
      subject_name: "",
      department: "CSE",
      semester: 5,
      duration_minutes: 180,
      exam_date: "",
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      exam_code: exam.exam_code,
      subject_name: exam.subject_name,
      department: exam.department,
      semester: exam.semester,
      duration_minutes: exam.duration_minutes,
      exam_date: exam.exam_date || "",
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.exam_code.trim()) errors.exam_code = "Subject/Exam code is required";
    if (!formData.subject_name.trim()) errors.subject_name = "Subject title is required";
    if (formData.duration_minutes <= 0) errors.duration_minutes = "Duration must be positive";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingExam) {
      const res = updateExam(editingExam.id, formData);
      if (res) setIsFormOpen(false);
    } else {
      const res = addExam(formData);
      if (res) setIsFormOpen(false);
    }
  };

  const handleExportCSV = () => {
    if (exams.length === 0) {
      toast.error("No examinations to export");
      return;
    }
    const headers = ["Subject Code", "Subject Name", "Department", "Semester", "Duration (mins)", "Enrolled Students Count"];
    const rows = exams.map((e) => [
      e.exam_code,
      `"${e.subject_name}"`,
      e.department,
      e.semester,
      e.duration_minutes,
      getExamStudents(e.id).length,
    ]);
    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(csvString, `examgraph_exams_${new Date().toISOString().split("T")[0]}.csv`);
    toast.success("Examinations CSV exported");
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <SearchInput
            placeholder="Search by subject code, title, or department..."
            value={search}
            onChange={setSearch}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button size="sm" onClick={handleOpenAdd} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add Examination
          </Button>
        </div>
      </div>

      {/* Filter Chips / Bar */}
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
          Showing {filteredExams.length} of {exams.length} examinations
        </div>
      </div>

      {/* Exams Data Table */}
      {filteredExams.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Examinations Found"
          description={
            exams.length === 0
              ? "No examination subjects have been defined yet."
              : "No examinations match the active filter criteria."
          }
          action={
            exams.length === 0 ? (
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add First Examination
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Code</TableHead>
                <TableHead>Subject Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Enrolled Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExams.map((exam) => {
                const enrolled = getExamStudents(exam.id);
                return (
                  <TableRow key={exam.id}>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      <Badge variant="outline">{exam.exam_code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {exam.subject_name}
                    </TableCell>
                    <TableCell className="text-xs">
                      {exam.department}
                    </TableCell>
                    <TableCell className="text-xs">
                      Semester {exam.semester}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{exam.duration_minutes} min</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setEnrolledStudentsExam(exam)}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>{enrolled.length} Students</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(exam)}
                          title="Edit Exam"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(exam)}
                          title="Delete Exam"
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

      {/* Add / Edit Exam Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingExam ? "Edit Examination" : "Add New Examination Subject"}
        description={
          editingExam
            ? "Update subject details, department, or scheduling parameters."
            : "Define an examination paper. This represents a vertex in the conflict graph."
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Subject / Exam Code"
              placeholder="e.g. CS501"
              value={formData.exam_code}
              onChange={(e) => setFormData({ ...formData, exam_code: e.target.value })}
              error={formErrors.exam_code}
              required
            />

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
          </div>

          <Input
            label="Subject Title"
            placeholder="e.g. Analysis & Design of Algorithms"
            value={formData.subject_name}
            onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
            error={formErrors.subject_name}
            required
          />

          <div className="grid grid-cols-2 gap-3">
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
              label="Duration (minutes)"
              type="number"
              min={15}
              max={360}
              value={formData.duration_minutes.toString()}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 180 })}
              error={formErrors.duration_minutes}
              required
            />
          </div>

          <Input
            label="Optional Target Date"
            type="date"
            value={formData.exam_date || ""}
            onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingExam ? "Save Changes" : "Create Examination"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Examination"
        description={`Are you sure you want to delete ${deleteTarget?.exam_code} - ${deleteTarget?.subject_name}? All associated enrollments will be removed and current timetables invalidated.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            deleteExam(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />

      {/* Enrolled Students Modal */}
      <Dialog
        open={!!enrolledStudentsExam}
        onOpenChange={(open) => !open && setEnrolledStudentsExam(null)}
        title={`Enrolled Students: ${enrolledStudentsExam?.exam_code}`}
        description={`${enrolledStudentsExam?.subject_name} (${getExamStudents(enrolledStudentsExam?.id || "").length} total registered students)`}
      >
        <div className="space-y-3 pt-2">
          {enrolledStudentsExam && getExamStudents(enrolledStudentsExam.id).length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No students are currently enrolled in this examination.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {enrolledStudentsExam &&
                getExamStudents(enrolledStudentsExam.id).map((student) => (
                  <div
                    key={student.id}
                    className="p-2.5 rounded-lg border border-border bg-muted/30 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{student.full_name}</span>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {student.enrollment_number} | {student.email}
                      </p>
                    </div>
                    <Badge variant="outline">{student.department} - Sem {student.semester}</Badge>
                  </div>
                ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setEnrolledStudentsExam(null)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
