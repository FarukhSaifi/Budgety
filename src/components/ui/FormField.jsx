import { MenuItem, TextField } from "@mui/material";
import React from "react";

export const FormField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  error = false,
  helperText,
  options = [],
  placeholder,
  fullWidth = true,
  className = "",
  ...props
}) => {
  const commonProps = {
    fullWidth,
    label,
    name,
    value,
    onChange,
    required,
    disabled,
    error,
    helperText,
    placeholder,
    variant: "outlined",
    className: `rounded-lg ${className}`,
    sx: {
      "& .MuiOutlinedInput-root": {
        borderRadius: "8px",
      },
    },
    ...props,
  };

  if (type === "select" || options.length > 0) {
    return (
      <TextField select {...commonProps}>
        {options.map((option) => {
          const optionValue =
            typeof option === "string" ? option : option.value;
          const optionLabel =
            typeof option === "string" ? option : option.label;
          return (
            <MenuItem key={optionValue} value={optionValue}>
              {optionLabel}
            </MenuItem>
          );
        })}
      </TextField>
    );
  }

  return <TextField type={type} {...commonProps} />;
};

export const FormFieldGroup = ({
  children,
  columns = 1,
  spacing = 3,
  className = "",
}) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-6",
  };

  const gapClasses = {
    1: "gap-1",
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    5: "gap-5",
    6: "gap-6",
  };

  return (
    <div
      className={`grid ${gridCols[columns] || gridCols[1]} ${
        gapClasses[spacing] || gapClasses[3]
      } ${className}`}
    >
      {children}
    </div>
  );
};
