import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { useId } from "react";

/**
 * Common DatePicker – single date input (YYYY-MM-DD).
 * Uses MUI X DatePicker with calendar popup; value/onChange match form usage (name, value, synthetic event).
 * @param {string} value - Date string YYYY-MM-DD
 * @param {function} onChange - (e: { target: { name, value } }) => void; use with form handleChange
 * @param {string} [name] - Input name for forms
 * @param {string} [label] - Label text
 * @param {string} [min] - Min date YYYY-MM-DD
 * @param {string} [max] - Max date YYYY-MM-DD
 * @param {boolean} [required]
 * @param {boolean} [disabled]
 * @param {boolean} [error]
 * @param {string} [helperText]
 * @param {boolean} [fullWidth=true]
 * @param {string} [className]
 * @param {object} [slotProps] - MUI DatePicker slotProps (e.g. textField, field)
 * @param {object} [sx] - MUI sx
 */
export function DatePicker({
  value,
  onChange,
  name,
  label,
  min,
  max,
  required = false,
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
  className = "",
  slotProps = {},
  sx,
  ...rest
}) {
  const id = useId();
  const dateValue = value && dayjs(value).isValid() ? dayjs(value) : null;
  const minDate = min && dayjs(min).isValid() ? dayjs(min) : undefined;
  const maxDate = max && dayjs(max).isValid() ? dayjs(max) : undefined;

  const handleChange = (newValue) => {
    const valueStr =
      newValue && dayjs(newValue).isValid()
        ? dayjs(newValue).format("YYYY-MM-DD")
        : "";
    onChange?.({
      target: { name: name ?? "date", value: valueStr },
    });
  };

  return (
    <MuiDatePicker
      label={label}
      value={dateValue}
      onChange={handleChange}
      minDate={minDate}
      maxDate={maxDate}
      disabled={disabled}
      slotProps={{
        textField: {
          id,
          name,
          required,
          error,
          helperText,
          fullWidth,
          variant: "outlined",
          "aria-label": label || name || "Date",
          slotProps: {
            htmlInput: { className: "rounded-lg" },
          },
          sx: {
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
            },
          },
          ...slotProps.textField,
        },
        ...slotProps,
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "8px",
        },
        ...sx,
      }}
      className={className.trim() || undefined}
      {...rest}
    />
  );
}
