"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/camera")) return null;

  const isHome = pathname === "/home";
  const isMy = pathname.startsWith("/my");

  return (
    <nav className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="flex h-[64px] w-full max-w-[290px] items-center rounded-full border border-neutral-200 bg-white px-3 shadow-[0_3px_10px_rgba(0,0,0,0.06)]">

        {/* HOME */}
        <Link
          href="/home"
          className={`flex flex-1 items-center justify-center text-[13px] font-semibold tracking-[0.14em] transition-colors ${
            isHome ? "text-black" : "text-neutral-400"
          }`}
        >
          HOME
        </Link>

        {/* CAMERA */}
        <Link
          href="/camera"
          aria-label="Camera"
          className="mx-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ff00ff] transition active:scale-95"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white">
            <div className="h-2.5 w-2.5 rounded-full bg-white" />
          </div>
        </Link>

        {/* MY */}
        <Link
          href="/my"
          className={`flex flex-1 items-center justify-center text-[13px] font-semibold tracking-[0.14em] transition-colors ${
            isMy ? "text-black" : "text-neutral-400"
          }`}
        >
          MY
        </Link>
      </div>
    </nav>
  );
}