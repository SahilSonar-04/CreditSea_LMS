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

export default function BorrowerApplicationsPage() {
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

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold text-sky-700">Application history</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">All loan applications</h1>
      <p className="mt-2 text-sm text-slate-500">Every application you&apos;ve started, past and present.</p>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading...</p>}
      {error && <p className="alert-error mt-6">{error}</p>}
      {!loading && !error && applications.length === 0 && (
        <p className="surface-card mt-6 p-5 text-sm text-slate-500">You haven&apos;t applied for a loan yet.</p>
      )}

      {applications.length > 0 && (
        <div className="surface-card mt-6 overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="py-2 pl-4 pr-4">S.No</th>
                <th className="py-2 pr-4">Application No.</th>
                <th className="py-2 pr-4">Applied On</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Tenure</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, index) => (
                <tr key={app._id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pl-4 pr-4">{index + 1}</td>
                  <td className="py-2 pr-4 font-medium">{app.loanRefNumber}</td>
                  <td className="py-2 pr-4">{new Date(app.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="py-2 pr-4">{app.loanAmount ? `₹${app.loanAmount.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="py-2 pr-4">{app.tenureDays ? `${app.tenureDays} days` : "—"}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[app.status]}`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
