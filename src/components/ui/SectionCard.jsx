import { SectionHeader } from "./SectionHeader";

/**
 * Reusable section card component combining Card with SectionHeader
 */
export const SectionCard = ({
  title,
  buttonText,
  onButtonClick,
  buttonIcon,
  bgColor = "bg-blue-500",
  buttonColor = "blue",
  children,
  className = "",
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <SectionHeader
        title={title}
        buttonText={buttonText}
        onButtonClick={onButtonClick}
        buttonIcon={buttonIcon}
        bgColor={bgColor}
        buttonColor={buttonColor}
      />
      <div className="p-2 md:p-4">{children}</div>
    </div>
  );
};
