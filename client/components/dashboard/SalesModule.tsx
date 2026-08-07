"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { SalesLead } from "@/types/dashboard";

export default function SalesModule() {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = getToken();
      try {
        const data = await apiFetch<{ leads: SalesLead[] }>("/dashboard/sales", {
          token: token || undefined,
        });
        setLeads(data.leads);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold text-sky-700">Pre-application</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Sales leads</h1>
      <p className="mt-2 text-sm text-slate-500">Registered borrowers who haven&apos;t applied yet.</p>

      {loading && <p className="mt-6 text-sm text-slate-500">Loading leads...</p>}
      {error && <p className="alert-error mt-6">{error}</p>}
      {!loading && !error && leads.length === 0 && (
        <p className="surface-card mt-6 p-5 text-sm text-slate-500">No pending leads.</p>
      )}

      {leads.length > 0 && (
        <div className="surface-card mt-6 overflow-x-auto">
        <table className="min-w-[620px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead._id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-4">{lead.name}</td>
                <td className="py-2 pr-4">{lead.email}</td>
                <td className="py-2 pr-4">{lead.phone || "—"}</td>
                <td className="py-2 pr-4">{new Date(lead.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
