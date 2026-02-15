import { UI_TEXT } from "@constants";
import { Button } from "@ui/Button";

/**
 * Reusable form actions component with Save and Cancel buttons
 * Note: onSave is optional - if not provided, the submit button will trigger form onSubmit
 */
export const FormActions = ({
  onSave,
  onCancel,
  saveText = UI_TEXT.SAVE,
  cancelText = UI_TEXT.CANCEL,
  className = "",
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <Button type="submit" variant="primary" onClick={onSave}>
        {saveText}
      </Button>
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelText}
        </Button>
      )}
    </div>
  );
};
