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

  async function load() {
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

  useEffect(() => {
    load();
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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Collection</h1>
      <p className="text-sm text-gray-500">Disbursed loans with an outstanding balance.</p>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && applications.length === 0 && (
        <p className="text-sm text-gray-500">No loans currently being collected.</p>
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
                  Outstanding ₹{app.outstandingBalance?.toLocaleString("en-IN")} of ₹
                  {app.totalRepayment?.toLocaleString("en-IN")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openForm(app._id)}
                className="rounded bg-blue-600 px-3 py-1.5 text-white"
              >
                Record payment
              </button>
            </div>

            {openId === app._id && (
              <form onSubmit={(e) => handleSubmit(e, app._id)} className="mt-3 grid grid-cols-3 gap-2">
                <input
                  value={form.utrNumber}
                  onChange={(e) => setForm((f) => ({ ...f, utrNumber: e.target.value }))}
                  placeholder="UTR number"
                  className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="Amount"
                  className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
                <div className="col-span-3 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded bg-green-600 px-3 py-1.5 text-white disabled:opacity-50"
                  >
                    {submitting ? "Recording..." : "Confirm payment"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenId(null)}
                    className="rounded border border-gray-300 px-3 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
                {formError && <p className="col-span-3 text-sm text-red-600">{formError}</p>}
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
