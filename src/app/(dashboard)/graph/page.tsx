"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useData } from "@/components/providers/data-provider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { getColorForSlot, getTimeSlotLabel } from "@/lib/utils";
import cytoscape, { Core } from "cytoscape";
import toast from "react-hot-toast";
import {
  GitBranch, ZoomIn, ZoomOut, RotateCcw, Maximize2,
  Search, Info, Eye, Layers, Sparkles, AlertCircle, Users
} from "lucide-react";

export default function ConflictGraphPage() {
  const {
    exams,
    enrollments,
    students,
    conflictGraph,
    graphStats,
    currentTimetable,
    timetableAssignments,
    buildGraph,
    loadDemoData
  } = useData();

  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  // Visualization mode: "uncolored" | "colored"
  const [viewMode, setViewMode] = useState<"uncolored" | "colored">("colored");
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [layoutName, setLayoutName] = useState<"cose" | "circle" | "grid" | "concentric">("cose");

  // Ensure graph is built
  useEffect(() => {
    if (exams.length > 0 && !conflictGraph) {
      buildGraph();
    }
  }, [exams, conflictGraph, buildGraph]);

  // Coloring mapping
  const coloringMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (currentTimetable && timetableAssignments.length > 0) {
      timetableAssignments.forEach((a) => {
        map[a.exam_id] = a.time_slot;
      });
    }
    return map;
  }, [currentTimetable, timetableAssignments]);

  // Initialize and update Cytoscape
  useEffect(() => {
    if (!containerRef.current || !conflictGraph || exams.length === 0) return;

    // Build elements
    const elements: any[] = [];

    // Nodes
    conflictGraph.vertices.forEach((examId) => {
      const exam = exams.find((e) => e.id === examId);
      const degree = conflictGraph.adjacencyList.get(examId)?.size || 0;
      const enrolledCount = enrollments.filter((e) => e.exam_id === examId).length;
      const slot = coloringMap[examId] !== undefined ? coloringMap[examId] : -1;

      elements.push({
        data: {
          id: examId,
          label: exam ? `${exam.exam_code}\n(${exam.department})` : examId,
          full_name: exam?.subject_name || "Unknown",
          exam_code: exam?.exam_code || "",
          department: exam?.department || "",
          semester: exam?.semester || 0,
          degree,
          enrolledCount,
          time_slot: slot,
          slotLabel: slot >= 0 ? getTimeSlotLabel(slot) : "Unassigned",
        },
      });
    });

    // Edges
    conflictGraph.edges.forEach((edge, idx) => {
      const exam1 = exams.find((e) => e.id === edge.exam1_id);
      const exam2 = exams.find((e) => e.id === edge.exam2_id);

      elements.push({
        data: {
          id: `edge_${edge.exam1_id}_${edge.exam2_id}_${idx}`,
          source: edge.exam1_id,
          target: edge.exam2_id,
          weight: edge.weight,
          shared_students: edge.shared_students,
          label: `${edge.weight} shared`,
          exam1_code: exam1?.exam_code || "",
          exam2_code: exam2?.exam_code || "",
        },
      });
    });

    // Determine stylesheet based on viewMode
    const nodeColoringFn = (ele: any) => {
      if (viewMode === "colored") {
        const slot = ele.data("time_slot");
        if (slot >= 0) {
          return getColorForSlot(slot);
        }
      }
      return "#3b82f6"; // default blue in uncolored mode
    };

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "text-wrap": "wrap",
            "text-max-width": "80px",
            color: "#ffffff",
            "font-size": "10px",
            "font-weight": "bold",
            "background-color": nodeColoringFn as any,
            width: "55px",
            height: "55px",
            "border-width": 2,
            "border-color": "#ffffff",
            "transition-property": "background-color, border-color, width, height",
            "transition-duration": 0.2,
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 4,
            "border-color": "#f59e0b",
            width: "65px",
            height: "65px",
          },
        },
        {
          selector: "node.highlighted",
          style: {
            "border-width": 4,
            "border-color": "#ec4899",
            "background-color": "#ec4899",
          },
        },
        {
          selector: "edge",
          style: {
            width: "mapData(weight, 1, 10, 1.5, 6)",
            "line-color": "#94a3b8",
            "curve-style": "bezier",
            opacity: 0.65,
            label: "data(weight)",
            "font-size": "9px",
            color: "#64748b",
            "text-background-opacity": 0.8,
            "text-background-color": "#ffffff",
            "text-background-padding": "2px",
            "text-background-shape": "roundrectangle",
          },
        },
        {
          selector: "edge:selected",
          style: {
            width: 5,
            "line-color": "#f59e0b",
            opacity: 1,
            color: "#b45309",
          },
        },
        {
          selector: "edge.neighbor-edge",
          style: {
            "line-color": "#ec4899",
            opacity: 0.9,
            width: 3,
          },
        },
      ],
      layout: {
        name: layoutName,
        animate: false,
        padding: 40,
      } as any,
    });

    // Event listeners
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      setSelectedNodeData(node.data());
      setSelectedEdgeData(null);

      // Highlight neighbors
      cy.elements().removeClass("highlighted neighbor-edge");
      node.addClass("highlighted");
      node.neighborhood("node").addClass("highlighted");
      node.connectedEdges().addClass("neighbor-edge");
    });

    cy.on("tap", "edge", (evt) => {
      const edge = evt.target;
      setSelectedEdgeData(edge.data());
      setSelectedNodeData(null);
      cy.elements().removeClass("highlighted neighbor-edge");
      edge.addClass("neighbor-edge");
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        setSelectedNodeData(null);
        setSelectedEdgeData(null);
        cy.elements().removeClass("highlighted neighbor-edge");
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [conflictGraph, exams, enrollments, viewMode, coloringMap, layoutName]);

  // Handle Search in graph
  const handleSearchNode = () => {
    if (!cyRef.current || !searchQuery.trim()) return;
    const cy = cyRef.current;
    cy.elements().removeClass("highlighted");

    const match = cy.nodes().filter((n) => {
      const code = n.data("exam_code")?.toLowerCase() || "";
      const name = n.data("full_name")?.toLowerCase() || "";
      return code.includes(searchQuery.toLowerCase()) || name.includes(searchQuery.toLowerCase());
    });

    if (match.length > 0) {
      match.addClass("highlighted");
      cy.animate({
        center: { eles: match },
        zoom: 1.5,
        duration: 400,
      });
      setSelectedNodeData(match[0].data());
    } else {
      toast.error("No matching examination node found");
    }
  };

  const handleResetZoom = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 40);
      cyRef.current.elements().removeClass("highlighted neighbor-edge");
      setSelectedNodeData(null);
      setSelectedEdgeData(null);
    }
  };

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.25);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  };

  if (exams.length === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="Conflict Graph Unavailable"
        description="Load or create examination and enrollment records to construct the vertex and conflict edge graph."
        action={
          <Button onClick={loadDemoData} className="gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Load Demo Data
          </Button>
        }
      />
    );
  }

  // Get distinct time slots present in the graph
  const distinctSlots = Array.from(
    new Set(Object.values(coloringMap).filter((s) => s >= 0))
  ).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Graph Statistics Header Card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground font-medium">Vertices (|V|)</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{graphStats?.totalVertices || 0}</p>
          <p className="text-[10px] text-muted-foreground">Examinations</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground font-medium">Conflict Edges (|E|)</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{graphStats?.totalEdges || 0}</p>
          <p className="text-[10px] text-muted-foreground">Overlap pairs</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground font-medium">Max Degree (Δ)</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{graphStats?.maxDegree || 0}</p>
          <p className="text-[10px] text-muted-foreground">Highest conflict exam</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground font-medium">Avg Degree</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{graphStats?.avgDegree.toFixed(1) || "0.0"}</p>
          <p className="text-[10px] text-muted-foreground">Per examination</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground font-medium">Isolated Vertices</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{graphStats?.isolatedVertices || 0}</p>
          <p className="text-[10px] text-muted-foreground">Degree 0 (no conflicts)</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[11px] text-muted-foreground font-medium">Graph Density</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{((graphStats?.density || 0) * 100).toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground">Connectedness</p>
        </Card>
      </div>

      {/* Main Graph Visualization Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas & Controls Container */}
        <Card className="lg:col-span-3 flex flex-col overflow-hidden relative border border-border">
          {/* Top Control Bar */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-card/60 backdrop-blur-xs flex-wrap gap-2 z-10">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40">
              <button
                onClick={() => setViewMode("uncolored")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  viewMode === "uncolored"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                1. Conflict Graph (Uncolored)
              </button>
              <button
                onClick={() => setViewMode("colored")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  viewMode === "colored"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                2. Chromatic Timetable (Colored)
              </button>
            </div>

            {/* Layout selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground hidden sm:inline">Layout:</span>
              <Select
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value as any)}
                className="h-8 text-xs py-1"
              >
                <option value="cose">Force-Directed (CoSE)</option>
                <option value="concentric">Concentric (Degree)</option>
                <option value="circle">Circular</option>
                <option value="grid">Grid</option>
              </Select>
            </div>

            {/* Node Search */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Find node code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchNode()}
                className="h-8 w-28 sm:w-36 text-xs px-2.5 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleSearchNode} title="Search Node">
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Canvas Navigation Controls */}
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleZoomIn} title="Zoom In">
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleZoomOut} title="Zoom Out">
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleResetZoom} title="Reset View">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Cytoscape Canvas */}
          <div
            ref={containerRef}
            className="w-full h-[520px] bg-muted/10 cursor-grab active:cursor-grabbing"
          />

          {/* Color Legend (Visible in colored mode) */}
          {viewMode === "colored" && distinctSlots.length > 0 && (
            <div className="p-3 border-t border-border bg-card/60 flex items-center gap-4 flex-wrap text-xs">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Assigned Time Slots:
              </span>
              {distinctSlots.map((slot) => (
                <div key={slot} className="flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full inline-block border border-black/10"
                    style={{ backgroundColor: getColorForSlot(slot) }}
                  />
                  <span className="font-medium text-foreground text-[11px]">
                    {getTimeSlotLabel(slot)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Selected Entity Inspector Panel */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Graph Inspector
            </CardTitle>
            <CardDescription className="text-xs">
              Click any node or edge to inspect conflicts
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 space-y-4">
            {selectedNodeData ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs font-bold">
                      {selectedNodeData.exam_code}
                    </Badge>
                    {selectedNodeData.time_slot >= 0 ? (
                      <Badge
                        className="text-white text-[10px]"
                        style={{ backgroundColor: getColorForSlot(selectedNodeData.time_slot) }}
                      >
                        {selectedNodeData.slotLabel}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Unassigned</Badge>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-foreground">
                    {selectedNodeData.full_name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Department: {selectedNodeData.department} | Semester {selectedNodeData.semester}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-md border border-border">
                    <p className="text-[10px] text-muted-foreground">Degree (Conflicts)</p>
                    <p className="text-base font-bold text-foreground mt-0.5">{selectedNodeData.degree}</p>
                  </div>
                  <div className="p-2.5 rounded-md border border-border">
                    <p className="text-[10px] text-muted-foreground">Enrolled Students</p>
                    <p className="text-base font-bold text-foreground mt-0.5">{selectedNodeData.enrolledCount}</p>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-400">
                  <p className="font-semibold">Conflict Rule:</p>
                  <p className="mt-0.5">
                    No adjacent course connected to this vertex can share the same time slot color.
                  </p>
                </div>
              </div>
            ) : selectedEdgeData ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">Conflict Edge</span>
                    <Badge variant="destructive" className="font-mono text-xs">
                      Weight: {selectedEdgeData.weight} Students
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs font-bold pt-1">
                    <span>{selectedEdgeData.exam1_code}</span>
                    <span className="text-muted-foreground">⟷</span>
                    <span>{selectedEdgeData.exam2_code}</span>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold mb-1 text-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    Shared Students ({selectedEdgeData.shared_students?.length || 0})
                  </h5>
                  <div className="max-h-48 overflow-y-auto space-y-1 p-2 rounded-md border border-border bg-muted/20 text-xs">
                    {selectedEdgeData.shared_students && selectedEdgeData.shared_students.length > 0 ? (
                      selectedEdgeData.shared_students.map((studentId: string) => {
                        const s = students.find((x) => x.id === studentId);
                        return (
                          <div key={studentId} className="flex items-center justify-between py-1 border-b border-border/40 last:border-none">
                            <span className="font-medium text-foreground">{s?.full_name || "Student"}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">{s?.enrollment_number}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground text-[11px]">No student records found</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                <Eye className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs font-medium">Select a Vertex or Edge</p>
                <p className="text-[11px] mt-1 text-muted-foreground/80">
                  Click on an exam circle to reveal its conflict degree, or an edge to view shared students.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
