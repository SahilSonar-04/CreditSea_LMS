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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Sales</h1>
      <p className="text-sm text-gray-500">Registered borrowers who haven&apos;t applied yet.</p>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && leads.length === 0 && (
        <p className="text-sm text-gray-500">No pending leads.</p>
      )}

      {leads.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead._id} className="border-b border-gray-100">
                <td className="py-2 pr-4">{lead.name}</td>
                <td className="py-2 pr-4">{lead.email}</td>
                <td className="py-2 pr-4">{lead.phone || "—"}</td>
                <td className="py-2 pr-4">{new Date(lead.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
