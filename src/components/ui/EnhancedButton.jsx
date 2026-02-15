import { CircularProgress } from "@mui/material";
import MuiButton from "@mui/material/Button";

const gradientClasses = {
  primary: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white",
  success: "bg-gradient-to-r from-pink-400 to-red-500 text-white",
  danger: "bg-gradient-to-r from-pink-500 to-yellow-400 text-white",
  info: "bg-gradient-to-r from-blue-400 to-cyan-400 text-white",
};

const variantClasses = {
  contained:
    "bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl border-0",
  outlined:
    "border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50",
  text: "bg-transparent text-gray-700 hover:bg-gray-100 border-0",
};

export const EnhancedButton = ({
  children,
  loading = false,
  gradient,
  icon: Icon,
  iconPosition = "start",
  fullWidth = false,
  className = "",
  variant = "contained",
  ...props
}) => {
  const gradientClass = gradient
    ? gradientClasses[gradient] || gradientClasses.primary
    : "";
  const variantClass =
    variantClasses[variant] ||
    (gradient ? gradientClasses.primary : variantClasses.contained);

  const tw =
    "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-300 min-h-0 normal-case " +
    (gradient ? gradientClass : variantClass) +
    (fullWidth ? " w-full" : "") +
    (loading
      ? " cursor-not-allowed opacity-70"
      : " hover:-translate-y-0.5 active:translate-y-0") +
    (className ? " " + className : "");

  return (
    <MuiButton
      className={tw}
      disabled={loading}
      variant="contained"
      color="inherit"
      {...props}
    >
      {Icon && iconPosition === "start" && !loading && (
        <Icon className="h-4 w-4 shrink-0" />
      )}
      {loading && (
        <CircularProgress size={16} className="text-current shrink-0" />
      )}
      {children}
      {Icon && iconPosition === "end" && !loading && (
        <Icon className="h-4 w-4 shrink-0" />
      )}
    </MuiButton>
  );
};
