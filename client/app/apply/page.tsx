"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { saveApplicationId } from "@/lib/application";
import { Application } from "@/types/application";

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
    <main className="flex flex-1 items-center justify-center p-8">
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <p className="text-sm text-gray-500">Loading your application...</p>
      )}
    </main>
  );
}
