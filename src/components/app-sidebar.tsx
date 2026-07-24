"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { logOut } from "@/lib/actions/auth";

const PLAN_LABEL: Record<string, string> = {
  free: "Free plan",
  pro: "Pro plan",
  touring: "Touring plan",
  team: "Team plan",
};

export function AppSidebar({ userName, plan }: { userName: string; plan: string }) {
  const pathname = usePathname();
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex w-[216px] flex-none flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-[18px] pt-5 pb-4">
        <Image src="/logo.svg" alt="HEADLINER" width={30} height={30} />
        <div className="text-[16px] font-bold tracking-[-.02em]">HEADLINER</div>
      </div>
      <div className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((nv) => {
          const active = nv.href === "/app" ? pathname === "/app" : pathname.startsWith(nv.href);
          return (
            <Link
              key={nv.href}
              href={nv.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-[13.5px] font-medium hover:bg-white/5"
              style={{ color: active ? "#0d110e" : "rgba(233,236,232,.75)", background: active ? "#3fe87a" : "transparent" }}
            >
              <span className="w-4 font-mono text-[11px] opacity-70">{nv.glyph}</span>
              {nv.label}
              {nv.soon && <span className="ml-auto font-mono text-[9px] tracking-[.08em] opacity-60">SOON</span>}
            </Link>
          );
        })}
      </div>
      <Link
        href="/mobile"
        className="mx-3 mt-auto flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-[12.5px] font-medium text-white/60 hover:bg-white/5"
      >
        <span className="w-4 font-mono text-[11px] opacity-70">▤</span>
        Show-day view
      </Link>
      <div className="flex items-center gap-2.5 border-t border-border p-3.5">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-yellow text-[13px] font-bold text-canvas">{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{userName}</div>
          <div className="text-[11px] text-white/45">{PLAN_LABEL[plan] ?? plan}</div>
        </div>
        <form action={logOut}>
          <button type="submit" title="Log out" className="cursor-pointer px-1.5 text-[12px] text-white/40 hover:text-text">
            ⏻
          </button>
        </form>
      </div>
    </div>
  );
}
