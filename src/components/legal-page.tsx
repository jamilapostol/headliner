import Image from "next/image";
import Link from "next/link";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-12 text-text sm:px-10 sm:py-16" data-theme="dark">
      <div className="mx-auto max-w-[720px]">
        <Link href="/" className="mb-10 flex items-center gap-2.5">
          <Image src="/logo.svg" alt="HEADLINER" width={26} height={26} />
          <span className="text-[14px] font-bold">HEADLINER</span>
        </Link>

        <h1 className="mb-2 text-[30px] tracking-[-.02em] sm:text-[36px]">{title}</h1>
        <div className="mb-10 font-mono text-[11.5px] text-white/40">Last updated {updated}</div>

        <div className="legal-copy flex flex-col gap-4 text-[14.5px] leading-[1.7] text-white/70">{children}</div>

        <div className="mt-14 border-t border-border pt-6 text-[12.5px] text-white/40">
          <Link href="/" className="text-accent">
            ← Back to HEADLINER
          </Link>
        </div>
      </div>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-4 mb-1 text-[19px] font-semibold tracking-[-.01em] text-text">{children}</h2>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-col gap-1.5 pl-5 [&>li]:list-disc">{children}</ul>;
}
