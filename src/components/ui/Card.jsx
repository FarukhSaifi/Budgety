import CardMui from "@mui/material/Card";

const rootClasses =
  "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-full";

export const Card = ({ children, className = "", onClick }) => {
  return (
    <CardMui
      className={`${rootClasses} ${className}`}
      onClick={onClick}
      elevation={0}
    >
      {children}
    </CardMui>
  );
};

export const CardHeader = ({
  children,
  className = "",
  bgColor = "bg-blue-500",
}) => {
  return (
    <div
      className={`${bgColor} text-white px-2 md:px-4 py-2 md:py-4 ${className}`}
    >
      {children}
    </div>
  );
};

export const CardBody = ({ children, className = "" }) => {
  return (
    <div
      className={`p-2 md:p-4 w-full max-w-full overflow-x-hidden ${className}`}
    >
      {children}
    </div>
  );
};
