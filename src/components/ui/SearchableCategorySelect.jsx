import { UI_TEXT } from "@constants";
import { Autocomplete, TextField } from "@mui/material";
import { Button } from "@ui/Button";
import { Dialog } from "@ui/Dialog";
import { useMemo, useRef, useState } from "react";

const ADD_NEW_OPTION_VALUE = "__ADD_NEW_CATEGORY__";

/**
 * SearchableCategorySelect - A mobile-friendly searchable dropdown for categories
 * Features:
 * - Search/filter categories as you type
 * - Optional "Add new category": opens a popup to enter name and save to DB
 * - Mobile-optimized touch targets, keyboard navigation, accessible
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
  allowAddNew = false,
  onAddCategory,
  categoryType,
  ...props
}) => {
  const baseInputClasses =
    "[&_.MuiOutlinedInput-root]:min-h-11 [&_.MuiOutlinedInput-root]:rounded-lg [&_.MuiOutlinedInput-input]:text-base [&_.MuiOutlinedInput-input]:py-3 [&_.MuiOutlinedInput-input]:px-3.5 sm:[&_.MuiOutlinedInput-input]:py-3.5 sm:[&_.MuiOutlinedInput-input]:px-4 [&_.MuiInputLabel-root]:text-sm sm:[&_.MuiInputLabel-root]:text-base [&_.MuiAutocomplete-endAdornment]:right-3";
  const [inputValue, setInputValue] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalName, setAddModalName] = useState("");
  const [addModalError, setAddModalError] = useState("");
  const inputRef = useRef(null);

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

  // Append "Add [input] as new category" when allowAddNew and input doesn't match existing
  const optionsWithAddNew = useMemo(() => {
    if (!allowAddNew || typeof onAddCategory !== "function")
      return filteredOptions;
    const trimmed = inputValue.trim();
    if (!trimmed) return filteredOptions;
    const exists = options.some((o) => {
      const v = typeof o === "string" ? o : o.value;
      return v === trimmed;
    });
    if (exists) return filteredOptions;
    const addNewLabel = (
      UI_TEXT.ADD_AS_NEW_CATEGORY || 'Add "%s" as new category'
    ).replace("%s", trimmed);
    return [
      ...filteredOptions,
      {
        value: ADD_NEW_OPTION_VALUE,
        label: addNewLabel,
        _addNewValue: trimmed,
      },
    ];
  }, [allowAddNew, onAddCategory, filteredOptions, inputValue, options]);

  // Find the selected option object (from real options only)
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return options.find((option) => {
      const optionValue = typeof option === "string" ? option : option.value;
      return optionValue === value;
    });
  }, [options, value]);

  const openAddModal = (initialName) => {
    setAddModalName(initialName || "");
    setAddModalError("");
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setAddModalName("");
    setAddModalError("");
    setInputValue("");
  };

  const handleSaveNewCategory = () => {
    const trimmed = addModalName.trim();
    if (!trimmed) {
      setAddModalError(
        UI_TEXT.ADD_NEW_CATEGORY_REQUIRED || "Please enter a category name",
      );
      return;
    }
    const nameToSave = trimmed;
    const type =
      categoryType === "income" || categoryType === "expense"
        ? categoryType
        : "expense";
    if (onAddCategory) onAddCategory(nameToSave, type);
    onChange({ target: { name, value: nameToSave } });
    closeAddModal();
  };

  const handleBlur = () => {
    if (inputRef.current && !addModalOpen) {
      inputRef.current.blur();
    }
  };

  const handleChange = (event, newValue) => {
    const optionValue =
      typeof newValue === "string" ? newValue : newValue?.value;
    const isAddNew = optionValue === ADD_NEW_OPTION_VALUE;
    const selectedValue = isAddNew
      ? (newValue?._addNewValue ?? "")
      : (optionValue ?? "");

    if (isAddNew && newValue?._addNewValue) {
      openAddModal(newValue._addNewValue);
      setInputValue("");
      return;
    }

    const syntheticEvent = {
      target: { name, value: selectedValue },
    };
    onChange(syntheticEvent);
    setInputValue("");
    handleBlur();
  };

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
  };

  return (
    <>
      <Autocomplete
        fullWidth={fullWidth}
        disabled={disabled}
        options={optionsWithAddNew}
        value={selectedOption || null}
        onChange={handleChange}
        onBlur={handleBlur}
        onInputChange={handleInputChange}
        inputValue={inputValue}
        getOptionLabel={(option) => {
          if (typeof option === "string") return option;
          return option.label || option.value || "";
        }}
        isOptionEqualToValue={(option, value) => {
          const optionValue =
            typeof option === "string" ? option : option.value;
          const valueValue = typeof value === "string" ? value : value?.value;
          return optionValue === valueValue;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={(el) => {
              inputRef.current = el;
              if (params.inputRef) {
                if (typeof params.inputRef === "function") params.inputRef(el);
                else params.inputRef.current = el;
              }
            }}
            label={label}
            required={required}
            error={error}
            helperText={helperText}
            placeholder={placeholder || UI_TEXT.SEARCH_OR_SELECT_CATEGORY}
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
        disablePortal={true}
        openOnFocus
        clearOnBlur={false}
        selectOnFocus
        handleHomeEndKeys
        {...props}
      />

      <Dialog
        open={addModalOpen}
        onClose={closeAddModal}
        title={UI_TEXT.ADD_NEW_CATEGORY_TITLE}
        actions={
          <>
            <Button variant="outline" onClick={closeAddModal} size="md">
              {UI_TEXT.CANCEL || "Cancel"}
            </Button>
            <Button variant="primary" onClick={handleSaveNewCategory} size="md">
              {UI_TEXT.SAVE || "Save"}
            </Button>
          </>
        }
      >
        <TextField
          autoFocus
          fullWidth
          label={UI_TEXT.ADD_NEW_CATEGORY_LABEL || "Category name"}
          placeholder={
            UI_TEXT.ADD_NEW_CATEGORY_PLACEHOLDER || "Enter category name"
          }
          value={addModalName}
          onChange={(e) => {
            setAddModalName(e.target.value);
            if (addModalError) setAddModalError("");
          }}
          error={!!addModalError}
          helperText={addModalError}
          variant="outlined"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSaveNewCategory();
            }
          }}
          className="[&_.MuiOutlinedInput-root]:rounded-lg"
        />
      </Dialog>
    </>
  );
};
