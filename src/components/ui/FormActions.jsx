import { UI_TEXT } from "@constants";

/**
 * Reusable form actions component with Save and Cancel buttons
 * Note: onSave is optional - if not provided, the submit button will trigger form onSubmit
 */
export const FormActions = ({
  onSave,
  onCancel,
  saveText = UI_TEXT.SAVE,
  cancelText = UI_TEXT.CANCEL,
  saveColor = "blue",
  className = "",
}) => {
  const saveColorClasses = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    orange: "bg-orange-600 hover:bg-orange-700",
    purple: "bg-purple-600 hover:bg-purple-700",
    indigo: "bg-indigo-600 hover:bg-indigo-700",
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <button
        type="submit"
        className={`${
          saveColorClasses[saveColor] || saveColorClasses.blue
        } text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 text-sm md:text-base`}
        onClick={onSave}
      >
        {saveText}
      </button>
      {onCancel && (
        <button
          type="button"
          className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 text-sm md:text-base"
          onClick={onCancel}
        >
          {cancelText}
        </button>
      )}
    </div>
  );
};
