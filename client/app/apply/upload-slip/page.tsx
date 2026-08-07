"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetchForm, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getApplicationId } from "@/lib/application";
import { Application } from "@/types/application";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export default function UploadSlipPage() {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    const id = getApplicationId();

    if (!token) {
      router.replace("/onboarding/sign-in");
      return;
    }

    if (!id) {
      router.replace("/apply");
      return;
    }

    setApplicationId(id);
  }, [router]);

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
    <main className="flex flex-1 items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Upload salary slip</h1>
        <p className="text-sm text-gray-500">PDF, JPG or PNG — max 5MB</p>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="w-full text-sm"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload & continue"}
        </button>
      </form>
    </main>
  );
}
