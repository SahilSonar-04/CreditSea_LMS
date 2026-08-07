"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Application } from "@/types/application";

export default function SanctionModule() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    async function loadQueue() {
      const token = getToken();
      try {
        const data = await apiFetch<{ applications: Application[] }>("/dashboard/sanction", {
          token: token || undefined,
        });
        setApplications(data.applications);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    void loadQueue();
  }, []);

  async function handleApprove(id: string) {
    setActionError(null);
    setBusyId(id);
    const token = getToken();

    try {
      await apiFetch(`/dashboard/sanction/${id}/approve`, {
        method: "PATCH",
        token: token || undefined,
      });
      setApplications((prev) => prev.filter((app) => app._id !== id));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) {
      setActionError("A rejection reason is required");
      return;
    }

    setActionError(null);
    setBusyId(id);
    const token = getToken();

    try {
      await apiFetch(`/dashboard/sanction/${id}/reject`, {
        method: "PATCH",
        token: token || undefined,
        body: JSON.stringify({ reason: rejectReason }),
      });
      setApplications((prev) => prev.filter((app) => app._id !== id));
      setRejectingId(null);
      setRejectReason("");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Sanction</h1>
      <p className="text-sm text-gray-500">Applications awaiting a sanction decision.</p>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}
      {!loading && !error && applications.length === 0 && (
        <p className="text-sm text-gray-500">No applications pending sanction.</p>
      )}

      <div className="space-y-3">
        {applications.map((app) => (
          <div key={app._id} className="rounded border border-gray-200 p-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {app.fullName} — {app.loanRefNumber}
                </p>
                <p className="text-gray-500">
                  ₹{app.loanAmount?.toLocaleString("en-IN")} for {app.tenureDays} days · Salary ₹
                  {app.monthlySalary?.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busyId === app._id}
                  onClick={() => handleApprove(app._id)}
                  className="rounded bg-green-600 px-3 py-1.5 text-white disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === app._id}
                  onClick={() => {
                    setRejectingId(app._id);
                    setActionError(null);
                  }}
                  className="rounded bg-red-600 px-3 py-1.5 text-white disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>

            {rejectingId === app._id && (
              <div className="mt-3 flex gap-2">
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection"
                  className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  disabled={busyId === app._id}
                  onClick={() => handleReject(app._id)}
                  className="rounded border border-red-600 px-3 py-1.5 text-red-600 disabled:opacity-50"
                >
                  Confirm reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
