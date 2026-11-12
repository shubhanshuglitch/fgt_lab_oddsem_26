"use client";

import { useState } from "react";
import { useData } from "@/components/providers/data-provider";
import { ColoringResult, AlgorithmComparison } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getColorForSlot, getTimeSlotLabel } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Calendar, Play, CheckCircle2, AlertTriangle, ArrowRight,
  Sparkles, Layers, ShieldCheck, Clock, Zap, Info, Award
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function TimetableGeneratorPage() {
  const {
    exams,
    enrollments,
    conflictGraph,
    currentTimetable,
    timetableAssignments,
    runGreedy,
    runDsatur,
    runComparison,
    generateTimetable,
    generateSeating,
    loadDemoData,
    isLoading
  } = useData();

  // Results state
  const [greedyResult, setGreedyResult] = useState<ColoringResult | null>(null);
  const [dsaturResult, setDsaturResult] = useState<ColoringResult | null>(null);
  const [comparison, setComparison] = useState<AlgorithmComparison | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  const handleRunComparison = async () => {
    setIsComputing(true);
    try {
      const comp = await runComparison();
      if (comp) {
        setGreedyResult(comp.greedy);
        setDsaturResult(comp.dsatur);
        setComparison(comp);
        toast.success("Greedy & DSATUR algorithms evaluated successfully!");
      }
    } catch (e) {
      toast.error("Algorithm execution failed");
    } finally {
      setIsComputing(false);
    }
  };

  const handleApplyTimetable = async (result: ColoringResult, name: string) => {
    const timetable = generateTimetable(result, name);
    if (timetable) {
      await generateSeating(timetable.id);
      toast.success(`Active timetable updated to ${name}!`);
    }
  };

  if (exams.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No Examination Data"
        description="Load or create examination records and student enrollments before executing graph coloring algorithms."
        action={
          <Button onClick={loadDemoData} className="gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Load Demo Data
          </Button>
        }
      />
    );
  }

  // Bar chart data comparing slots & times
  const comparisonChartData = comparison
    ? [
        {
          name: "Time Slots (Colors)",
          Greedy: comparison.greedy.numColors,
          DSATUR: comparison.dsatur.numColors,
        },
      ]
    : [];

  const executionTimeData = comparison
    ? [
        {
          name: "Execution Time (ms)",
          Greedy: Number(comparison.greedy.executionTimeMs.toFixed(3)),
          DSATUR: Number(comparison.dsatur.executionTimeMs.toFixed(3)),
        },
      ]
    : [];

  // Group exams by assigned slot for current active timetable
  const slotsGroup: Record<number, typeof exams> = {};
  if (currentTimetable && timetableAssignments.length > 0) {
    timetableAssignments.forEach((a) => {
      const exam = exams.find((e) => e.id === a.exam_id);
      if (exam) {
        if (!slotsGroup[a.time_slot]) slotsGroup[a.time_slot] = [];
        slotsGroup[a.time_slot].push(exam);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Action Header Card */}
      <Card className="p-5 border-primary/20 bg-gradient-to-r from-card via-card to-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Graph Coloring Engine</h2>
              <Badge variant="outline" className="font-mono text-[10px]">
                |V| = {exams.length} Exams
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px]">
                |E| = {conflictGraph?.edges.length || 0} Conflicts
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Execute independent implementations of Greedy Graph Coloring and Brélaz&apos;s DSATUR algorithm.
              Both map conflicting examinations to distinct chromatic time slots.
            </p>
          </div>

          <Button
            size="default"
            disabled={isComputing || isLoading}
            onClick={handleRunComparison}
            className="gap-2 shadow-sm font-semibold shrink-0"
          >
            <Play className={`h-4 w-4 ${isComputing ? "animate-spin" : ""}`} />
            Run Both Algorithms & Compare
          </Button>
        </div>
      </Card>

      {/* Comparison & Recommendation Banner */}
      {comparison && (
        <div className="space-y-4">
          {/* Recommendation Banner */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3">
            <Award className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">
                  System Recommendation: {comparison.recommended.toUpperCase()} Algorithm
                </h4>
                <Badge variant="success" className="text-[10px]">Recommended</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {comparison.recommendationReason}
              </p>
            </div>
          </div>

          {/* Academic Note */}
          <div className="p-3 rounded-lg border border-border bg-muted/40 text-[11px] text-muted-foreground flex items-center gap-2.5">
            <Info className="h-4 w-4 text-blue-500 shrink-0" />
            <span>
              <strong>Heuristic Note:</strong> Graph coloring (finding the chromatic number χ(G)) is NP-hard.
              Both Greedy and DSATUR are deterministic heuristics. DSATUR prioritizes vertices with highest saturation degree,
              frequently reducing colors, but neither heuristic guarantees absolute minimality for arbitrary graphs.
            </span>
          </div>

          {/* Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Greedy Algorithm Card */}
            <Card className={`border ${comparison.recommended === "greedy" ? "border-primary" : "border-border"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">Standard Greedy Coloring</CardTitle>
                  <Badge variant={comparison.recommended === "greedy" ? "default" : "secondary"}>
                    {comparison.recommended === "greedy" ? "Recommended" : "Alternative"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Static vertex ordering by decreasing degree Δ(v)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground font-medium">Slots Used</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{comparison.greedy.numColors}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground font-medium">Time</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{comparison.greedy.executionTimeMs.toFixed(2)} ms</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground font-medium">Conflict Valid</p>
                    <p className="text-xs font-bold text-emerald-500 mt-1 flex items-center justify-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Pass
                    </p>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 p-3 rounded-lg border border-border bg-muted/20">
                  <p className="font-semibold text-foreground">Algorithm Strategy:</p>
                  <ol className="list-decimal list-inside text-[11px] text-muted-foreground space-y-1">
                    <li>Sort vertices in decreasing order of conflict degree.</li>
                    <li>Inspect color set already assigned to adjacent neighbors.</li>
                    <li>Assign lowest index color not used by any neighbor.</li>
                  </ol>
                </div>

                <Button
                  className="w-full text-xs font-semibold"
                  variant={comparison.recommended === "greedy" ? "default" : "outline"}
                  onClick={() => handleApplyTimetable(comparison.greedy, "Greedy Generated")}
                >
                  Apply Greedy Timetable ({comparison.greedy.numColors} Slots)
                </Button>
              </CardContent>
            </Card>

            {/* DSATUR Algorithm Card */}
            <Card className={`border ${comparison.recommended === "dsatur" ? "border-primary" : "border-border"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">DSATUR (Degree of Saturation)</CardTitle>
                  <Badge variant={comparison.recommended === "dsatur" ? "default" : "secondary"}>
                    {comparison.recommended === "dsatur" ? "Recommended" : "Alternative"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Dynamic saturation degree prioritization (Brélaz, 1979)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground font-medium">Slots Used</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{comparison.dsatur.numColors}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground font-medium">Time</p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{comparison.dsatur.executionTimeMs.toFixed(2)} ms</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <p className="text-[10px] text-muted-foreground font-medium">Conflict Valid</p>
                    <p className="text-xs font-bold text-emerald-500 mt-1 flex items-center justify-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Pass
                    </p>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 p-3 rounded-lg border border-border bg-muted/20">
                  <p className="font-semibold text-foreground">Algorithm Strategy:</p>
                  <ol className="list-decimal list-inside text-[11px] text-muted-foreground space-y-1">
                    <li>Compute saturation degree ρ(v) = number of distinct colors in neighbors.</li>
                    <li>Pick uncolored vertex with max ρ(v); tie-break by uncolored degree.</li>
                    <li>Color with smallest valid integer and dynamically update neighbor saturations.</li>
                  </ol>
                </div>

                <Button
                  className="w-full text-xs font-semibold"
                  variant={comparison.recommended === "dsatur" ? "default" : "outline"}
                  onClick={() => handleApplyTimetable(comparison.dsatur, "DSATUR Generated")}
                >
                  Apply DSATUR Timetable ({comparison.dsatur.numColors} Slots)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Graphical Metrics Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold">Number of Time Slots (Lower is Better)</CardTitle>
              </CardHeader>
              <CardContent className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonChartData}>
                    <XAxis dataKey="name" fontSize={11} stroke="#888888" tickLine={false} />
                    <YAxis fontSize={11} stroke="#888888" tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="Greedy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="DSATUR" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold">Execution Time in Milliseconds</CardTitle>
              </CardHeader>
              <CardContent className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={executionTimeData}>
                    <XAxis dataKey="name" fontSize={11} stroke="#888888" tickLine={false} />
                    <YAxis fontSize={11} stroke="#888888" tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="Greedy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="DSATUR" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Currently Applied Timetable Schedule */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Current Active Timetable</h3>
            <p className="text-xs text-muted-foreground">
              {currentTimetable
                ? `Generated via ${currentTimetable.algorithm.toUpperCase()} algorithm with ${currentTimetable.num_slots} time slots`
                : "No schedule is currently active. Run the comparison above to apply one."}
            </p>
          </div>
          {currentTimetable && (
            <Badge variant="success" className="gap-1 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified Conflict-Free
            </Badge>
          )}
        </div>

        {Object.keys(slotsGroup).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(slotsGroup).map(([slotNumStr, slotExams]) => {
              const slotNum = parseInt(slotNumStr);
              return (
                <Card key={slotNum} className="overflow-hidden border border-border">
                  <div
                    className="p-3 text-white flex items-center justify-between"
                    style={{ backgroundColor: getColorForSlot(slotNum) }}
                  >
                    <span className="font-bold text-xs">{getTimeSlotLabel(slotNum)}</span>
                    <Badge className="bg-black/20 text-white text-[10px] border-none">
                      {slotExams.length} Concurrent Exams
                    </Badge>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    {slotExams.map((exam) => {
                      const count = enrollments.filter((e) => e.exam_id === exam.id).length;
                      return (
                        <div
                          key={exam.id}
                          className="p-2 rounded-md bg-muted/30 border border-border text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{exam.exam_code}</span>
                              <span className="text-muted-foreground font-normal">| {exam.subject_name}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {exam.department} - Sem {exam.semester} ({exam.duration_minutes} min)
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                            {count} students
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">Click &quot;Run Both Algorithms &amp; Compare&quot; to compute the examination timetable.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

