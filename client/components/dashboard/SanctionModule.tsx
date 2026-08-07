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
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold text-sky-700">Decision queue</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Sanction</h1>
      <p className="mt-2 text-sm text-slate-500">Applications awaiting a sanction decision.</p>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading applications...</p>}
      {error && <p className="alert-error mt-6">{error}</p>}
      {actionError && <p className="alert-error mt-4">{actionError}</p>}
      {!loading && !error && applications.length === 0 && (
        <p className="surface-card mt-6 p-5 text-sm text-slate-500">No applications pending sanction.</p>
      )}

      <div className="mt-6 space-y-3">
        {applications.map((app) => (
          <div key={app._id} className="surface-card p-4 text-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  {app.fullName} — {app.loanRefNumber}
                </p>
                <p className="mt-1 text-slate-500">
                  ₹{app.loanAmount?.toLocaleString("en-IN")} for {app.tenureDays} days · Salary ₹
                  {app.monthlySalary?.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busyId === app._id}
                  onClick={() => handleApprove(app._id)}
                  className="rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
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
                  className="rounded-lg bg-rose-600 px-3 py-2 font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>

            {rejectingId === app._id && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection"
                  className="field-control flex-1"
                />
                <button
                  type="button"
                  disabled={busyId === app._id}
                  onClick={() => handleReject(app._id)}
                  className="rounded-lg border border-rose-600 px-3 py-2 font-semibold text-rose-700 disabled:opacity-50"
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
