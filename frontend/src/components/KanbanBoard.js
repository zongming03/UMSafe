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
    e.dataTransfer.setData("text/plain", complaint.id);
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
    
    // Get current user from localStorage/sessionStorage
    const storedUserStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    const currentUser = storedUserStr ? JSON.parse(storedUserStr) : null;
    const currentUserId = currentUser?.id || currentUser?._id;
    const isAdmin = currentUser?.role === "admin";

    // Validation rules
    // 1. Cannot move TO "Opened" or "InProgress"
    if (targetStatus === "Opened") {
      showNotification("❌ Cannot move complaints to 'Opened'. Complaints are automatically set to Opened when submitted or revoked.");
      setDraggedComplaint(null);
      return;
    }

    if (targetStatus === "InProgress") {
      showNotification("❌ Cannot move complaints to 'In Progress'. Status is set when admin assigns the complaint.");
      setDraggedComplaint(null);
      return;
    }

    // 2. Can only move FROM "InProgress" TO "Resolved" or "Closed"
    if (currentStatus !== "InProgress") {
      showNotification("❌ Only complaints in 'In Progress' status can be moved to Resolved or Closed.");
      setDraggedComplaint(null);
      return;
    }

    // 3. Check if user is assigned to this complaint (unless admin)
    if (!isAdmin && draggedComplaint.adminId !== currentUserId) {
      showNotification("❌ You can only move complaints that are assigned to you.");
      setDraggedComplaint(null);
      return;
    }

    // 4. Allow move from InProgress to Resolved or Closed
    if ((targetStatus === "Resolved" || targetStatus === "Closed") && currentStatus === "InProgress") {
      if (onStatusChange) {
        onStatusChange(id, targetStatus);
        showNotification(`✅ Complaint moved to ${targetStatus}`);
      }
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
