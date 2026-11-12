"use client";

import { useState, useMemo } from "react";
import { useData } from "@/components/providers/data-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { downloadCSV, parseCSV } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  ClipboardList, Plus, Upload, Download, Trash2,
  Filter, CheckCircle2, AlertCircle, ArrowRight
} from "lucide-react";

export default function EnrollmentsPage() {
  const {
    students,
    exams,
    enrollments,
    addEnrollment,
    deleteEnrollment,
    bulkAddEnrollments
  } = useData();

  const [search, setSearch] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("ALL");
  const [selectedStudentId, setSelectedStudentId] = useState("ALL");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // New enrollment form inputs
  const [formStudentId, setFormStudentId] = useState("");
  const [formExamId, setFormExamId] = useState("");

  // Bulk CSV text
  const [bulkCsvText, setBulkCsvText] = useState("");

  // Enriched list
  const enrichedEnrollments = useMemo(() => {
    return enrollments.map((e) => {
      const student = students.find((s) => s.id === e.student_id);
      const exam = exams.find((x) => x.id === e.exam_id);
      return {
        ...e,
        student,
        exam,
      };
    });
  }, [enrollments, students, exams]);

  // Filtered
  const filteredEnrollments = useMemo(() => {
    return enrichedEnrollments.filter((item) => {
      const studentName = item.student?.full_name.toLowerCase() || "";
      const enrollmentNo = item.student?.enrollment_number.toLowerCase() || "";
      const examCode = item.exam?.exam_code.toLowerCase() || "";
      const examName = item.exam?.subject_name.toLowerCase() || "";
      const q = search.toLowerCase();

      const matchesSearch =
        studentName.includes(q) ||
        enrollmentNo.includes(q) ||
        examCode.includes(q) ||
        examName.includes(q);

      const matchesExam = selectedExamId === "ALL" || item.exam_id === selectedExamId;
      const matchesStudent = selectedStudentId === "ALL" || item.student_id === selectedStudentId;

      return matchesSearch && matchesExam && matchesStudent;
    });
  }, [enrichedEnrollments, search, selectedExamId, selectedStudentId]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formExamId) {
      toast.error("Please select both a student and an exam");
      return;
    }
    const res = addEnrollment(formStudentId, formExamId);
    if (res) {
      setIsAddOpen(false);
      setFormStudentId("");
      setFormExamId("");
    }
  };

  const handleBulkImport = () => {
    if (!bulkCsvText.trim()) {
      toast.error("Please provide CSV content");
      return;
    }
    const rows = parseCSV(bulkCsvText);
    const pairs: { studentId: string; examId: string }[] = [];

    // format: enrollment_number,exam_code
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2) continue;
      // Skip header
      if (i === 0 && row[0].toLowerCase().includes("enrollment")) continue;

      const student = students.find((s) => s.enrollment_number.toLowerCase() === row[0].toLowerCase());
      const exam = exams.find((x) => x.exam_code.toLowerCase() === row[1].toLowerCase());

      if (student && exam) {
        pairs.push({ studentId: student.id, examId: exam.id });
      }
    }

    if (pairs.length === 0) {
      toast.error("No valid student/exam matches found in CSV");
      return;
    }

    const { success, failed } = bulkAddEnrollments(pairs);
    toast.success(`Enrolled ${success} students (${failed} duplicates skipped)`);
    setIsBulkOpen(false);
    setBulkCsvText("");
  };

  const handleExportCSV = () => {
    if (enrollments.length === 0) {
      toast.error("No enrollments to export");
      return;
    }
    const headers = ["Enrollment Number", "Student Name", "Subject Code", "Subject Name"];
    const rows = enrichedEnrollments.map((e) => [
      e.student?.enrollment_number || "",
      `"${e.student?.full_name || ""}"`,
      e.exam?.exam_code || "",
      `"${e.exam?.subject_name || ""}"`,
    ]);
    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(csvString, `examgraph_enrollments_${new Date().toISOString().split("T")[0]}.csv`);
    toast.success("Enrollments exported");
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <SearchInput
            placeholder="Search by student name, roll number, or subject..."
            value={search}
            onChange={setSearch}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsBulkOpen(true)} className="gap-1.5 text-xs">
            <Upload className="h-3.5 w-3.5" />
            Bulk CSV Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setIsAddOpen(true)} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New Enrollment
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg text-xs flex-wrap">
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <Filter className="h-3.5 w-3.5" />
          <span>Filter By:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Examination:</span>
          <Select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="h-8 text-xs py-1"
          >
            <option value="ALL">All Examinations</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.exam_code} - {exam.subject_name}
              </option>
            ))}
          </Select>
        </div>

        {(selectedExamId !== "ALL" || selectedStudentId !== "ALL" || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedExamId("ALL"); setSelectedStudentId("ALL"); setSearch(""); }}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset Filters
          </Button>
        )}

        <div className="ml-auto text-muted-foreground font-medium">
          Showing {filteredEnrollments.length} of {enrollments.length} registrations
        </div>
      </div>

      {/* Enrollments Table */}
      {filteredEnrollments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No Enrollments Found"
          description={
            enrollments.length === 0
              ? "No course registrations have been made. Register students to examinations to build the conflict graph."
              : "No enrollments match the filter criteria."
          }
          action={
            enrollments.length === 0 ? (
              <Button size="sm" onClick={() => setIsAddOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Assign First Enrollment
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
                <TableHead>Student Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Subject Code</TableHead>
                <TableHead>Subject Title</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    {item.student?.enrollment_number || "Unknown"}
                  </TableCell>
                  <TableCell className="font-medium text-foreground text-xs">
                    {item.student?.full_name || "Unknown"}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline">{item.student?.department || "-"}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold">
                    <Badge variant="secondary">{item.exam?.exam_code || "Unknown"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-foreground font-medium">
                    {item.exam?.subject_name || "Unknown"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTargetId(item.id)}
                      title="Remove Registration"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Single Enrollment Dialog */}
      <Dialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Assign Student to Examination"
        description="Select a student and the corresponding examination subject. Duplicate registrations are automatically rejected."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
          <Select
            label="Select Student"
            value={formStudentId}
            onChange={(e) => setFormStudentId(e.target.value)}
            required
          >
            <option value="">-- Choose Student --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.enrollment_number} - {s.full_name} ({s.department} Sem {s.semester})
              </option>
            ))}
          </Select>

          <Select
            label="Select Examination Subject"
            value={formExamId}
            onChange={(e) => setFormExamId(e.target.value)}
            required
          >
            <option value="">-- Choose Examination --</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.exam_code} - {exam.subject_name} ({exam.department} Sem {exam.semester})
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Register Enrollment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog
        open={isBulkOpen}
        onOpenChange={setIsBulkOpen}
        title="Bulk Enroll Students via CSV"
        description="Map students to examinations in bulk. Format: enrollment_number,exam_code"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-muted/40 rounded-md border border-border text-[11px] text-muted-foreground font-mono">
            enrollment_number,exam_code<br />
            21103001,CS501<br />
            21103001,CS502<br />
            21104001,EC501
          </div>

          <textarea
            value={bulkCsvText}
            onChange={(e) => setBulkCsvText(e.target.value)}
            placeholder="enrollment_number,exam_code..."
            rows={8}
            className="w-full text-xs font-mono p-3 rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setIsBulkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkImport}>
              Process Registrations
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="Remove Enrollment"
        description="Are you sure you want to remove this examination enrollment? Doing so alters the conflict graph and invalidates existing schedules."
        confirmText="Remove"
        variant="destructive"
        onConfirm={() => {
          if (deleteTargetId) {
            deleteEnrollment(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
      />
    </div>
  );
}
