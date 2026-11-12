"use client";

import { useState, useMemo } from "react";
import { useData } from "@/components/providers/data-provider";
import { Room, RoomFormData } from "@/types";
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
  Building2, Plus, Download, Trash2, Edit2, CheckCircle2,
  XCircle, Filter, Armchair, Layers
} from "lucide-react";

export default function RoomsPage() {
  const {
    rooms,
    addRoom,
    updateRoom,
    deleteRoom,
    lastSeatingResult
  } = useData();

  const [search, setSearch] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedAvailability, setSelectedAvailability] = useState("ALL");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  const [formData, setFormData] = useState<RoomFormData>({
    room_name: "",
    building: "Academic Block 1",
    floor: 1,
    capacity: 50,
    room_type: "lecture_hall",
    is_available: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Buildings list
  const buildings = useMemo(() => {
    const set = new Set(rooms.map((r) => r.building));
    return ["ALL", ...Array.from(set)];
  }, [rooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchesSearch =
        r.room_name.toLowerCase().includes(search.toLowerCase()) ||
        r.building.toLowerCase().includes(search.toLowerCase());

      const matchesBuilding = selectedBuilding === "ALL" || r.building === selectedBuilding;
      const matchesType = selectedType === "ALL" || r.room_type === selectedType;
      const matchesAvail =
        selectedAvailability === "ALL" ||
        (selectedAvailability === "AVAILABLE" ? r.is_available : !r.is_available);

      return matchesSearch && matchesBuilding && matchesType && matchesAvail;
    });
  }, [rooms, search, selectedBuilding, selectedType, selectedAvailability]);

  // Aggregate stats
  const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
  const availableCapacity = rooms
    .filter((r) => r.is_available)
    .reduce((acc, r) => acc + r.capacity, 0);
  const totalRooms = rooms.length;
  const availableRoomsCount = rooms.filter((r) => r.is_available).length;

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData({
      room_name: "",
      building: "Academic Block 1",
      floor: 1,
      capacity: 50,
      room_type: "lecture_hall",
      is_available: true,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      room_name: room.room_name,
      building: room.building,
      floor: room.floor,
      capacity: room.capacity,
      room_type: room.room_type,
      is_available: room.is_available,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.room_name.trim()) errors.room_name = "Room identifier is required";
    if (!formData.building.trim()) errors.building = "Building name is required";
    if (formData.capacity <= 0) errors.capacity = "Capacity must be a positive integer greater than 0";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingRoom) {
      const res = updateRoom(editingRoom.id, formData);
      if (res) setIsFormOpen(false);
    } else {
      const res = addRoom(formData);
      if (res) setIsFormOpen(false);
    }
  };

  const handleToggleAvailability = (room: Room) => {
    updateRoom(room.id, { is_available: !room.is_available });
    toast.success(`Room ${room.room_name} is now ${!room.is_available ? 'Available' : 'Unavailable'}`);
  };

  const handleExportCSV = () => {
    if (rooms.length === 0) {
      toast.error("No rooms to export");
      return;
    }
    const headers = ["Room Name", "Building", "Floor", "Capacity", "Room Type", "Status"];
    const rows = rooms.map((r) => [
      `"${r.room_name}"`,
      `"${r.building}"`,
      r.floor,
      r.capacity,
      r.room_type,
      r.is_available ? "Available" : "Unavailable",
    ]);
    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(csvString, `examgraph_rooms_${new Date().toISOString().split("T")[0]}.csv`);
    toast.success("Rooms CSV exported");
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards for Room Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Available Seating</p>
            <h3 className="text-xl font-bold mt-1 text-foreground">{availableCapacity} Seats</h3>
            <p className="text-[11px] text-muted-foreground">In active halls</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Armchair className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Registered Capacity</p>
            <h3 className="text-xl font-bold mt-1 text-foreground">{totalCapacity} Seats</h3>
            <p className="text-[11px] text-muted-foreground">Across all halls</p>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
            <Building2 className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Available Rooms</p>
            <h3 className="text-xl font-bold mt-1 text-foreground">
              {availableRoomsCount} / {totalRooms}
            </h3>
            <p className="text-[11px] text-muted-foreground">Eligible for bin packing</p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Capacity Availability</p>
            <h3 className="text-xl font-bold mt-1 text-foreground">
              {totalCapacity > 0 ? Math.round((availableCapacity / totalCapacity) * 100) : 0}%
            </h3>
            <p className="text-[11px] text-muted-foreground">Operational ratio</p>
          </div>
          <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-500">
            <Layers className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <SearchInput
            placeholder="Search by room name or building..."
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
            Add Room
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg text-xs flex-wrap">
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Building:</span>
          <Select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="h-8 text-xs py-1"
          >
            {buildings.map((b) => (
              <option key={b} value={b}>{b === "ALL" ? "All Buildings" : b}</option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Type:</span>
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-8 text-xs py-1"
          >
            <option value="ALL">All Room Types</option>
            <option value="lecture_hall">Lecture Hall</option>
            <option value="lab">Computer Lab</option>
            <option value="seminar_room">Seminar Room</option>
            <option value="auditorium">Auditorium</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status:</span>
          <Select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="h-8 text-xs py-1"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available Only</option>
            <option value="UNAVAILABLE">Unavailable Only</option>
          </Select>
        </div>

        {(selectedBuilding !== "ALL" || selectedType !== "ALL" || selectedAvailability !== "ALL" || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedBuilding("ALL"); setSelectedType("ALL"); setSelectedAvailability("ALL"); setSearch(""); }}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset Filters
          </Button>
        )}

        <div className="ml-auto text-muted-foreground font-medium">
          Showing {filteredRooms.length} of {rooms.length} examination rooms
        </div>
      </div>

      {/* Rooms Table */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Examination Rooms Found"
          description={
            rooms.length === 0
              ? "No examination rooms have been created yet."
              : "No rooms match the filter criteria."
          }
          action={
            rooms.length === 0 ? (
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add First Room
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Name / ID</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-semibold text-xs text-foreground">
                    {room.room_name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {room.building}
                  </TableCell>
                  <TableCell className="text-xs">
                    Floor {room.floor}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-medium">
                    <Badge variant="outline" className="gap-1 font-mono">
                      <Armchair className="h-3 w-3" />
                      {room.capacity} Seats
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs capitalize">
                    {room.room_type.replace("_", " ")}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleToggleAvailability(room)}
                      className="cursor-pointer"
                      title="Click to toggle availability"
                    >
                      {room.is_available ? (
                        <Badge variant="success" className="gap-1 cursor-pointer">
                          <CheckCircle2 className="h-3 w-3" />
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 cursor-pointer">
                          <XCircle className="h-3 w-3" />
                          Unavailable
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(room)}
                        title="Edit Room"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(room)}
                        title="Delete Room"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add / Edit Room Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        title={editingRoom ? "Edit Examination Room" : "Add Examination Room"}
        description={
          editingRoom
            ? "Update hall specifications and capacity parameters."
            : "Register an examination room. Rooms are sorted by capacity for bin packing."
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <Input
            label="Room Identifier / Number"
            placeholder="e.g. Lecture Hall 101"
            value={formData.room_name}
            onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
            error={formErrors.room_name}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Building Complex"
              placeholder="e.g. Academic Block 1"
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              error={formErrors.building}
              required
            />

            <Input
              label="Floor Level"
              type="number"
              min={-2}
              max={20}
              value={formData.floor.toString()}
              onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Seating Capacity"
              type="number"
              min={1}
              value={formData.capacity.toString()}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
              error={formErrors.capacity}
              required
            />

            <Select
              label="Room Category"
              value={formData.room_type}
              onChange={(e) => setFormData({ ...formData, room_type: e.target.value as RoomFormData["room_type"] })}
            >
              <option value="lecture_hall">Lecture Hall</option>
              <option value="lab">Computer Lab</option>
              <option value="seminar_room">Seminar Room</option>
              <option value="auditorium">Auditorium</option>
            </Select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_available"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="is_available" className="text-xs font-medium text-foreground cursor-pointer">
              Mark Room as Available for Seating Allocation
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingRoom ? "Save Changes" : "Register Room"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Examination Room"
        description={`Are you sure you want to delete ${deleteTarget?.room_name}? Any seating allocations in this room will be invalidated.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            deleteRoom(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
