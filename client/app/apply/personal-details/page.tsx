"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useApplicationId } from "@/lib/application";
import { checkBreClientSide } from "@/lib/bre";
import { Application, EmploymentMode } from "@/types/application";
import ApplicationSteps from "@/components/ApplicationSteps";
import BrandMark from "@/components/BrandMark";

const EMPLOYMENT_MODES: EmploymentMode[] = ["Salaried", "Self-Employed", "Unemployed"];

function formatDobInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8); // DDMMYYYY
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
}
function parseDobToIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);

  const date = new Date(year, month - 1, day);
  const isValid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  if (!isValid) return null;

  return `${yyyy}-${mm}-${dd}`;
}

export default function PersonalDetailsPage() {
  const router = useRouter();
  const applicationId = useApplicationId();

  const [fullName, setFullName] = useState("");
  const [pan, setPan] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [employmentMode, setEmploymentMode] = useState<EmploymentMode | "">("");

  const [serverReasons, setServerReasons] = useState<string[]>([]);
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

  const dobIso = useMemo(() => parseDobToIso(dobInput), [dobInput]);
  const dobComplete = dobInput.length === 10;
  const dobInvalid = dobComplete && !dobIso;

  const livePreview = useMemo(() => {
    if (!pan || !dobIso || !monthlySalary || !employmentMode) return null;

    return checkBreClientSide({
      pan: pan.toUpperCase(),
      dob: dobIso,
      monthlySalary: Number(monthlySalary),
      employmentMode,
    });
  }, [pan, dobIso, monthlySalary, employmentMode]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setServerReasons([]);

    if (!applicationId) return;

    if (!dobIso) {
      setError("Please enter a valid date of birth in DD/MM/YYYY format");
      return;
    }

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
            dob: dobIso,
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
    <main className="page-shell flex flex-1 items-center justify-center p-5 sm:p-8">
      <form onSubmit={handleSubmit} className="surface-card w-full max-w-xl p-6 sm:p-8">
        <BrandMark />
        <div className="mt-6">
          <p className="text-sm font-semibold text-sky-700">Step 1 of 3</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Tell us about yourself</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">We&apos;ll check your eligibility instantly and securely.</p>
        </div>
        <ApplicationSteps currentStep={1} />

        <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="field-label">Full name</label>
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="field-control"
          />
        </div>

        <div>
          <label htmlFor="pan" className="field-label">PAN</label>
          <input
            id="pan"
            required
            placeholder="ABCDE1234F"
            value={pan}
            onChange={(e) => setPan(e.target.value.toUpperCase())}
            className="field-control uppercase"
          />
        </div>

        <div>
          <label htmlFor="dob" className="field-label">Date of birth</label>
          <input
            id="dob"
            type="text"
            inputMode="numeric"
            required
            placeholder="DD/MM/YYYY"
            maxLength={10}
            value={dobInput}
            onChange={(e) => setDobInput(formatDobInput(e.target.value))}
            className="field-control"
          />
          {dobInvalid && (
            <p className="mt-1 text-xs text-rose-600">Enter a valid date as DD/MM/YYYY</p>
          )}
        </div>

        <div>
          <label htmlFor="monthlySalary" className="field-label">Monthly salary (₹)</label>
          <input
            id="monthlySalary"
            type="number"
            min={0}
            required
            value={monthlySalary}
            onChange={(e) => setMonthlySalary(e.target.value)}
            className="field-control"
          />
        </div>
        </div>

        <div className="mt-4">
          <label htmlFor="employmentMode" className="field-label">Employment mode</label>
          <select
            id="employmentMode"
            required
            value={employmentMode}
            onChange={(e) => setEmploymentMode(e.target.value as EmploymentMode)}
            className="field-control"
          >
            <option value="" disabled>Select one</option>
            {EMPLOYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </div>

        {livePreview && !livePreview.passed && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">This may not pass eligibility:</p>
            <ul className="list-disc pl-4">
              {livePreview.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="alert-error mt-4">
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
          className="btn-primary mt-5 w-full"
        >
          {loading ? "Checking eligibility..." : "Continue"}
        </button>
      </form>
    </main>
  );
}
