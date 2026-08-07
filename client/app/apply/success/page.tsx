import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export default function ApplySuccessPage() {
  return (
    <main className="page-shell flex flex-1 items-center justify-center p-5 sm:p-8">
      <section className="surface-card w-full max-w-lg p-8 text-center sm:p-10">
        <BrandMark />
        <span className="mx-auto mt-8 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</span>
        <p className="mt-5 text-sm font-semibold text-sky-700">Application received</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">You&apos;re all set</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Your loan application is now pending review by our Sanction team. We&apos;ll move it forward as soon as the review is complete.
        </p>
        <div className="mt-7 rounded-xl bg-slate-50 p-4 text-left text-sm text-slate-600">
          <p className="font-bold text-slate-800">What happens next?</p>
          <p className="mt-1">Review → Sanction → Disbursement → Collection</p>
        </div>
        <Link href="/" className="btn-primary mt-7 inline-block">Back to home</Link>
      </section>
    </main>
  );
}
