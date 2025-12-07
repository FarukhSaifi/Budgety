/**
 * Reusable empty state component
 */
export const EmptyState = ({
  message,
  icon,
  className = "",
  iconClassName = "",
}) => {
  return (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-4 text-center ${className}`}
    >
      {icon && (
        <span className={`mr-2 text-blue-600 ${iconClassName}`}>{icon}</span>
      )}
      <span className="text-sm md:text-base text-blue-800">{message}</span>
    </div>
  );
};
