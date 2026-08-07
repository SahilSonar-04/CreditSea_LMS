"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { AuthResponse } from "@/types/auth";
import BrandMark from "@/components/BrandMark";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch<AuthResponse>("/onboarding/sign-in", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveSession(data.token, data.user);

      router.push(data.user.role === "borrower" ? "/borrower" : `/dashboard/${data.user.role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell flex flex-1 items-center justify-center p-5 sm:p-8">
      <form onSubmit={handleSubmit} className="surface-card w-full max-w-md space-y-5 p-6 sm:p-8">
        <BrandMark />
        <div>
          <p className="text-sm font-semibold text-sky-700">Welcome back</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Sign in to your account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Continue your application or access your operations workspace.</p>
        </div>

        <div>
          <label htmlFor="email" className="field-label">Email</label>
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
          <label htmlFor="password" className="field-label">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-control"
          />
        </div>

        {error && <p className="alert-error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-center text-sm text-slate-500">
          No account?{" "}
          <Link href="/onboarding/sign-up" className="font-semibold text-sky-700 hover:text-sky-900">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
