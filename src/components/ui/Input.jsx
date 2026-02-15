import { TextField } from "@mui/material";

export const Input = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
  error,
  disabled = false,
  ...props
}) => {
  return (
    <TextField
      fullWidth
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      error={!!error}
      helperText={error}
      label={label}
      variant="outlined"
      className={className}
      slotProps={{
        htmlInput: {
          className: "rounded-lg",
        },
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "8px",
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgb(239 68 68)",
          },
        },
      }}
      {...props}
    />
  );
};

export const Select = ({
  label,
  name,
  value,
  onChange,
  required = false,
  className = "",
  error,
  disabled = false,
  children,
  ...props
}) => {
  return (
    <TextField
      fullWidth
      select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      error={!!error}
      helperText={error}
      label={label}
      variant="outlined"
      className={className}
      slotProps={{
        htmlInput: {
          className: "rounded-lg",
        },
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "8px",
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgb(239 68 68)",
          },
        },
      }}
      {...props}
    >
      {children}
    </TextField>
  );
};
