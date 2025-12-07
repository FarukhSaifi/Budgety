export const ListItem = ({
  primary,
  secondary,
  tertiary,
  startIcon,
  endIcon,
  chips = [],
  actions,
  onClick,
  className = "",
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-start justify-between rounded-lg bg-gray-50 p-2 md:p-4 transition-all duration-200 gap-2 md:gap-4
        ${
          onClick
            ? "cursor-pointer hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-sm"
            : "cursor-default"
        }
        ${className}
      `}
    >
      <div className="flex flex-1 items-start gap-2 md:gap-4 min-w-0">
        {startIcon && (
          <div className="flex items-center flex-shrink-0">{startIcon}</div>
        )}
        <div className="min-w-0 flex-1 overflow-hidden">
          {primary && (
            <div
              className={`text-sm font-medium text-gray-900 truncate ${
                secondary ? "mb-1" : ""
              }`}
            >
              {primary}
            </div>
          )}
          {secondary && (
            <div className={`text-xs text-gray-600 ${tertiary ? "mb-1" : ""}`}>
              {secondary}
            </div>
          )}
          {tertiary && <div className="text-xs text-gray-600">{tertiary}</div>}
          {chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.map((chip, index) => {
                const chipLabel = typeof chip === "string" ? chip : chip.label;
                const chipVariant =
                  typeof chip === "string"
                    ? "outlined"
                    : chip.variant || "outlined";
                const chipColor =
                  typeof chip === "string"
                    ? "default"
                    : chip.color || "default";

                const variantClasses = {
                  outlined: "border border-gray-300 bg-transparent",
                  filled: "bg-gray-200 border-0",
                };

                const colorClasses = {
                  default: "text-gray-700 bg-gray-100",
                  primary: "text-blue-700 bg-blue-100 border-blue-300",
                  secondary: "text-gray-700 bg-gray-100",
                };

                const baseClasses =
                  "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium";
                const variantClass =
                  variantClasses[chipVariant] || variantClasses.outlined;
                const colorClass =
                  chipVariant === "filled"
                    ? colorClasses[chipColor] || colorClasses.default
                    : colorClasses[chipColor] || colorClasses.default;

                return (
                  <span
                    key={index}
                    className={`${baseClasses} ${variantClass} ${colorClass}`}
                  >
                    {chipLabel}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {(endIcon || actions) && (
        <div className="ml-2 md:ml-4 flex items-center gap-2 flex-shrink-0">
          {endIcon}
          {actions}
        </div>
      )}
    </div>
  );
};

export const ListItemGroup = ({
  children,
  spacing = "gap-2 md:gap-4",
  className = "",
}) => {
  return (
    <div className={`flex flex-col ${spacing} ${className}`}>{children}</div>
  );
};
