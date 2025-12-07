/**
 * Reusable page container component with consistent spacing
 */
export const PageContainer = ({ children, className = "" }) => {
  return (
    <div className={`mx-auto mb-2 md:mb-4 ${className}`}>{children}</div>
  );
};

