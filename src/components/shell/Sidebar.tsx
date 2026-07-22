"use client";

import { APP_LOGO_ALT, APP_LOGO_SRC, APP_NAME } from "@constants";
import { cn } from "@utils/cn";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV_ITEMS, SECONDARY_NAV_ITEMS } from "./navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-nav fixed left-0 top-0 z-1000 hidden h-screen w-20 flex-col items-center border-r border-primary-soft/60 py-4 md:flex">
      <Link
        href="/"
        className="mb-6 flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl shadow-glow"
      >
        <Image
          src={APP_LOGO_SRC}
          alt={APP_LOGO_ALT}
          width={44}
          height={44}
          className="h-11 w-11 object-contain"
          priority
        />
      </Link>
      <p className="sr-only">{APP_NAME}</p>
      <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition-colors",
                isActive
                  ? "bg-primary-soft text-primary-main"
                  : "text-gray-400 hover:bg-surface-low hover:text-brand-deep",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
        <div className="my-2 h-px w-10 bg-primary-soft" />
        {SECONDARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition-colors",
                isActive
                  ? "bg-primary-soft text-primary-main"
                  : "text-gray-400 hover:bg-surface-low hover:text-brand-deep",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
