"use client";

import { UI_TEXT } from "@constants";
import { isPrimaryNavPathActive } from "@constants/routes";
import { cn } from "@utils/cn";
import { AddIcon } from "@components/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV_ITEMS } from "./navigation";

export interface BottomNavProps {
  onFabClick?: () => void;
}

export function BottomNav({ onFabClick }: BottomNavProps) {
  const pathname = usePathname();

  const left = PRIMARY_NAV_ITEMS.slice(0, 2);
  const right = PRIMARY_NAV_ITEMS.slice(2);

  const renderItem = (item: (typeof PRIMARY_NAV_ITEMS)[number]) => {
    const Icon = item.icon;
    const isActive = isPrimaryNavPathActive(pathname, item.id);
    return (
      <Link
        key={item.id}
        href={item.href}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
          isActive ? "text-primary-main" : "text-on-surface-variant",
        )}
      >
        <Icon className={cn("h-5 w-5", isActive && "scale-105")} />
        <span className="leading-none">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 z-1000 border-t border-outline-variant/60 md:hidden safe-area-inset-bottom">
      <div className="relative flex h-[68px] items-stretch px-1">
        {left.map(renderItem)}

        <div className="relative flex w-16 shrink-0 justify-center">
          <button
            type="button"
            onClick={onFabClick}
            aria-label={UI_TEXT.ADD_TRANSACTION}
            className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-white shadow-elevated transition-transform active:scale-95"
          >
            <AddIcon className="h-7 w-7" />
          </button>
        </div>

        {right.map(renderItem)}
      </div>
    </nav>
  );
}
