"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, useSessionUser, clearSession } from "@/lib/auth";
import { UserRole } from "@/types/auth";

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
    <div className="flex flex-1">
      <aside className="w-48 shrink-0 border-r border-gray-200 p-4">
        <p className="mb-4 text-xs font-medium uppercase text-gray-400">{user.role} dashboard</p>
        <nav className="space-y-1">
          {visibleModules.map((m) => (
            <Link
              key={m.role}
              href={`/dashboard/${m.role}`}
              className="block rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {m.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 w-full rounded border border-gray-300 px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
        >
          Sign out
        </button>
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
