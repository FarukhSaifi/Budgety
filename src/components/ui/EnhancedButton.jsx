import React from "react";
import { CircularProgress } from "@mui/material";

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
  const gradientStyles = {
    primary: "bg-gradient-to-r from-indigo-500 to-purple-600",
    success: "bg-gradient-to-r from-pink-400 to-red-500",
    danger: "bg-gradient-to-r from-pink-500 to-yellow-400",
    info: "bg-gradient-to-r from-blue-400 to-cyan-400",
  };

  const variantStyles = {
    contained: gradient
      ? `${gradientStyles[gradient] || gradientStyles.primary} text-white shadow-lg hover:shadow-xl`
      : "bg-black text-white hover:bg-gray-800",
    outlined: "border-2 border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50",
    text: "bg-transparent text-gray-700 hover:bg-gray-100",
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5
        text-sm font-semibold transition-all duration-300
        ${variantStyles[variant] || variantStyles.contained}
        ${fullWidth ? "w-full" : ""}
        ${loading ? "cursor-not-allowed opacity-70" : "hover:-translate-y-0.5 active:translate-y-0"}
        ${className}
      `}
      disabled={loading}
      {...props}
    >
      {Icon && iconPosition === "start" && !loading && (
        <Icon className="h-4 w-4" />
      )}
      {loading && (
        <CircularProgress size={16} className="text-current" />
      )}
      {children}
      {Icon && iconPosition === "end" && !loading && (
        <Icon className="h-4 w-4" />
      )}
    </button>
  );
};

