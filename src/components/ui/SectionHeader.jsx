import { Button } from "@ui/Button";

const buttonColorClasses = {
  blue: "bg-white text-blue-600 hover:bg-gray-100 border-0",
  green: "bg-white text-green-600 hover:bg-gray-100 border-0",
  orange: "bg-white text-orange-600 hover:bg-gray-100 border-0",
  purple: "bg-white text-purple-600 hover:bg-gray-100 border-0",
  indigo: "bg-white text-indigo-600 hover:bg-gray-100 border-0",
};

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
  return (
    <div
      className={`${bgColor} text-white px-2 md:px-4 py-2 md:py-4 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${className}`}
    >
      <h5 className="text-base md:text-lg font-semibold">{title}</h5>
      {buttonText && onButtonClick && (
        <Button
          variant="outline"
          size="md"
          onClick={onButtonClick}
          className={`${
            buttonColorClasses[buttonColor] || buttonColorClasses.blue
          } py-1.5 md:py-2 px-3 md:px-4 text-sm md:text-base`}
        >
          {buttonIcon && <span className="mr-1">{buttonIcon}</span>}
          {buttonText}
        </Button>
      )}
    </div>
  );
};
