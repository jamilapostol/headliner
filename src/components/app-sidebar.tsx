"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/nav";
import { logOut } from "@/lib/actions/auth";

const PLAN_LABEL: Record<string, string> = {
  free: "Free plan",
  pro: "Pro plan",
  touring: "Touring plan",
  team: "Team plan",
};

export function AppSidebar({ userName, plan, avatarUrl }: { userName: string; plan: string; avatarUrl: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatar = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt={userName} className="h-8 w-8 flex-none rounded-full object-cover" />
  ) : (
    <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-yellow text-[13px] font-bold text-canvas">{initials}</div>
  );
  const avatarSm = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt={userName} className="h-7 w-7 rounded-full object-cover" />
  ) : (
    <div className="grid h-7 w-7 place-items-center rounded-full bg-yellow text-[11px] font-bold text-canvas">{initials}</div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex flex-none items-center justify-between border-b border-border bg-sidebar px-4 py-3 md:hidden">
        <button onClick={() => setOpen(true)} className="cursor-pointer p-1 text-[20px] text-text" aria-label="Open menu">
          ☰
        </button>
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="HEADLINER" width={24} height={24} />
          <span className="text-[15px] font-bold tracking-[-.02em]">HEADLINER</span>
        </div>
        {avatarSm}
      </div>

      {/* Mobile drawer backdrop */}
      {open && <div className="animate-tp-fade fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar / drawer panel */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex w-[240px] flex-none -translate-x-full flex-col border-r border-border bg-sidebar transition-transform duration-200 md:static md:z-auto md:w-[216px] md:translate-x-0 ${open ? "translate-x-0" : ""}`}
      >
        <div className="hidden items-center gap-2.5 px-[18px] pt-5 pb-4 md:flex">
          <Image src="/logo.svg" alt="HEADLINER" width={30} height={30} />
          <div className="text-[16px] font-bold tracking-[-.02em]">HEADLINER</div>
        </div>
        <div className="flex flex-col gap-0.5 overflow-y-auto px-3 pt-4 md:pt-0">
          {NAV_ITEMS.map((nv) => {
            const active = nv.href === "/app" ? pathname === "/app" : pathname.startsWith(nv.href);
            return (
              <Link
                key={nv.href}
                href={nv.href}
                onClick={() => setOpen(false)}
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
          onClick={() => setOpen(false)}
          className="mx-3 mt-auto flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-[12.5px] font-medium text-white/60 hover:bg-white/5"
        >
          <span className="w-4 font-mono text-[11px] opacity-70">▤</span>
          Show-day view
        </Link>
        <div className="relative border-t border-border p-3.5">
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute bottom-full left-3.5 z-50 mb-2 w-[190px] overflow-hidden rounded-[10px] border border-white/10 bg-[#1a211b] shadow-xl">
                <Link
                  href="/app/account"
                  onClick={() => {
                    setMenuOpen(false);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2.5 text-[13px] text-text hover:bg-white/5"
                >
                  Profile
                </Link>
                <Link
                  href="/app/billing"
                  onClick={() => {
                    setMenuOpen(false);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2.5 text-[13px] text-text hover:bg-white/5"
                >
                  Billing
                </Link>
                <form action={logOut}>
                  <button
                    type="submit"
                    className="flex w-full cursor-pointer items-center gap-2 border-t border-white/10 px-3.5 py-2.5 text-left text-[13px] text-white/70 hover:bg-white/5"
                  >
                    Log out
                  </button>
                </form>
              </div>
            </>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-1 hover:bg-white/5"
          >
            {avatar}
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[13px] font-semibold">{userName}</div>
              <div className="text-[11px] text-white/45">{PLAN_LABEL[plan] ?? plan}</div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
