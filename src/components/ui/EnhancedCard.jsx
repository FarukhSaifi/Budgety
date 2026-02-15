import CardMui from "@mui/material/Card";

export const EnhancedCard = ({
  children,
  title,
  subtitle,
  gradient,
  className = "",
  actions,
}) => {
  const gradientStyle = gradient
    ? {
        background: `linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%)`,
      }
    : undefined;

  return (
    <CardMui
      elevation={0}
      className={`rounded-xl border border-gray-100 bg-white shadow-sm ${className}`}
      style={gradientStyle}
    >
      {title && (
        <div
          className={`px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 ${
            gradient ? "text-white" : "border-b border-gray-200"
          }`}
        >
          <h6 className="text-sm font-semibold sm:text-base">{title}</h6>
          {subtitle && (
            <p
              className={`mt-0.5 sm:mt-1 text-xs sm:text-sm ${
                gradient ? "opacity-90" : "text-gray-600"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="p-3 sm:p-4 md:p-4">{children}</div>
      {actions && <div className="px-6 pb-3">{actions}</div>}
    </CardMui>
  );
};
