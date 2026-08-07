"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSessionUser } from "@/lib/auth";
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
  const user = useSessionUser();
  const isValidModule = isDashboardRole(params.role);
  const allowed = Boolean(user && isValidModule && (user.role === "admin" || user.role === params.role));

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      router.replace("/onboarding/sign-in");
      return;
    }

    if (!isValidModule) {
      router.replace(user.role === "borrower" ? "/apply" : `/dashboard/${user.role}`);
      return;
    }

    if (user.role !== "admin" && user.role !== params.role) {
      router.replace(`/dashboard/${user.role}`);
      return;
    }
  }, [isValidModule, params.role, router, user]);

  if (!allowed || !user || !isValidModule) {
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
