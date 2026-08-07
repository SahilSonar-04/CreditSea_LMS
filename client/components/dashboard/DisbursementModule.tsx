"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Application } from "@/types/application";

const STATUS_STYLES: Record<Application["status"], string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  APPLIED: "bg-amber-100 text-amber-700",
  SANCTIONED: "bg-sky-100 text-sky-700",
  REJECTED: "bg-rose-100 text-rose-700",
  DISBURSED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-200 text-slate-700",
};

export default function DisbursementModule() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<"queue" | "history">("queue");
  const [history, setHistory] = useState<Application[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

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

  useEffect(() => {
    if (tab !== "history" || historyLoaded) return;

    async function loadHistory() {
      setHistoryLoading(true);
      const token = getToken();
      try {
        const data = await apiFetch<{ applications: Application[] }>("/dashboard/disbursement/history", {
          token: token || undefined,
        });
        setHistory(data.applications);
        setHistoryLoaded(true);
      } catch (err) {
        setActionError(err instanceof ApiError ? err.message : "Something went wrong");
      } finally {
        setHistoryLoading(false);
      }
    }

    void loadHistory();
  }, [tab, historyLoaded]);

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
      setHistoryLoaded(false);
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

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("queue")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === "queue" ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === "history" ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
        >
          History
        </button>
      </div>

      {actionError && <p className="alert-error mt-4">{actionError}</p>}

      {tab === "queue" && (
        <>
          {loading && <p className="mt-6 text-sm text-slate-500">Loading sanctioned loans...</p>}
          {error && <p className="alert-error mt-6">{error}</p>}
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
        </>
      )}

      {tab === "history" && (
        <>
          {historyLoading && <p className="mt-6 text-sm text-slate-500">Loading history...</p>}
          {!historyLoading && history.length === 0 && (
            <p className="surface-card mt-6 p-5 text-sm text-slate-500">No disbursements yet.</p>
          )}

          <div className="mt-6 space-y-3">
            {history.map((app) => (
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
                  {app.disbursedAt && (
                    <p className="mt-1 text-slate-500">
                      Disbursed on {new Date(app.disbursedAt).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[app.status]}`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
