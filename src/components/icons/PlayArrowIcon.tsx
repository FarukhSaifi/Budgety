import type { IconProps } from "./types";

/** Stitch Material Symbol: `play_arrow` */
export function PlayArrowIcon({ size = 24, title, className, ...props }: IconProps) {
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
      <path d="M320-200v-560l440 280-440 280Z" />
    </svg>
  );
}
