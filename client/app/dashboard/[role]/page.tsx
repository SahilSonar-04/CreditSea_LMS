"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthUser } from "@/types/auth";
import SalesModule from "@/components/dashboard/SalesModule";
import SanctionModule from "@/components/dashboard/SanctionModule";
import DisbursementModule from "@/components/dashboard/DisbursementModule";
import CollectionModule from "@/components/dashboard/CollectionModule";

const VALID_ROLES = ["sales", "sanction", "disbursement", "collection"] as const;
type DashboardRole = (typeof VALID_ROLES)[number];

function isDashboardRole(value: string): value is DashboardRole {
  return (VALID_ROLES as readonly string[]).includes(value);
}

export default function DashboardModulePage() {
  const router = useRouter();
  const params = useParams<{ role: string }>();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.replace("/onboarding/sign-in");
      return;
    }

    if (!isDashboardRole(params.role)) {
      router.replace(currentUser.role === "borrower" ? "/apply" : `/dashboard/${currentUser.role}`);
      return;
    }

    if (currentUser.role !== "admin" && currentUser.role !== params.role) {
      router.replace(`/dashboard/${currentUser.role}`);
      return;
    }

    setUser(currentUser);
    setAllowed(true);
  }, [params.role, router]);

  if (!allowed || !user || !isDashboardRole(params.role)) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  switch (params.role) {
    case "sales":
      return <SalesModule />;
    case "sanction":
      return <SanctionModule />;
    case "disbursement":
      return <DisbursementModule />;
    case "collection":
      return <CollectionModule />;
  }
}
