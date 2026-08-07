"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, useSessionUser, clearSession } from "@/lib/auth";
import { UserRole } from "@/types/auth";
import BrandMark from "@/components/BrandMark";

const MODULES: { role: Exclude<UserRole, "admin" | "borrower">; label: string }[] = [
  { role: "sales", label: "Sales" },
  { role: "sanction", label: "Sanction" },
  { role: "disbursement", label: "Disbursement" },
  { role: "collection", label: "Collection" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useSessionUser();

  useEffect(() => {
    if (user === undefined) return;

    const token = getToken();
    const currentUser = user;

    if (!token || !currentUser) {
      router.replace("/onboarding/sign-in");
      return;
    }

    if (currentUser.role === "borrower") {
      router.replace("/apply");
      return;
    }

  }, [router, user]);

  function handleSignOut() {
    clearSession();
    router.replace("/onboarding/sign-in");
  }

  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  const visibleModules = MODULES.filter((m) => user.role === "admin" || user.role === m.role);

  return (
    <div className="min-h-0 flex flex-1 flex-col bg-slate-50 lg:flex-row">
      <aside className="brand-gradient shrink-0 p-5 text-white lg:w-64 lg:p-6">
        <div className="flex items-center justify-between lg:block">
          <BrandMark light />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 lg:mt-8">{user.role} workspace</p>
        </div>
        <nav className="mt-5 flex gap-2 overflow-x-auto lg:mt-4 lg:block lg:space-y-1">
          {visibleModules.map((m) => (
            <Link
              key={m.role}
              href={`/dashboard/${m.role}`}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-cyan-50 transition hover:bg-white/15 hover:text-white lg:block"
            >
              {m.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-5 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-white/15 lg:mt-8 lg:w-full lg:text-left"
        >
          Sign out
        </button>
      </aside>
      <div className="flex-1 overflow-auto p-5 sm:p-8">{children}</div>
    </div>
  );
}
