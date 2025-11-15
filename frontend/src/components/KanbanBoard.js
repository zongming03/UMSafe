import React, { useEffect, useState } from "react";

// Simple Kanban board using HTML5 drag & drop (no extra deps)
// Props:
// - complaints: array of complaint objects
// - onStatusChange(id, newStatus): callback when a card is dropped into a new column
// - onCardClick(complaint): optional click handler

const STATUS_ORDER = ["Opened", "InProgress", "Resolved", "Closed"];

const normalizeStatus = (raw) => {
  if (!raw) return "Opened";
  const s = String(raw).trim().toLowerCase();
  if (s === "open" || s === "opened") return "Opened";
  if (s === "inprogress" || s === "in progress" || s === "in_progress" || s === "in-progress") return "InProgress";
  if (s === "resolved" || s === "resolve") return "Resolved";
  if (s === "closed") return "Closed";
  return "Opened";
};

const KanbanBoard = ({ complaints = [], onStatusChange, onCardClick }) => {
  const [buckets, setBuckets] = useState({ Opened: [], InProgress: [], Resolved: [] });

  useEffect(() => {
    const map = { Opened: [], InProgress: [], Resolved: [] };
    complaints.forEach((c) => {
      const s = normalizeStatus(c.status);
      if (!map[s]) map[s] = [];
      map[s].push(c);
    });
    setBuckets(map);
  }, [complaints]);

  const handleDragStart = (e, complaint) => {
    e.dataTransfer.setData("text/plain", complaint.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    if (onStatusChange) onStatusChange(id, targetStatus);
  };

  return (
    <div className="kanban-board grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
      {STATUS_ORDER.map((status) => (
        <div
          key={status}
          className="kanban-column bg-white rounded shadow p-3"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">{status}</h3>
            <span className="text-xs text-gray-500">{buckets[status]?.length || 0}</span>
          </div>
          <div className="space-y-2 min-h-[80px]">
            {buckets[status] && buckets[status].length > 0 ? (
              buckets[status].map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, c)}
                  onClick={() => onCardClick && onCardClick(c)}
                  className="kanban-card p-3 bg-gray-50 rounded border border-gray-100 hover:shadow cursor-pointer"
                >
                  <div className="text-xs text-gray-500">{c.id}</div>
                  <div className="font-medium text-sm truncate" title={c.title}>{c.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{c.category?.name || "-"} • {c.assignedTo || c.adminId || "Unassigned"}</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400 italic">No items</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
