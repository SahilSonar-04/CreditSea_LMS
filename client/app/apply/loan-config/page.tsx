"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useApplicationId, clearApplicationId } from "@/lib/application";
import { calculateSimpleInterest, calculateTotalRepayment, LOAN_LIMITS } from "@/lib/bre";
import { Application } from "@/types/application";
import ApplicationSteps from "@/components/ApplicationSteps";
import BrandMark from "@/components/BrandMark";

export default function LoanConfigPage() {
  const router = useRouter();
  const applicationId = useApplicationId();
  const [loanAmount, setLoanAmount] = useState(LOAN_LIMITS.MIN_AMOUNT);
  const [tenureDays, setTenureDays] = useState(LOAN_LIMITS.MIN_TENURE_DAYS);
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

  const simpleInterest = useMemo(
    () => calculateSimpleInterest(loanAmount, tenureDays),
    [loanAmount, tenureDays]
  );
  const totalRepayment = useMemo(
    () => calculateTotalRepayment(loanAmount, simpleInterest),
    [loanAmount, simpleInterest]
  );

  async function handleApply() {
    if (!applicationId) return;

    setError(null);
    setLoading(true);
    const token = getToken();

    try {
      await apiFetch<{ application: Application }>(`/applications/${applicationId}/apply`, {
        method: "PATCH",
        token: token || undefined,
        body: JSON.stringify({ loanAmount, tenureDays }),
      });
      clearApplicationId();
      router.push("/apply/success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const currency = (value: number) =>
    value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

  return (
    <main className="page-shell flex flex-1 items-center justify-center p-5 sm:p-8">
      <div className="surface-card w-full max-w-xl p-6 sm:p-8">
        <BrandMark />
        <div className="mt-6">
          <p className="text-sm font-semibold text-sky-700">Step 3 of 3</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Configure your loan</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Review a transparent estimate before you submit.</p>
        </div>
        <ApplicationSteps currentStep={3} />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Loan amount</span>
            <span>{currency(loanAmount)}</span>
          </div>
          <input
            type="range"
            min={LOAN_LIMITS.MIN_AMOUNT}
            max={LOAN_LIMITS.MAX_AMOUNT}
            step={1000}
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full accent-sky-600"
          />
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Tenure</span>
            <span>{tenureDays} days</span>
          </div>
          <input
            type="range"
            min={LOAN_LIMITS.MIN_TENURE_DAYS}
            max={LOAN_LIMITS.MAX_TENURE_DAYS}
            step={1}
            value={tenureDays}
            onChange={(e) => setTenureDays(Number(e.target.value))}
            className="w-full accent-sky-600"
          />
        </div>

        <div className="mt-6 space-y-3 rounded-xl border border-sky-100 bg-sky-50/70 p-5 text-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Your repayment estimate</p>
          <div className="flex justify-between">
            <span className="text-slate-500">Interest rate</span>
            <span>{LOAN_LIMITS.INTEREST_RATE}% p.a.</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Interest payable</span>
            <span>{currency(simpleInterest)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total repayment</span>
            <span>{currency(totalRepayment)}</span>
          </div>
        </div>

        {error && <p className="alert-error mt-4">{error}</p>}

        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          className="btn-primary mt-5 w-full"
        >
          {loading ? "Submitting..." : "Apply"}
        </button>
      </div>
    </main>
  );
}
