/**
 * Reusable form container component with consistent styling
 */
export const FormContainer = ({
  title,
  children,
  onSubmit,
  className = "",
}) => {
  return (
    <div
      className={`mb-2 md:mb-4 p-2 md:p-4 bg-gray-50 rounded-lg ${className}`}
    >
      {title && (
        <h6 className="text-base md:text-lg font-semibold mb-2">{title}</h6>
      )}
      {onSubmit ? (
        <form onSubmit={onSubmit}>{children}</form>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
};

