"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { saveApplicationId } from "@/lib/application";
import { Application } from "@/types/application";
import BrandMark from "@/components/BrandMark";

function nextStepFor(application: Application): string {
  if (application.breStatus !== "passed") return "/apply/personal-details";
  if (!application.salarySlipUrl) return "/apply/upload-slip";
  if (application.status === "DRAFT") return "/apply/loan-config";
  return "/apply/success";
}

export default function ApplyEntryPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/onboarding/sign-in");
      return;
    }

    async function bootstrap() {
      try {
        const data = await apiFetch<{ application: Application }>("/applications", {
          method: "POST",
          token: token || undefined,
        });
        saveApplicationId(data.application._id);
        router.replace(nextStepFor(data.application));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Something went wrong");
      }
    }

    bootstrap();
  }, [router]);

  return (
    <main className="page-shell flex flex-1 items-center justify-center p-5 sm:p-8">
      <div className="surface-card w-full max-w-md p-6 text-center sm:p-8">
        <BrandMark />
      {error ? (
        <p className="alert-error mt-6 text-left">{error}</p>
      ) : (
        <>
          <span className="mx-auto mt-8 block size-8 animate-spin rounded-full border-4 border-sky-100 border-t-sky-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading your application...</p>
          <p className="mt-1 text-xs text-slate-500">Checking where you left off.</p>
        </>
      )}
      </div>
    </main>
  );
}
