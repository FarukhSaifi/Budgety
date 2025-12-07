import React from "react";

export const ChartContainer = ({
  children,
  height = 300,
  minHeight,
  className = "",
}) => {
  const heightStyle = {
    height: `${height}px`,
    minHeight: `${minHeight || height}px`,
  };

  return (
    <div
      className={`flex w-full items-center justify-center ${className}`}
      style={heightStyle}
    >
      {children}
    </div>
  );
};
