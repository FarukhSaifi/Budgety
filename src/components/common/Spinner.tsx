import { cn } from "@utils/cn";

export interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <span
        className={cn(
          "inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary-main border-t-transparent",
          className,
        )}
      />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
