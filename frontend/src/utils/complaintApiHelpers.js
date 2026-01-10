/**
 * API interaction utilities for complaint operations
 */

import { assignAdmin, revokeReport, resolveReport, closeReport } from "../services/reportsApi";
import { toast } from "react-hot-toast";

export const refreshComplaintFromPartner = async (id, currentComplaint) => {
  try {
    const base = (process.env.REACT_APP_API_BASE_URL).replace(/\/$/, "");
    const res = await fetch(`${base}/reports/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    const normalized = {
      ...currentComplaint,
      ...data,
      timelineHistory: data.timelineHistory || data.timeline_history || currentComplaint.timelineHistory || [],
    };
    return normalized;
  } catch (err) {
    console.warn('⚠️ Failed to refresh complaint after assign/revoke', err);
    return currentComplaint;
  }
};

export const updateAssignedStaff = async (complaintId, staffId, onSuccess) => {
  try {
    const response = await assignAdmin(complaintId, { adminId: staffId });
    console.log("✅ Partner assign-admin response:", response?.data || response);
    try { toast.success("Admin assigned. Status may auto-update."); } catch (e) {}
    if (onSuccess) await onSuccess();
  } catch (err) {
    console.error("Failed to update assigned staff via partner API:", err);
    try { toast.error("Failed to reassign complaint"); } catch (e) {}
  }
};

export const revokeAssignedStaff = async (complaintId, onSuccess) => {
  try {
    const response = await revokeReport(complaintId);
    console.log("✅ Partner revoke-admin response:", response?.data || response);
    
    const status = response?.status || 200;
    
    if (status === 200) {
      try { toast.success("Admin revoked successfully"); } catch (e) {}
      if (onSuccess) await onSuccess();
    } else if (status === 422) {
      console.log("ℹ️ Report was already unassigned");
      try { toast.info("Report is already unassigned"); } catch (e) {}
      if (onSuccess) await onSuccess();
    } else if (status === 404) {
      console.error("❌ Report not found on partner API");
      try { toast.error("Report not found"); } catch (e) {}
    } else {
      console.error("❌ Unexpected response:", status);
      try { toast.error("Failed to revoke assignment"); } catch (e) {}
    }
  } catch (err) {
    const status = err?.response?.status;
    const errorMsg = err?.response?.data?.error;
    
    if (status === 422) {
      console.log("ℹ️ Report already unassigned:", errorMsg);
      try { toast.info("Report is already unassigned"); } catch (e) {}
      if (onSuccess) await onSuccess();
    } else if (status === 404) {
      console.error("❌ Report not found:", errorMsg);
      try { toast.error("Report not found"); } catch (e) {}
    } else {
      console.error("❌ Failed to revoke assigned staff via partner API:", err);
      try { toast.error(errorMsg || "Failed to revoke assignment"); } catch (e) {}
    }
  }
};

export const updateComplaintStatus = async (complaintId, newStatus, onSuccess) => {
  try {
    if (newStatus === 'Resolved') {
      await resolveReport(complaintId, {});
      console.log(`✅ Report ${complaintId} marked as Resolved`);
    } else if (newStatus === 'Closed') {
      await closeReport(complaintId, {});
      console.log(`✅ Report ${complaintId} marked as Closed`);
    } else {
      console.log(`ℹ️ No partner endpoint for status '${newStatus}', status not updated via API`);
      return;
    }
    
    try { toast.success('Complaint status updated'); } catch (e) {}
    if (onSuccess) await onSuccess();
  } catch (err) {
    const status = err?.response?.status;
    const errorMsg = err?.response?.data?.error;
    const errorString = typeof errorMsg === 'string' ? errorMsg : 'Failed to update complaint status';
    
    if (status === 404) {
      console.error('❌ Report not found:', errorMsg);
      try { toast.error('Report not found'); } catch (e) {}
    } else if (status === 422) {
      console.warn('⚠️ Cannot update status:', errorMsg);
      try { toast.error(errorString); } catch (e) {}
    } else {
      console.error('❌ Failed to update complaint status:', err);
      try { toast.error(errorString); } catch (e) {}
    }
  }
};
