"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetchForm, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useApplicationId } from "@/lib/application";
import { Application } from "@/types/application";
import ApplicationSteps from "@/components/ApplicationSteps";
import BrandMark from "@/components/BrandMark";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export default function UploadSlipPage() {
  const router = useRouter();
  const applicationId = useApplicationId();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/onboarding/sign-in");
      return;
    }

    if (applicationId === null) {
      router.replace("/apply");
      return;
    }
  }, [applicationId, router]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    setError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Only PDF, JPG, and PNG files are allowed");
      setFile(null);
      return;
    }

    if (selected.size > MAX_SIZE_BYTES) {
      setError("File must be 5MB or smaller");
      setFile(null);
      return;
    }

    setFile(selected);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!applicationId || !file) {
      setError("Please choose a salary slip to upload");
      return;
    }

    const token = getToken();
    const formData = new FormData();
    formData.append("salarySlip", file);

    setLoading(true);

    try {
      await apiFetchForm<{ application: Application }>(
        `/applications/${applicationId}/upload-slip`,
        formData,
        { token: token || undefined }
      );
      router.push("/apply/loan-config");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell flex flex-1 items-center justify-center p-5 sm:p-8">
      <form onSubmit={handleSubmit} className="surface-card w-full max-w-xl p-6 sm:p-8">
        <BrandMark />
        <div className="mt-6">
          <p className="text-sm font-semibold text-sky-700">Step 2 of 3</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Upload your salary slip</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">A clear PDF, JPG, or PNG helps us process your application promptly.</p>
        </div>
        <ApplicationSteps currentStep={2} />

        <label className="block cursor-pointer rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/70 p-6 text-center transition hover:border-sky-400 hover:bg-sky-50">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-white text-xl text-sky-600 shadow-sm">↑</span>
          <span className="mt-3 block text-sm font-bold text-slate-800">Choose a salary slip</span>
          <span className="mt-1 block text-xs text-slate-500">PDF, JPG, or PNG · Maximum 5MB</span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        {file && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Selected: {file.name}</p>}

        {error && <p className="alert-error mt-4">{error}</p>}

        <button
          type="submit"
          disabled={loading || !file}
          className="btn-primary mt-5 w-full"
        >
          {loading ? "Uploading..." : "Upload & continue"}
        </button>
      </form>
    </main>
  );
}
