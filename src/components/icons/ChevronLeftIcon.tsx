import type { IconProps } from "./types";

/** Stitch Material Symbol: `chevron_left` */
export function ChevronLeftIcon({ size = 24, title, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      {...props}
    >
      <path d="M561-240 320-481l241-241 43 43-198 198 198 198-43 43Z" />
    </svg>
  );
}
