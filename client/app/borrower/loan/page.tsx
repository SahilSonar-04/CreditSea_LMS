"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Application } from "@/types/application";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default function BorrowerLoanPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = getToken();
      try {
        const data = await apiFetch<{ applications: Application[] }>("/applications/me", {
          token: token || undefined,
        });
        setApplications(data.applications);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const loan =
    applications.find((app) => app.status === "DISBURSED") ||
    applications.find((app) => app.status === "CLOSED") ||
    null;

  const currency = (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-sm font-semibold text-sky-700">Repayment</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Active loan &amp; repayment</h1>
      <p className="mt-2 text-sm text-slate-500">A live snapshot of your most recent disbursed loan.</p>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading...</p>}
      {error && <p className="alert-error mt-6">{error}</p>}

      {!loading && !error && !loan && (
        <div className="surface-card mt-6 p-5 text-sm text-slate-500">
          You don&apos;t have a disbursed loan yet.{" "}
          <Link href="/borrower" className="font-semibold text-sky-700 hover:text-sky-900">Go to your dashboard</Link>{" "}
          to check your application status.
        </div>
      )}

      {!loading && !error && loan && (
        <div className="surface-card mt-6 p-5 sm:p-6">
          {loan.status === "CLOSED" && (
            <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              This loan is fully repaid and closed.
            </p>
          )}
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">{loan.loanRefNumber}</p>

          <div className="mt-4 space-y-3 text-sm">
            <Row label="Principal amount" value={currency(loan.loanAmount || 0)} />
            <Row label="Loan tenure" value={loan.tenureDays ? `${loan.tenureDays} days` : "—"} />
            <Row label="Disbursed on" value={loan.disbursedAt ? new Date(loan.disbursedAt).toLocaleDateString("en-IN") : "—"} />
            <Row
              label="Due date"
              value={
                loan.disbursedAt && loan.tenureDays
                  ? addDays(new Date(loan.disbursedAt), loan.tenureDays).toLocaleDateString("en-IN")
                  : "—"
              }
            />
            <Row label="Interest rate" value={`${loan.interestRate}% p.a.`} />
            <Row label="Simple interest" value={currency(loan.simpleInterest || 0)} />
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/70 p-4">
            <span className="text-sm font-semibold text-slate-700">Total amount payable</span>
            <span className="text-lg font-bold text-slate-950">{currency(loan.totalRepayment || 0)}</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Row label="Amount paid" value={currency((loan.totalRepayment || 0) - (loan.outstandingBalance || 0))} />
            <Row label="Payment left" value={currency(loan.outstandingBalance || 0)} />
          </div>

          {loan.status === "DISBURSED" && (
            <p className="mt-5 text-xs text-slate-500">
              Payments are recorded by our collections team once received. This page reflects the latest balance
              on your next visit.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
