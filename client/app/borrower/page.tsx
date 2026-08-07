"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken, useSessionUser } from "@/lib/auth";
import { Application } from "@/types/application";

const ACTIVE_STATUSES: Application["status"][] = ["DRAFT", "APPLIED", "SANCTIONED", "DISBURSED"];

const STATUS_LABELS: Record<Application["status"], string> = {
  DRAFT: "Draft — continue your application",
  APPLIED: "Applied — awaiting sanction review",
  SANCTIONED: "Sanctioned — awaiting disbursement",
  REJECTED: "Rejected",
  DISBURSED: "Disbursed — repayment in progress",
  CLOSED: "Closed",
};

export default function BorrowerDashboardPage() {
  const user = useSessionUser();
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

  const current = applications.find((app) => ACTIVE_STATUSES.includes(app.status)) || applications[0] || null;

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold text-sky-700">Welcome back{user ? `, ${user.name}` : ""}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Your dashboard</h1>
      <p className="mt-2 text-sm text-slate-500">A quick look at where your loan stands.</p>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading your applications...</p>}
      {error && <p className="alert-error mt-6">{error}</p>}

      {!loading && !error && (
        <>
          <div className="surface-card mt-6 p-5 sm:p-6">
            {current ? (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">{current.loanRefNumber}</p>
                <p className="mt-1 text-lg font-bold text-slate-950">{STATUS_LABELS[current.status]}</p>
                {current.loanAmount && (
                  <p className="mt-2 text-sm text-slate-500">
                    ₹{current.loanAmount.toLocaleString("en-IN")} for {current.tenureDays} days
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {ACTIVE_STATUSES.includes(current.status) && current.status !== "DISBURSED" && (
                    <Link href="/apply" className="btn-primary px-4 py-2">Continue application</Link>
                  )}
                  {current.status === "DISBURSED" && (
                    <Link href="/borrower/loan" className="btn-primary px-4 py-2">View repayment</Link>
                  )}
                  {(current.status === "CLOSED" || current.status === "REJECTED") && (
                    <Link href="/apply" className="btn-primary px-4 py-2">Apply for a new loan</Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-500">You haven&apos;t started an application yet.</p>
                <Link href="/apply" className="btn-primary mt-4 inline-block px-4 py-2">Start your application</Link>
              </>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { href: "/borrower/profile", label: "My Profile", hint: "View your account details" },
              { href: "/borrower/applications", label: "All Loan Applications", hint: `${applications.length} total` },
              { href: "/borrower/loan", label: "Active Loan & Repayment", hint: "Track your repayment" },
            ].map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                className="surface-card group p-5 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg"
              >
                <span className="text-sky-600">{tile.label}</span>
                <span className="float-right text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-600">→</span>
                <span className="mt-2 block text-xs font-normal text-slate-500">{tile.hint}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
