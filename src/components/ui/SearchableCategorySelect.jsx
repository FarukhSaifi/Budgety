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
  inputClassName = "",
  ...props
}) => {
  const baseInputClasses =
    "[&_.MuiOutlinedInput-root]:min-h-11 [&_.MuiOutlinedInput-root]:rounded-lg [&_.MuiOutlinedInput-input]:text-base [&_.MuiOutlinedInput-input]:py-3 [&_.MuiOutlinedInput-input]:px-3.5 sm:[&_.MuiOutlinedInput-input]:py-3.5 sm:[&_.MuiOutlinedInput-input]:px-4 [&_.MuiInputLabel-root]:text-sm sm:[&_.MuiInputLabel-root]:text-base [&_.MuiAutocomplete-endAdornment]:right-3";
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
          className={`${baseInputClasses} ${inputClassName} ${className}`}
        />
      )}
      ListboxProps={{
        sx: {
          maxHeight: "300px",
          "@media (max-width: 640px)": { maxHeight: "50vh" },
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
