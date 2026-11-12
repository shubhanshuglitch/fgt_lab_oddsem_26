"use client";

import { useData } from "@/components/providers/data-provider";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import {
  Users, BookOpen, Building2, ClipboardList, Clock,
  AlertTriangle, Percent, Calendar, Sparkles, Plus,
  ArrowRight, ShieldCheck, GitBranch, Armchair
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function DashboardPage() {
  const {
    students,
    exams,
    rooms,
    enrollments,
    currentTimetable,
    graphStats,
    lastSeatingResult,
    loadDemoData,
    recalculateAll,
    isLoading
  } = useData();

  const hasData = students.length > 0;

  // Chart data: Enrollments per exam
  const examEnrollmentData = exams.map((exam) => {
    const count = enrollments.filter((e) => e.exam_id === exam.id).length;
    return {
      code: exam.exam_code,
      name: exam.subject_name,
      students: count,
    };
  });

  // Chart data: Room capacity distribution
  const roomData = rooms.map((room) => ({
    name: room.room_name,
    capacity: room.capacity,
    available: room.is_available,
  }));

  // Department distribution
  const deptCount: Record<string, number> = {};
  students.forEach((s) => {
    deptCount[s.department] = (deptCount[s.department] || 0) + 1;
  });
  const deptData = Object.entries(deptCount).map(([name, value]) => ({ name, value }));

  // Utilization calculation
  const totalCapacity = rooms
    .filter((r) => r.is_available)
    .reduce((acc, r) => acc + r.capacity, 0);

  const roomUtilization = lastSeatingResult?.overallUtilization
    ? Math.round(lastSeatingResult.overallUtilization)
    : 0;

  if (!hasData) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No Examination Data Loaded"
        description="Get started by loading the realistic university demo dataset or manually entering students, subjects, and examination rooms."
        action={
          <div className="flex gap-3">
            <Button onClick={loadDemoData} className="gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Load University Demo Data
            </Button>
            <Link href="/students">
              <Button variant="outline">Add Student Manually</Button>
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner if timetable needs recalculation */}
      {(!currentTimetable || !currentTimetable.is_valid) && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">Timetable Recalculation Recommended</h4>
              <p className="text-xs text-muted-foreground">
                Underlying student or exam configurations were updated. Re-run graph coloring to synchronize conflict-free slots.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={recalculateAll} disabled={isLoading} className="gap-2 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            Generate New Schedule
          </Button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Students"
          value={students.length}
          icon={Users}
          description="Across 3 academic disciplines"
        />
        <StatCard
          title="Scheduled Examinations"
          value={exams.length}
          icon={BookOpen}
          description="Graph vertices under optimization"
        />
        <StatCard
          title="Examination Rooms"
          value={rooms.length}
          icon={Building2}
          description={`Total capacity: ${totalCapacity} seats`}
        />
        <StatCard
          title="Total Enrollments"
          value={enrollments.length}
          icon={ClipboardList}
          description="Student-exam registrations"
        />
      </div>

      {/* Secondary Graph & Scheduling KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Conflict Edges"
          value={graphStats ? graphStats.totalEdges : 0}
          icon={GitBranch}
          description="Pairs of exams sharing common students"
        />
        <StatCard
          title="Time Slots Required"
          value={currentTimetable ? currentTimetable.num_slots : "N/A"}
          icon={Clock}
          description={
            currentTimetable
              ? `Optimal chromatic number via ${currentTimetable.algorithm.toUpperCase()}`
              : "Generate schedule to compute"
          }
        />
        <StatCard
          title="Room Utilization"
          value={`${roomUtilization}%`}
          icon={Percent}
          description="Bin-packing occupancy efficiency"
        />
        <StatCard
          title="Schedule Status"
          value={currentTimetable?.is_valid ? "Conflict-Free" : "Unverified"}
          icon={ShieldCheck}
          description={
            currentTimetable?.is_valid
              ? "All graph coloring constraints met"
              : "Recalculation needed"
          }
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam Enrollment Load */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Student Enrollments per Examination</CardTitle>
            <CardDescription className="text-xs">
              Directly influences vertex degree in the conflict graph
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={examEnrollmentData}>
                <XAxis dataKey="code" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border p-2.5 rounded-lg shadow-md text-xs">
                          <p className="font-semibold text-foreground">{data.name} ({data.code})</p>
                          <p className="text-muted-foreground mt-1">Enrolled Students: <span className="text-foreground font-medium">{data.students}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Department Breakdown</CardTitle>
            <CardDescription className="text-xs">Student distribution across majors</CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {deptData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="bg-popover border border-border p-2 rounded-lg shadow-md text-xs">
                          <p className="font-semibold text-foreground">{data.name}: {data.value} students</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Room Capacities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Capacity Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Room Capacity & Availability</CardTitle>
            <CardDescription className="text-xs">Capacity used for First-Fit Decreasing bin packing</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomData} layout="vertical">
                <XAxis type="number" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={11} width={120} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border p-2.5 rounded-lg shadow-md text-xs">
                          <p className="font-semibold text-foreground">{data.name}</p>
                          <p className="text-muted-foreground mt-1">Capacity: <span className="text-foreground font-medium">{data.capacity} seats</span></p>
                          <p className="text-muted-foreground">Status: <span className={data.available ? "text-emerald-500 font-medium" : "text-destructive font-medium"}>{data.available ? "Available" : "Unavailable"}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="capacity" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Operations Panel */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Workflow Actions</CardTitle>
            <CardDescription className="text-xs">Direct navigation to core system modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/graph" className="block">
              <div className="p-3 rounded-lg border border-border hover:bg-accent hover:border-primary/40 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-blue-500/10 text-blue-500">
                    <GitBranch className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-foreground">Conflict Graph Visualizer</h5>
                    <p className="text-[11px] text-muted-foreground">Cytoscape interactive network</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>

            <Link href="/timetable" className="block">
              <div className="p-3 rounded-lg border border-border hover:bg-accent hover:border-primary/40 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-foreground">Timetable Generator</h5>
                    <p className="text-[11px] text-muted-foreground">Greedy vs DSATUR comparison</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>

            <Link href="/seating" className="block">
              <div className="p-3 rounded-lg border border-border hover:bg-accent hover:border-primary/40 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-violet-500/10 text-violet-500">
                    <Armchair className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-foreground">Seating Allocation</h5>
                    <p className="text-[11px] text-muted-foreground">Bin packing room layout</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>

            <Link href="/reports" className="block">
              <div className="p-3 rounded-lg border border-border hover:bg-accent hover:border-primary/40 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-amber-500/10 text-amber-500">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-foreground">PDF Reports & Exports</h5>
                    <p className="text-[11px] text-muted-foreground">Individual and Master plans</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
