import { Autocomplete, TextField } from "@mui/material";
import { useMemo, useState } from "react";

/**
 * SearchableCategorySelect - A mobile-friendly searchable dropdown for categories
 * Features:
 * - Search/filter categories as you type
 * - Mobile-optimized touch targets
 * - Keyboard navigation support
 * - Accessible
 */
export const SearchableCategorySelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  error = false,
  helperText,
  placeholder,
  fullWidth = true,
  className = "",
  ...props
}) => {
  const [inputValue, setInputValue] = useState("");

  // Filter options based on search input
  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    const searchLower = inputValue.toLowerCase();
    return options.filter((option) => {
      const optionLabel =
        typeof option === "string" ? option : option.label || option.value;
      return optionLabel.toLowerCase().includes(searchLower);
    });
  }, [options, inputValue]);

  // Find the selected option object
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find((option) => {
      const optionValue = typeof option === "string" ? option : option.value;
      return optionValue === value;
    });
  }, [options, value]);

  const handleChange = (event, newValue) => {
    const selectedValue =
      typeof newValue === "string"
        ? newValue
        : newValue?.value || newValue || "";

    // Create a synthetic event for compatibility with form handlers
    const syntheticEvent = {
      target: {
        name,
        value: selectedValue,
      },
    };

    onChange(syntheticEvent);
    setInputValue("");
  };

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
  };

  return (
    <Autocomplete
      fullWidth={fullWidth}
      disabled={disabled}
      options={filteredOptions}
      value={selectedOption || null}
      onChange={handleChange}
      onInputChange={handleInputChange}
      inputValue={inputValue}
      getOptionLabel={(option) => {
        if (typeof option === "string") return option;
        return option.label || option.value || "";
      }}
      isOptionEqualToValue={(option, value) => {
        const optionValue = typeof option === "string" ? option : option.value;
        const valueValue = typeof value === "string" ? value : value?.value;
        return optionValue === valueValue;
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          placeholder={placeholder || "Search or select category..."}
          variant="outlined"
          className={className}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              // Mobile-friendly touch targets
              minHeight: "44px", // iOS recommended minimum
              "& input": {
                fontSize: "16px", // Prevents zoom on iOS
                padding: "12px 14px",
                "@media (max-width: 640px)": {
                  padding: "14px 16px", // Larger touch target on mobile
                },
              },
              "& .MuiAutocomplete-endAdornment": {
                right: "12px",
              },
            },
            "& .MuiInputLabel-root": {
              fontSize: "14px",
              "@media (max-width: 640px)": {
                fontSize: "16px", // Prevents zoom on iOS
              },
            },
          }}
        />
      )}
      // Mobile-friendly popup props
      ListboxProps={{
        style: {
          maxHeight: "300px",
          "@media (max-width: 640px)": {
            maxHeight: "50vh", // Better for mobile screens
          },
        },
      }}
      // Better mobile experience
      disablePortal={false}
      openOnFocus
      clearOnBlur={false}
      selectOnFocus
      handleHomeEndKeys
      {...props}
    />
  );
};
