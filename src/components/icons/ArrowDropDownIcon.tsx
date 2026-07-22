import type { IconProps } from "./types";

/** Stitch Material Symbol: `arrow_drop_down` */
export function ArrowDropDownIcon({ size = 24, title, className, ...props }: IconProps) {
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
      <path d="M480-360 280-560h400L480-360Z"/>
    </svg>
  );
}
