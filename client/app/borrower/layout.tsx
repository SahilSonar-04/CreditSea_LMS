"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getToken, useSessionUser, clearSession } from "@/lib/auth";
import BrandMark from "@/components/BrandMark";

const NAV_ITEMS = [
  { href: "/borrower", label: "Dashboard" },
  { href: "/borrower/profile", label: "My Profile" },
  { href: "/borrower/applications", label: "All Loan Applications" },
  { href: "/borrower/loan", label: "Active Loan & Repayment" },
];

export default function BorrowerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSessionUser();

  useEffect(() => {
    if (user === undefined) return;

    if (!getToken() || !user) {
      router.replace("/onboarding/sign-in");
      return;
    }

    if (user.role !== "borrower") {
      router.replace(`/dashboard/${user.role}`);
      return;
    }
  }, [router, user]);

  function handleSignOut() {
    clearSession();
    router.replace("/onboarding/sign-in");
  }

  if (!user || user.role !== "borrower") {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <div className="min-h-0 flex flex-1 flex-col bg-slate-50 lg:flex-row">
      <aside className="brand-gradient shrink-0 p-5 text-white lg:w-64 lg:p-6">
        <div className="flex items-center justify-between lg:block">
          <BrandMark light />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 lg:mt-8">
            Borrower workspace
          </p>
        </div>
        <nav className="mt-5 flex gap-2 overflow-x-auto lg:mt-4 lg:block lg:space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition lg:block ${
                  active ? "bg-white/20 text-white" : "text-cyan-50 hover:bg-white/15 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
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
