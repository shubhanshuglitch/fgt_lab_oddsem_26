"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "@/components/providers/theme-provider";
import { useData } from "@/components/providers/data-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sun, Moon, Laptop, RefreshCw, Database,
  Sparkles, CheckCircle2, AlertTriangle, AlertCircle
} from "lucide-react";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "System metrics and examination scheduling overview" },
  "/students": { title: "Students", subtitle: "Manage registered students, batches, and enrollments" },
  "/exams": { title: "Subjects / Exams", subtitle: "Define examination courses, schedules, and duration" },
  "/enrollments": { title: "Enrollments", subtitle: "Map student course registrations and detect overlaps" },
  "/rooms": { title: "Examination Rooms", subtitle: "Configure hall capacity and availability status" },
  "/graph": { title: "Conflict Graph", subtitle: "Graph theory representation and Cytoscape visualization" },
  "/timetable": { title: "Timetable Generator", subtitle: "Greedy & DSATUR graph coloring algorithms" },
  "/seating": { title: "Seating Allocation", subtitle: "Bin packing room-wise seating plan generation" },
  "/reports": { title: "Reports & Exports", subtitle: "Download room seating charts and algorithm analysis PDFs" },
  "/settings": { title: "Settings", subtitle: "Data management, demo datasets, and algorithm configuration" },
};

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const {
    students,
    exams,
    rooms,
    currentTimetable,
    recalculateAll,
    loadDemoData,
    isLoading
  } = useData();

  const currentMeta = pageTitles[pathname] || {
    title: "Exam Timetabling",
    subtitle: "Graph Coloring & Bin Packing System",
  };

  const hasData = students.length > 0 && exams.length > 0;
  const isTimetableValid = currentTimetable && currentTimetable.is_valid && currentTimetable.is_current;

  return (
    <header className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border">
      {/* Title & Subtitle */}
      <div className="pl-10 lg:pl-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-foreground">{currentMeta.title}</h1>
          {hasData ? (
            isTimetableValid ? (
              <Badge variant="success" className="gap-1 hidden sm:inline-flex text-[11px]">
                <CheckCircle2 className="h-3 w-3" />
                Schedule Active ({currentTimetable.num_slots} Slots)
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1 hidden sm:inline-flex text-[11px]">
                <AlertTriangle className="h-3 w-3" />
                Recalculation Required
              </Badge>
            )
          ) : (
            <Badge variant="destructive" className="gap-1 hidden sm:inline-flex text-[11px]">
              <AlertCircle className="h-3 w-3" />
              No Data Loaded
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{currentMeta.subtitle}</p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {!hasData && (
          <Button
            size="sm"
            variant="outline"
            onClick={loadDemoData}
            className="text-xs gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/5"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Load Demo Data
          </Button>
        )}

        {hasData && (
          <Button
            size="sm"
            variant="default"
            disabled={isLoading || exams.length === 0}
            onClick={recalculateAll}
            className="text-xs gap-1.5 font-medium shadow-sm transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Recalculate Timetable
          </Button>
        )}

        {/* Theme Switcher Toggle */}
        <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40">
          <button
            onClick={() => setTheme("light")}
            className={`p-1.5 rounded-md transition-all ${
              resolvedTheme === "light" && theme !== "system"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Light Theme"
          >
            <Sun className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`p-1.5 rounded-md transition-all ${
              resolvedTheme === "dark" && theme !== "system"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Dark Theme"
          >
            <Moon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme("system")}
            className={`p-1.5 rounded-md transition-all ${
              theme === "system"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="System Theme"
          >
            <Laptop className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
