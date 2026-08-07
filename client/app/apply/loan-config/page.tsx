"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getApplicationId, clearApplicationId } from "@/lib/application";
import { calculateSimpleInterest, calculateTotalRepayment, LOAN_LIMITS } from "@/lib/bre";
import { Application } from "@/types/application";

export default function LoanConfigPage() {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [loanAmount, setLoanAmount] = useState(LOAN_LIMITS.MIN_AMOUNT);
  const [tenureDays, setTenureDays] = useState(LOAN_LIMITS.MIN_TENURE_DAYS);
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
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-xl font-semibold">Configure your loan</h1>

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
            className="w-full"
          />
        </div>

        <div className="space-y-2">
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
            className="w-full"
          />
        </div>

        <div className="space-y-1 rounded border border-gray-300 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Interest rate</span>
            <span>{LOAN_LIMITS.INTEREST_RATE}% p.a.</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Interest payable</span>
            <span>{currency(simpleInterest)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total repayment</span>
            <span>{currency(totalRepayment)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Apply"}
        </button>
      </div>
    </main>
  );
}
