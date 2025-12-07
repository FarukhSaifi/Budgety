import { DIALOG_COLORS, DIALOG_CONFIG, UI_TEXT } from "@constants";
import {
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Button } from "./Button";

/**
 * Reusable Confirm Dialog Component
 *
 * @param {boolean} open - Whether dialog is open
 * @param {function} onClose - Function to call when dialog is closed
 * @param {function} onConfirm - Function to call when user confirms
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message/content
 * @param {string} type - Dialog type: 'warning', 'error', 'info', 'success'
 * @param {string} confirmText - Text for confirm button
 * @param {string} cancelText - Text for cancel button
 * @param {string} variant - Confirm button variant: 'danger', 'primary', 'warning'
 */
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = UI_TEXT.CONFIRM_ACTION,
  message = UI_TEXT.CONFIRM_DEFAULT_MESSAGE,
  type = "warning",
  confirmText = UI_TEXT.CONFIRM || "Confirm",
  cancelText = UI_TEXT.CANCEL,
  variant = "danger",
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getIcon = () => {
    const iconStyle = {
      fontSize: DIALOG_CONFIG.ICON_SIZE,
      marginBottom: DIALOG_CONFIG.ICON_MARGIN_BOTTOM,
    };
    switch (type) {
      case "error":
        return <ErrorIcon sx={{ ...iconStyle, color: DIALOG_COLORS.ERROR }} />;
      case "info":
        return <InfoIcon sx={{ ...iconStyle, color: DIALOG_COLORS.INFO }} />;
      case "warning":
      default:
        return (
          <WarningIcon sx={{ ...iconStyle, color: DIALOG_COLORS.WARNING }} />
        );
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case "danger":
        return "danger";
      case "warning":
        return "warning";
      case "primary":
      default:
        return "primary";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "rounded-lg",
      }}
    >
      <DialogTitle className="text-center pb-2">
        <div className="flex flex-col items-center">
          {getIcon()}
          <span className="text-xl font-semibold text-gray-900">{title}</span>
        </div>
      </DialogTitle>
      <DialogContent>
        <DialogContentText className="text-center text-gray-700 text-base">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions className="justify-center gap-3 pb-6 px-6">
        <Button variant="outline" onClick={onClose} className="min-w-[100px]">
          {cancelText}
        </Button>
        <Button
          variant={getConfirmButtonVariant()}
          onClick={handleConfirm}
          className="min-w-[100px]"
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
