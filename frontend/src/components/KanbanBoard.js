import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

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

const KanbanBoard = ({ complaints = [], onStatusChange, onCardClick, adminsMap = {} }) => {
  const [buckets, setBuckets] = useState({ Opened: [], InProgress: [], Resolved: [], Closed: [] });
  const [notification, setNotification] = useState(null);
  const [draggedComplaint, setDraggedComplaint] = useState(null);

  useEffect(() => {
    const map = { Opened: [], InProgress: [], Resolved: [], Closed: [] };
    complaints.forEach((c) => {
      const s = normalizeStatus(c.status);
      if (!map[s]) map[s] = [];
      map[s].push(c);
    });
    setBuckets(map);
  }, [complaints]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDragStart = (e, complaint) => {
    const identifier = complaint.id || complaint.displayId || complaint._id;
    if (!identifier) return;
    e.dataTransfer.setData("text/plain", identifier);
    e.dataTransfer.effectAllowed = "move";
    setDraggedComplaint(complaint);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id || !draggedComplaint) return;

    const currentStatus = normalizeStatus(draggedComplaint.status);

    // Validation rules
    // 1. Opened/InProgress cards cannot be dragged
    if (currentStatus === "Opened" || currentStatus === "InProgress") {
      showNotification("❌ 'Opened' and 'In Progress' items cannot be moved via drag-and-drop.");
      setDraggedComplaint(null);
      return;
    }

    // 2. Only allow toggling between Resolved and Closed
    const isTerminal = currentStatus === "Resolved" || currentStatus === "Closed";
    const targetIsTerminal = targetStatus === "Resolved" || targetStatus === "Closed";
    if (!isTerminal || !targetIsTerminal) {
      showNotification("❌ You can only move between Resolved and Closed.");
      setDraggedComplaint(null);
      return;
    }

    // 3. No-op if dropping into same status
    if (targetStatus === currentStatus) {
      setDraggedComplaint(null);
      return;
    }

    // 4. Allow swap between terminal states
    if (onStatusChange) {
      onStatusChange(id, targetStatus);
      showNotification(`✅ Complaint moved to ${targetStatus}`);
    }

    setDraggedComplaint(null);
  };

  return (
    <>
      {/* Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`px-4 py-3 rounded-lg shadow-lg border-l-4 max-w-md ${
            notification.startsWith('✅') 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <div className="flex items-start">
              <FontAwesomeIcon 
                icon={faExclamationCircle} 
                className={`mt-0.5 mr-3 ${notification.startsWith('✅') ? 'text-green-500' : 'text-red-500'}`}
              />
              <p className="text-sm font-medium">{notification}</p>
            </div>
          </div>
        </div>
      )}

      <div className="kanban-board grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className="kanban-column bg-white rounded shadow p-3 flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">{status}</h3>
              <span className="text-xs text-gray-500">{buckets[status]?.length || 0}</span>
            </div>
            <div className="space-y-2 min-h-[80px] max-h-[600px] overflow-y-auto pr-1">
              {buckets[status] && buckets[status].length > 0 ? (
                buckets[status].map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, c)}
                    onClick={() => onCardClick && onCardClick(c)}
                    className="kanban-card p-3 bg-gray-50 rounded border border-gray-100 hover:shadow cursor-move transition-shadow"
                  >
                    <div className="text-xs text-gray-500">{c.displayId || c.id}</div>
                    <div className="font-medium text-sm truncate" title={c.title}>{c.title}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {c.category?.name || "-"} • {adminsMap[c.adminId] || c.adminName || c.assignedTo || "Unassigned"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 italic">No items</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </>
  );
};

export default KanbanBoard;
