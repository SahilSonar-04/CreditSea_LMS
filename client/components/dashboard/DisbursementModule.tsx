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

  async function load() {
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

  useEffect(() => {
    load();
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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Disbursement</h1>
      <p className="text-sm text-gray-500">Sanctioned loans ready to be disbursed.</p>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}
      {!loading && !error && applications.length === 0 && (
        <p className="text-sm text-gray-500">No loans pending disbursement.</p>
      )}

      <div className="space-y-3">
        {applications.map((app) => (
          <div
            key={app._id}
            className="flex items-center justify-between rounded border border-gray-200 p-4 text-sm"
          >
            <div>
              <p className="font-medium">
                {app.fullName} — {app.loanRefNumber}
              </p>
              <p className="text-gray-500">
                ₹{app.loanAmount?.toLocaleString("en-IN")} · Total repayment ₹
                {app.totalRepayment?.toLocaleString("en-IN")}
              </p>
            </div>
            <button
              type="button"
              disabled={busyId === app._id}
              onClick={() => handleDisburse(app._id)}
              className="rounded bg-blue-600 px-3 py-1.5 text-white disabled:opacity-50"
            >
              Mark disbursed
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
