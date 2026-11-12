"use client";

import { useState } from "react";
import { useData } from "@/components/providers/data-provider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import toast from "react-hot-toast";
import {
  Settings, Database, Sparkles, Trash2, ShieldCheck,
  CheckCircle2, AlertTriangle, GitBranch, Cpu, Server
} from "lucide-react";

export default function SettingsPage() {
  const {
    students,
    exams,
    rooms,
    enrollments,
    loadDemoData,
    clearAllData,
    recalculateAll,
    isLoading
  } = useData();

  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const handleResetToDemo = () => {
    loadDemoData();
    recalculateAll();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-base font-bold text-foreground">System Settings &amp; Data Configuration</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure database operating mode, reset datasets, and verify graph theory computational environment.
        </p>
      </div>

      {/* Database Mode Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Operating Environment</CardTitle>
                <CardDescription className="text-xs">
                  Active storage layer &amp; persistence status
                </CardDescription>
              </div>
            </div>
            <Badge variant="success" className="gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3" />
              In-Memory Demonstration Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <p className="text-muted-foreground">
            The application is operating in a high-performance in-memory singleton architecture with full server-side persistence during execution.
            All CRUD operations, conflict graph construction, graph coloring, and bin-packing calculations operate natively without external API latency.
          </p>

          <div className="p-3 rounded-lg border border-border bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">Students Stored</p>
              <p className="text-base font-bold text-foreground mt-0.5">{students.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Examinations</p>
              <p className="text-base font-bold text-foreground mt-0.5">{exams.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Halls / Rooms</p>
              <p className="text-base font-bold text-foreground mt-0.5">{rooms.length}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Registrations</p>
              <p className="text-base font-bold text-foreground mt-0.5">{enrollments.length}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10 text-xs">
            <div>
              <span className="font-semibold text-foreground">PostgreSQL / Supabase Migration Schema</span>
              <p className="text-[11px] text-muted-foreground">
                Migration files located at <code>supabase/migrations/001_initial_schema.sql</code> and seed at <code>supabase/seed.sql</code>.
              </p>
            </div>
            <Badge variant="outline" className="font-mono">Postgres 15+</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Dataset Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Dataset Actions</CardTitle>
              <CardDescription className="text-xs">
                Populate or purge university academic records
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 flex-wrap gap-3">
            <div>
              <h4 className="text-xs font-bold text-foreground">University Demo Dataset</h4>
              <p className="text-[11px] text-muted-foreground">
                Loads 35 students, 10 examinations, 50+ conflict enrollments, and 6 halls with heterogeneous capacities.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetToDemo}
              disabled={isLoading}
              className="gap-2 text-xs font-semibold border-primary/40 text-primary hover:bg-primary/5"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Reload Demo Dataset
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5 flex-wrap gap-3">
            <div>
              <h4 className="text-xs font-bold text-destructive">Purge All Data</h4>
              <p className="text-[11px] text-muted-foreground">
                Completely removes all students, examinations, rooms, conflict graphs, and generated timetables.
              </p>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setIsClearConfirmOpen(true)}
              className="gap-2 text-xs font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Entire Database
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Configuration Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Graph Theory &amp; Bin Packing Specifications</CardTitle>
              <CardDescription className="text-xs">
                Algorithmic parameters applied during execution
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="p-2.5 rounded-md border border-border flex items-center justify-between">
            <span className="font-medium text-foreground">Graph Representation</span>
            <Badge variant="outline" className="font-mono">Undirected Graph G = (V, E)</Badge>
          </div>
          <div className="p-2.5 rounded-md border border-border flex items-center justify-between">
            <span className="font-medium text-foreground">Greedy Vertex Ordering</span>
            <Badge variant="outline" className="font-mono">Decreasing Degree Δ(v) Static Sort</Badge>
          </div>
          <div className="p-2.5 rounded-md border border-border flex items-center justify-between">
            <span className="font-medium text-foreground">DSATUR Tie-Breaking</span>
            <Badge variant="outline" className="font-mono">Max Saturation Degree → Degree in Uncolored → ID</Badge>
          </div>
          <div className="p-2.5 rounded-md border border-border flex items-center justify-between">
            <span className="font-medium text-foreground">Room Allocation Strategy</span>
            <Badge variant="outline" className="font-mono">First-Fit Decreasing (FFD) Bin Packing</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Clear Confirmation Dialog */}
      <ConfirmDialog
        open={isClearConfirmOpen}
        onOpenChange={setIsClearConfirmOpen}
        title="Purge Entire Application Database?"
        description="This action cannot be undone. All student records, examinations, rooms, conflict graphs, and active seating allocations will be erased."
        confirmText="Confirm Purge"
        variant="destructive"
        onConfirm={() => {
          clearAllData();
          setIsClearConfirmOpen(false);
        }}
      />
    </div>
  );
}

