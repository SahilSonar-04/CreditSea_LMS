"use client";

import { useEffect, useState, FormEvent } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Application } from "@/types/application";
import { PaymentHistoryEntry } from "@/types/dashboard";

interface PaymentFormState {
  utrNumber: string;
  amount: string;
  date: string;
}

const EMPTY_FORM: PaymentFormState = { utrNumber: "", amount: "", date: "" };

export default function CollectionModule() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"queue" | "history">("queue");
  const [history, setHistory] = useState<PaymentHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQueue() {
      const token = getToken();
      try {
        const data = await apiFetch<{ applications: Application[] }>("/dashboard/collection", {
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
        const data = await apiFetch<{ payments: PaymentHistoryEntry[] }>("/dashboard/collection/history", {
          token: token || undefined,
        });
        setHistory(data.payments);
        setHistoryLoaded(true);
      } catch (err) {
        setHistoryError(err instanceof ApiError ? err.message : "Something went wrong");
      } finally {
        setHistoryLoading(false);
      }
    }

    void loadHistory();
  }, [tab, historyLoaded]);

  function openForm(id: string) {
    setOpenId(id);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent, applicationId: string) {
    e.preventDefault();
    setFormError(null);

    if (!form.utrNumber.trim() || !form.amount || !form.date) {
      setFormError("UTR number, amount and date are all required");
      return;
    }

    setSubmitting(true);
    const token = getToken();

    try {
      const data = await apiFetch<{ application: Application }>(
        `/dashboard/collection/${applicationId}/payment`,
        {
          method: "POST",
          token: token || undefined,
          body: JSON.stringify({
            utrNumber: form.utrNumber,
            amount: Number(form.amount),
            date: form.date,
          }),
        }
      );

      if (data.application.status === "CLOSED") {
        setApplications((prev) => prev.filter((app) => app._id !== applicationId));
      } else {
        setApplications((prev) => prev.map((app) => (app._id === applicationId ? data.application : app)));
      }

      setOpenId(null);
      setForm(EMPTY_FORM);
      setHistoryLoaded(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold text-sky-700">Repayment tracking</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Collection</h1>
      <p className="mt-2 text-sm text-slate-500">Disbursed loans with an outstanding balance.</p>

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

      {tab === "queue" && (
        <>
          {loading && <p className="mt-6 text-sm text-slate-500">Loading active loans...</p>}
          {error && <p className="alert-error mt-6">{error}</p>}
          {!loading && !error && applications.length === 0 && (
            <p className="surface-card mt-6 p-5 text-sm text-slate-500">No loans currently being collected.</p>
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
                      Outstanding ₹{app.outstandingBalance?.toLocaleString("en-IN")} of ₹
                      {app.totalRepayment?.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openForm(app._id)}
                    className="btn-primary self-start sm:self-auto"
                  >
                    Record payment
                  </button>
                </div>

                {openId === app._id && (
                  <form onSubmit={(e) => handleSubmit(e, app._id)} className="mt-4 grid gap-2 sm:grid-cols-3">
                    <input
                      value={form.utrNumber}
                      onChange={(e) => setForm((f) => ({ ...f, utrNumber: e.target.value }))}
                      placeholder="UTR number"
                      className="field-control"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      inputMode="decimal"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      placeholder="Amount"
                      className="field-control"
                    />
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className="field-control"
                    />
                    <div className="flex items-center gap-2 sm:col-span-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {submitting ? "Recording..." : "Confirm payment"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenId(null)}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                    {formError && <p className="alert-error sm:col-span-3">{formError}</p>}
                  </form>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "history" && (
        <>
          {historyLoading && <p className="mt-6 text-sm text-slate-500">Loading history...</p>}
          {historyError && <p className="alert-error mt-6">{historyError}</p>}
          {!historyLoading && !historyError && history.length === 0 && (
            <p className="surface-card mt-6 p-5 text-sm text-slate-500">No payments recorded yet.</p>
          )}

          {history.length > 0 && (
            <div className="surface-card mt-6 overflow-x-auto">
              <table className="min-w-[620px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <th className="py-2 pl-4 pr-4">Application</th>
                    <th className="py-2 pr-4">UTR</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((payment) => (
                    <tr key={payment._id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pl-4 pr-4">
                        {typeof payment.loanId === "string" ? payment.loanId : payment.loanId.loanRefNumber}
                      </td>
                      <td className="py-2 pr-4">{payment.utrNumber}</td>
                      <td className="py-2 pr-4">₹{payment.amount.toLocaleString("en-IN")}</td>
                      <td className="py-2 pr-4">{new Date(payment.date).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
