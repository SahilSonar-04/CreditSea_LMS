"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";

const MODULES = [
  { role: "sales", label: "Sales" },
  { role: "sanction", label: "Sanction" },
  { role: "disbursement", label: "Disbursement" },
  { role: "collection", label: "Collection" },
];

export default function AdminOverviewPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/onboarding/sign-in");
      return;
    }
    if (user.role !== "admin") {
      router.replace(user.role === "borrower" ? "/apply" : `/dashboard/${user.role}`);
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Admin overview</h1>
      <p className="text-sm text-gray-500">As an admin you have access to every operations module.</p>
      <div className="grid max-w-md gap-2">
        {MODULES.map((m) => (
          <Link
            key={m.role}
            href={`/dashboard/${m.role}`}
            className="rounded border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50"
          >
            {m.label} module
          </Link>
        ))}
      </div>
    </div>
  );
}
