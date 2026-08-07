"use client";

import { useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { validatePasswordClient, validatePhoneClient } from "@/lib/validation";
import { AuthResponse } from "@/types/auth";
import BrandMark from "@/components/BrandMark";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [serverPasswordReasons, setServerPasswordReasons] = useState<string[]>([]);
  const [serverPhoneReasons, setServerPhoneReasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ phone: false, password: false });

  const passwordCheck = useMemo(() => validatePasswordClient(password), [password]);
  const phoneCheck = useMemo(() => validatePhoneClient(phone), [phone]);

  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && passwordCheck.valid && phoneCheck.valid;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setServerPasswordReasons([]);
    setServerPhoneReasons([]);
    setTouched({ phone: true, password: true });

    if (!passwordCheck.valid || !phoneCheck.valid) {
      setError("Please fix the highlighted fields before continuing");
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch<AuthResponse>("/onboarding/sign-up", {
        method: "POST",
        body: JSON.stringify({ name, email, phone, password }),
      });
      saveSession(data.token, data.user);
      router.push("/borrower");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setServerPasswordReasons((err.data.passwordReasons as string[] | undefined) || []);
        setServerPhoneReasons((err.data.phoneReasons as string[] | undefined) || []);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell flex flex-1 items-center justify-center p-5 sm:p-8">
      <form onSubmit={handleSubmit} className="surface-card w-full max-w-md space-y-5 p-6 sm:p-8">
        <BrandMark />
        <div>
          <p className="text-sm font-semibold text-sky-700">Start your journey</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">It only takes a minute to begin your application.</p>
        </div>

        <div>
          <label htmlFor="name" className="field-label">
            Full name <span className="text-rose-500">*</span>
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-control"
          />
        </div>

        <div>
          <label htmlFor="email" className="field-label">
            Email <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-control"
          />
        </div>

        <div>
          <label htmlFor="phone" className="field-label">
            Phone <span className="text-rose-500">*</span>
          </label>
          <input
            id="phone"
            required
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            className="field-control"
          />
          {touched.phone && !phoneCheck.valid && (
            <p className="mt-1 text-xs text-rose-600">{phoneCheck.reasons[0]}</p>
          )}
          {serverPhoneReasons.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-xs text-rose-600">
              {serverPhoneReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password <span className="text-rose-500">*</span>
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            className="field-control"
          />
          <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
            {[
              { label: "At least 8 characters", met: password.length >= 8 },
              { label: "One uppercase letter", met: /[A-Z]/.test(password) },
              { label: "One lowercase letter", met: /[a-z]/.test(password) },
              { label: "One number", met: /[0-9]/.test(password) },
              { label: "One symbol", met: /[^a-zA-Z0-9\s]/.test(password) },
            ].map((rule) => (
              <li
                key={rule.label}
                className={`flex items-center gap-1.5 ${rule.met ? "text-emerald-600" : "text-slate-400"}`}
              >
                <span>{rule.met ? "✓" : "○"}</span>
                {rule.label}
              </li>
            ))}
          </ul>
          {serverPasswordReasons.length > 0 && (
            <ul className="mt-2 list-disc pl-4 text-xs text-rose-600">
              {serverPasswordReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="alert-error">{error}</p>}

        <button type="submit" disabled={loading || !canSubmit} className="btn-primary w-full">
          {loading ? "Creating account..." : "Sign up"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/onboarding/sign-in" className="font-semibold text-sky-700 hover:text-sky-900">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
