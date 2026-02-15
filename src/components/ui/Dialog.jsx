import {
  DialogActions,
  DialogContent,
  DialogTitle,
  Dialog as MuiDialog,
} from "@mui/material";

/**
 * Common Dialog component for consistent modal layout across the app.
 * Wraps MUI Dialog with shared styling (title, content, actions).
 *
 * @param {boolean} open - Whether the dialog is open
 * @param {function} onClose - Called when dialog should close (backdrop click or escape)
 * @param {React.ReactNode} title - Dialog title
 * @param {React.ReactNode} children - Dialog body content
 * @param {React.ReactNode} actions - Footer actions (e.g. Cancel / Save buttons)
 * @param {string} maxWidth - 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} fullWidth - Whether dialog stretches to maxWidth
 * @param {object} PaperProps - Props passed to MUI Paper (e.g. className)
 * @param {string} contentClassName - Optional class for DialogContent (e.g. overflow-y-auto for scrollable body)
 */
export const Dialog = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = "sm",
  fullWidth = true,
  PaperProps = {},
  contentClassName = "",
}) => {
  const paperClassName = ["m-2 sm:m-4", PaperProps.className]
    .filter(Boolean)
    .join(" ");
  const contentClasses = ["px-4 sm:px-6 pt-4 sm:pt-6", contentClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{ ...PaperProps, className: paperClassName }}
    >
      {title != null && (
        <DialogTitle className="text-lg sm:text-xl font-semibold pb-2 sm:pb-3">
          {title}
        </DialogTitle>
      )}
      <DialogContent className={contentClasses}>{children}</DialogContent>
      {actions != null && (
        <DialogActions className="px-4 sm:px-6 pb-4 sm:pb-6 gap-2 sm:gap-3">
          {actions}
        </DialogActions>
      )}
    </MuiDialog>
  );
};
