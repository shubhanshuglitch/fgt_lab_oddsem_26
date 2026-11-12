"use client";

import { useState, useMemo } from "react";
import { useData } from "@/components/providers/data-provider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getColorForSlot, getTimeSlotLabel } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Armchair, Building2, Users, Search, Filter, AlertTriangle,
  CheckCircle2, RefreshCw, Calendar, Sparkles, UserCheck
} from "lucide-react";

export default function SeatingAllocationPage() {
  const {
    students,
    exams,
    rooms,
    currentTimetable,
    timetableAssignments,
    seatingAllocations,
    lastSeatingResult,
    generateSeating,
    isLoading
  } = useData();

  // Filters
  const [selectedSlot, setSelectedSlot] = useState<number | "ALL">("ALL");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("ALL");
  const [selectedExamId, setSelectedExamId] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");

  // Instant Student Search Lookup
  const [studentSearch, setStudentSearch] = useState("");

  const hasTimetable = currentTimetable && timetableAssignments.length > 0;
  const hasAllocations = seatingAllocations.length > 0;

  // Available distinct slots in current timetable
  const slots = useMemo(() => {
    const set = new Set(timetableAssignments.map((a) => a.time_slot));
    return Array.from(set).sort((a, b) => a - b);
  }, [timetableAssignments]);

  // Handle Generate / Regenerate Seating
  const handleRegenerateSeating = async () => {
    if (!currentTimetable) {
      toast.error("Please generate and apply a timetable first");
      return;
    }
    await generateSeating(currentTimetable.id);
  };

  // Enriched Seating Allocation List
  const enrichedAllocations = useMemo(() => {
    return seatingAllocations.map((alloc) => {
      const student = students.find((s) => s.id === alloc.student_id);
      const room = rooms.find((r) => r.id === alloc.room_id);
      const exam = exams.find((e) => e.id === alloc.exam_id);
      return {
        ...alloc,
        student,
        room,
        exam,
      };
    });
  }, [seatingAllocations, students, rooms, exams]);

  // Instant Student Search Lookup Results
  const studentSearchResult = useMemo(() => {
    if (!studentSearch.trim()) return null;
    const q = studentSearch.toLowerCase();
    const matches = enrichedAllocations.filter((a) => {
      const name = a.student?.full_name.toLowerCase() || "";
      const roll = a.student?.enrollment_number.toLowerCase() || "";
      const email = a.student?.email.toLowerCase() || "";
      return name.includes(q) || roll.includes(q) || email.includes(q);
    });
    return matches;
  }, [enrichedAllocations, studentSearch]);

  // Filtered Seating Records for Table
  const filteredAllocations = useMemo(() => {
    return enrichedAllocations.filter((item) => {
      const matchesSlot = selectedSlot === "ALL" || item.time_slot === selectedSlot;
      const matchesRoom = selectedRoomId === "ALL" || item.room_id === selectedRoomId;
      const matchesExam = selectedExamId === "ALL" || item.exam_id === selectedExamId;
      const matchesDept = selectedDept === "ALL" || item.student?.department === selectedDept;

      return matchesSlot && matchesRoom && matchesExam && matchesDept;
    });
  }, [enrichedAllocations, selectedSlot, selectedRoomId, selectedExamId, selectedDept]);

  // Room Utilization Overview for the selected slot (or overall)
  const roomUtilizationCards = useMemo(() => {
    if (!lastSeatingResult) return [];
    if (selectedSlot === "ALL") {
      // aggregate across slots
      return lastSeatingResult.slotAllocations.flatMap((slot) =>
        slot.rooms.map((r) => ({ ...r, timeSlot: slot.timeSlot }))
      );
    } else {
      const slotAlloc = lastSeatingResult.slotAllocations.find(
        (s) => s.timeSlot === selectedSlot
      );
      return slotAlloc ? slotAlloc.rooms.map((r) => ({ ...r, timeSlot: selectedSlot })) : [];
    }
  }, [lastSeatingResult, selectedSlot]);

  if (!hasTimetable) {
    return (
      <EmptyState
        icon={Calendar}
        title="Timetable Required"
        description="Seating allocation uses Bin Packing on top of an active timetable. Generate and apply a timetable first."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action & Warning Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">Room-Wise Bin Packing Allocation</h2>
            <Badge variant="success" className="text-xs">
              First-Fit Decreasing (FFD)
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Students are grouped by examination and assigned sequentially to available halls to minimize hall fragmentation.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleRegenerateSeating}
          disabled={isLoading}
          className="gap-1.5 text-xs font-semibold shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Recalculate Seating
        </Button>
      </div>

      {/* Instant Student Locator Search Box */}
      <Card className="border-primary/30 bg-primary/5 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Instant Student Desk Finder</h3>
              <p className="text-xs text-muted-foreground">
                Search student enrollment number or name to immediately find their hall, seat number, and time slot.
              </p>
            </div>
          </div>

          <div className="w-full md:w-80">
            <SearchInput
              placeholder="Search by student name or roll no..."
              value={studentSearch}
              onChange={setStudentSearch}
              className="w-full"
            />
          </div>
        </div>

        {/* Student Finder Results */}
        {studentSearchResult && (
          <div className="mt-4 pt-3 border-t border-border/60">
            {studentSearchResult.length === 0 ? (
              <p className="text-xs text-muted-foreground py-1">
                No examination seating found matching &quot;{studentSearch}&quot;.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  Found {studentSearchResult.length} examination seating record(s):
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {studentSearchResult.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-border bg-background shadow-xs text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{item.student?.full_name}</span>
                        <Badge variant="outline" className="font-mono">{item.student?.enrollment_number}</Badge>
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        Subject: <span className="font-medium text-foreground">{item.exam?.exam_code} - {item.exam?.subject_name}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                        <span className="font-medium text-primary">
                          {getTimeSlotLabel(item.time_slot)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="gap-1 font-semibold">
                            <Building2 className="h-3 w-3" />
                            {item.room?.room_name}
                          </Badge>
                          <Badge className="bg-primary text-primary-foreground font-mono font-bold">
                            Seat #{item.seat_number}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Room Occupancy Cards in Selected Slot */}
      {roomUtilizationCards.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Room Capacity & Occupancy Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {roomUtilizationCards.map((rc, idx) => (
              <Card key={`${rc.room.id}_${rc.timeSlot}_${idx}`} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">{rc.room.room_name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {getTimeSlotLabel(rc.timeSlot)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Occupied:</span>
                    <span className="font-semibold text-foreground">
                      {rc.occupiedSeats} / {rc.room.capacity} seats ({Math.round(rc.utilizationPercent)}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        rc.utilizationPercent > 90
                          ? "bg-amber-500"
                          : rc.utilizationPercent > 0
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/30"
                      }`}
                      style={{ width: `${Math.min(100, rc.utilizationPercent)}%` }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Remaining: {rc.remainingCapacity} seats free
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg text-xs flex-wrap">
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Time Slot:</span>
          <Select
            value={selectedSlot.toString()}
            onChange={(e) => setSelectedSlot(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))}
            className="h-8 text-xs py-1"
          >
            <option value="ALL">All Slots</option>
            {slots.map((s) => (
              <option key={s} value={s}>{getTimeSlotLabel(s)}</option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Room:</span>
          <Select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="h-8 text-xs py-1"
          >
            <option value="ALL">All Rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.room_name} ({r.capacity} seats)</option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Exam:</span>
          <Select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="h-8 text-xs py-1"
          >
            <option value="ALL">All Examinations</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.exam_code} - {ex.subject_name}</option>
            ))}
          </Select>
        </div>

        {(selectedSlot !== "ALL" || selectedRoomId !== "ALL" || selectedExamId !== "ALL" || selectedDept !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedSlot("ALL"); setSelectedRoomId("ALL"); setSelectedExamId("ALL"); setSelectedDept("ALL"); }}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset Filters
          </Button>
        )}

        <div className="ml-auto text-muted-foreground font-medium">
          Showing {filteredAllocations.length} allocated seats
        </div>
      </div>

      {/* Detailed Seating Table */}
      {filteredAllocations.length === 0 ? (
        <EmptyState
          icon={Armchair}
          title="No Seating Allocations"
          description={
            hasAllocations
              ? "No seating allocations match the active filters."
              : "Seating plan has not been generated for the active timetable. Click 'Recalculate Seating' above."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time Slot</TableHead>
                <TableHead>Examination Room</TableHead>
                <TableHead>Seat No.</TableHead>
                <TableHead>Enrollment No.</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Examination Paper</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAllocations.map((alloc) => (
                <TableRow key={alloc.id}>
                  <TableCell>
                    <Badge
                      className="text-white text-[10px]"
                      style={{ backgroundColor: getColorForSlot(alloc.time_slot) }}
                    >
                      {getTimeSlotLabel(alloc.time_slot)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{alloc.room?.room_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono font-bold text-xs">
                      Seat #{alloc.seat_number}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    {alloc.student?.enrollment_number}
                  </TableCell>
                  <TableCell className="font-medium text-xs text-foreground">
                    {alloc.student?.full_name}
                  </TableCell>
                  <TableCell className="text-xs">
                    {alloc.student?.department} - Sem {alloc.student?.semester}
                  </TableCell>
                  <TableCell className="text-xs text-foreground font-medium">
                    <span className="font-mono font-bold mr-1">{alloc.exam?.exam_code}</span>
                    <span className="text-muted-foreground">({alloc.exam?.subject_name})</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

