import MuiButton from "@mui/material/Button";

const variantToMui = {
  primary: "contained",
  secondary: "contained",
  success: "contained",
  danger: "contained",
  warning: "contained",
  outline: "outlined",
  ghost: "text",
};

const variantClasses = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-0",
  secondary:
    "bg-gray-500 hover:bg-gray-600 text-white focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 border-0",
  success:
    "bg-green-600 hover:bg-green-700 text-white focus:ring-2 focus:ring-green-500 focus:ring-offset-2 border-0",
  danger:
    "bg-red-600 hover:bg-red-700 text-white focus:ring-2 focus:ring-red-500 focus:ring-offset-2 border-0",
  warning:
    "bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 border-0",
  outline:
    "bg-transparent border-2 border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
  ghost:
    "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 border-0",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm min-h-0",
  md: "px-4 py-2 text-base min-h-0",
  lg: "px-6 py-3 text-lg min-h-0",
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button",
  disabled = false,
  icon,
  fullWidth = false,
  ...props
}) => {
  const muiVariant = variantToMui[variant] ?? "contained";
  const tw =
    "font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center " +
    (variantClasses[variant] ?? variantClasses.primary) +
    " " +
    (sizeClasses[size] ?? sizeClasses.md) +
    (fullWidth ? " w-full" : "") +
    (className ? " " + className : "");

  return (
    <MuiButton
      type={type}
      variant={muiVariant}
      className={tw}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-2 shrink-0">{icon}</span>}
      {children}
    </MuiButton>
  );
};
