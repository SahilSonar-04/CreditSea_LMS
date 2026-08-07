"use client";

import { useEffect, useState, FormEvent } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Application } from "@/types/application";

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
    </div>
  );
}
