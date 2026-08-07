import Link from "next/link";

interface BrandMarkProps {
  href?: string;
  light?: boolean;
}

export default function BrandMark({ href = "/", light = false }: BrandMarkProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-2" aria-label="CreditSea home">
      <span className={`flex size-9 items-center justify-center rounded-xl text-lg font-black ${light ? "bg-white/15 text-white" : "bg-cyan-500 text-slate-950"}`}>
        C
      </span>
      <span className={`text-xl font-bold tracking-tight ${light ? "text-white" : "text-slate-950"}`}>
        Credit<span className={light ? "text-cyan-300" : "text-sky-600"}>Sea</span>
      </span>
    </Link>
  );
}
