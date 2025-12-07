export const MetricCard = ({
  value,
  label,
  subValue,
  icon: Icon,
  color = "text-gray-900",
  size = "medium",
  align = "left",
  className = "",
}) => {
  const sizeClasses = {
    small: {
      value: "text-base",
      label: "text-xs",
      subValue: "text-xs",
    },
    medium: {
      value: "text-lg md:text-xl",
      label: "text-xs",
      subValue: "text-xs md:text-sm",
    },
    large: {
      value: "text-xl md:text-2xl lg:text-3xl",
      label: "text-xs",
      subValue: "text-xs md:text-sm",
    },
  };

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const colorClasses = {
    "text.primary": "text-gray-900",
    "success.main": "text-green-600",
    "error.main": "text-red-600",
  };

  const textColor = colorClasses[color] || color || "text-gray-900";
  const config = sizeClasses[size];
  const alignClass = alignClasses[align] || alignClasses.left;

  return (
    <div className={`${alignClass} ${className}`}>
      {Icon && (
        <div
          className={`mb-2 flex ${
            align === "center" ? "justify-center" : "justify-start"
          }`}
        >
          <Icon className={`h-6 w-6 ${textColor}`} />
        </div>
      )}
      <div className={`mb-1 font-bold ${config.value} ${textColor}`}>
        {value}
      </div>
      {subValue && (
        <div className={`mb-1 ${config.subValue} text-gray-600`}>
          {subValue}
        </div>
      )}
      {label && <div className={`${config.label} text-gray-600`}>{label}</div>}
    </div>
  );
};
