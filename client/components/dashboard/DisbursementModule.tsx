"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Application } from "@/types/application";

export default function DisbursementModule() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    async function loadQueue() {
      const token = getToken();
      try {
        const data = await apiFetch<{ applications: Application[] }>("/dashboard/disbursement", {
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

  async function handleDisburse(id: string) {
    setActionError(null);
    setBusyId(id);
    const token = getToken();

    try {
      await apiFetch(`/dashboard/disbursement/${id}/disburse`, {
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

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold text-sky-700">Funds release</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Disbursement</h1>
      <p className="mt-2 text-sm text-slate-500">Sanctioned loans ready to be disbursed.</p>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading sanctioned loans...</p>}
      {error && <p className="alert-error mt-6">{error}</p>}
      {actionError && <p className="alert-error mt-4">{actionError}</p>}
      {!loading && !error && applications.length === 0 && (
        <p className="surface-card mt-6 p-5 text-sm text-slate-500">No loans pending disbursement.</p>
      )}

      <div className="mt-6 space-y-3">
        {applications.map((app) => (
          <div
            key={app._id}
            className="surface-card flex flex-col gap-4 p-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <div>
              <p className="font-medium">
                {app.fullName} — {app.loanRefNumber}
              </p>
              <p className="mt-1 text-slate-500">
                ₹{app.loanAmount?.toLocaleString("en-IN")} · Total repayment ₹
                {app.totalRepayment?.toLocaleString("en-IN")}
              </p>
            </div>
            <button
              type="button"
              disabled={busyId === app._id}
              onClick={() => handleDisburse(app._id)}
              className="btn-primary self-start sm:self-auto"
            >
              Mark disbursed
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
