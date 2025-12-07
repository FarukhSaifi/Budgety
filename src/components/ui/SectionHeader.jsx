/**
 * Reusable section header component with title and action button
 */
export const SectionHeader = ({
  title,
  buttonText,
  onButtonClick,
  buttonIcon,
  bgColor = "bg-blue-500",
  buttonColor = "blue",
  className = "",
}) => {
  const buttonColorClasses = {
    blue: "bg-white text-blue-600 hover:bg-gray-100",
    green: "bg-white text-green-600 hover:bg-gray-100",
    orange: "bg-white text-orange-600 hover:bg-gray-100",
    purple: "bg-white text-purple-600 hover:bg-gray-100",
    indigo: "bg-white text-indigo-600 hover:bg-gray-100",
  };

  return (
    <div
      className={`${bgColor} text-white px-2 md:px-4 py-2 md:py-4 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${className}`}
    >
      <h5 className="text-base md:text-lg font-semibold">{title}</h5>
      {buttonText && onButtonClick && (
        <button
          className={`${
            buttonColorClasses[buttonColor] || buttonColorClasses.blue
          } font-medium py-1.5 md:py-2 px-3 md:px-4 rounded-md transition-colors duration-200 flex items-center text-sm md:text-base`}
          onClick={onButtonClick}
        >
          {buttonIcon && <span className="mr-1">{buttonIcon}</span>}
          {buttonText}
        </button>
      )}
    </div>
  );
};
