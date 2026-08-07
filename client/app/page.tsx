"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, useSessionUser } from "@/lib/auth";
import BrandMark from "@/components/BrandMark";

export default function Home() {
  const router = useRouter();
  const user = useSessionUser();

  useEffect(() => {
    if (user === undefined) return;
    if (!user || !getToken()) return;

    router.replace(user.role === "borrower" ? "/borrower" : `/dashboard/${user.role}`);
  }, [router, user]);
  return (
    <main className="page-shell flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
        <BrandMark />
        <Link href="/onboarding/sign-in" className="text-sm font-semibold text-sky-700 hover:text-sky-900">
          Sign in
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-sky-700">Borrowing made easy</p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Digital. Transparent. <span className="text-sky-600">Prompt.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            Apply for your loan in a few clear steps, then follow its progress with a secure, role-aware process.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/onboarding/sign-up" className="btn-primary px-5 py-3">Get started</Link>
            <Link href="/onboarding/sign-in" className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:border-sky-300 hover:text-sky-700">Sign in</Link>
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="brand-gradient p-6 text-white">
            <p className="text-sm font-semibold text-cyan-100">A simpler loan journey</p>
            <p className="mt-2 text-2xl font-bold">Everything clear, every step of the way.</p>
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ["Quick approval", "Clear eligibility feedback before you apply."],
              ["Instant progress", "Track your application through each stage."],
              ["Trusted & secure", "Role-gated access protects every operation."],
            ].map(([title, description], index) => (
              <div key={title} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">0{index + 1}</span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
