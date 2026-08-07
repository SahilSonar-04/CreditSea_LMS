"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getApplicationId } from "@/lib/application";
import { checkBreClientSide } from "@/lib/bre";
import { Application, EmploymentMode } from "@/types/application";

const EMPLOYMENT_MODES: EmploymentMode[] = ["Salaried", "Self-Employed", "Unemployed"];

export default function PersonalDetailsPage() {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [pan, setPan] = useState("");
  const [dob, setDob] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [employmentMode, setEmploymentMode] = useState<EmploymentMode | "">("");

  const [serverReasons, setServerReasons] = useState<string[]>([]);
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

  const livePreview = useMemo(() => {
    if (!pan || !dob || !monthlySalary || !employmentMode) return null;

    return checkBreClientSide({
      pan: pan.toUpperCase(),
      dob,
      monthlySalary: Number(monthlySalary),
      employmentMode,
    });
  }, [pan, dob, monthlySalary, employmentMode]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setServerReasons([]);

    if (!applicationId) return;

    const token = getToken();
    setLoading(true);

    try {
      await apiFetch<{ application: Application }>(
        `/applications/${applicationId}/personal-details`,
        {
          method: "PATCH",
          token: token || undefined,
          body: JSON.stringify({
            fullName,
            pan: pan.toUpperCase(),
            dob,
            monthlySalary: Number(monthlySalary),
            employmentMode,
          }),
        }
      );
      router.push("/apply/upload-slip");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setServerReasons((err.data.breReasons as string[] | undefined) || []);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Personal details</h1>

        <div className="space-y-1">
          <label htmlFor="fullName" className="text-sm font-medium">Full name</label>
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="pan" className="text-sm font-medium">PAN</label>
          <input
            id="pan"
            required
            placeholder="ABCDE1234F"
            value={pan}
            onChange={(e) => setPan(e.target.value.toUpperCase())}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm uppercase"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="dob" className="text-sm font-medium">Date of birth</label>
          <input
            id="dob"
            type="date"
            required
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="monthlySalary" className="text-sm font-medium">Monthly salary (₹)</label>
          <input
            id="monthlySalary"
            type="number"
            min={0}
            required
            value={monthlySalary}
            onChange={(e) => setMonthlySalary(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="employmentMode" className="text-sm font-medium">Employment mode</label>
          <select
            id="employmentMode"
            required
            value={employmentMode}
            onChange={(e) => setEmploymentMode(e.target.value as EmploymentMode)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>Select one</option>
            {EMPLOYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </div>

        {livePreview && !livePreview.passed && (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-medium">This may not pass eligibility:</p>
            <ul className="list-disc pl-4">
              {livePreview.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">{error}</p>
            {serverReasons.length > 0 && (
              <ul className="list-disc pl-4">
                {serverReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Checking eligibility..." : "Continue"}
        </button>
      </form>
    </main>
  );
}
