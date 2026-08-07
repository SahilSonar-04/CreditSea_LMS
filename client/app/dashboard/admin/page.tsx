"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSessionUser } from "@/lib/auth";

const MODULES = [
  { role: "sales", label: "Sales" },
  { role: "sanction", label: "Sanction" },
  { role: "disbursement", label: "Disbursement" },
  { role: "collection", label: "Collection" },
];

export default function AdminOverviewPage() {
  const router = useRouter();
  const user = useSessionUser();
  const allowed = user?.role === "admin";

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      router.replace("/onboarding/sign-in");
      return;
    }
    if (user.role !== "admin") {
      router.replace(user.role === "borrower" ? "/apply" : `/dashboard/${user.role}`);
      return;
    }
  }, [router, user]);

  if (!allowed) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold text-sky-700">Operations overview</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Admin workspace</h1>
      <p className="mt-2 text-sm text-slate-500">You have access to every stage of the loan lifecycle.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {MODULES.map((m) => (
          <Link
            key={m.role}
            href={`/dashboard/${m.role}`}
            className="surface-card group p-5 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg"
          >
            <span className="text-sky-600">{m.label}</span>
            <span className="float-right text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-600">→</span>
            <span className="mt-2 block text-xs font-normal text-slate-500">Open the {m.label.toLowerCase()} queue</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
