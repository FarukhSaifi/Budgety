import { TIMEOUTS } from "@constants";
import { toast } from "react-toastify";

/**
 * Toast notification utility functions
 * Provides consistent toast notifications throughout the app
 */

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {object} options - Toast options
 */
export const showSuccess = (message, options = {}) => {
  toast.success(message, {
    position: "top-right",
    autoClose: TIMEOUTS.TOAST_SUCCESS,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

/**
 * Show error toast
 * @param {string} message - Error message
 * @param {object} options - Toast options
 */
export const showError = (message, options = {}) => {
  toast.error(message, {
    position: "top-right",
    autoClose: TIMEOUTS.TOAST_ERROR,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

/**
 * Show warning toast
 * @param {string} message - Warning message
 * @param {object} options - Toast options
 */
export const showWarning = (message, options = {}) => {
  toast.warning(message, {
    position: "top-right",
    autoClose: TIMEOUTS.TOAST_WARNING,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {object} options - Toast options
 */
export const showInfo = (message, options = {}) => {
  toast.info(message, {
    position: "top-right",
    autoClose: TIMEOUTS.TOAST_INFO,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

/**
 * Show loading toast (returns toastId for updating/dismissing)
 * @param {string} message - Loading message
 * @returns {number|string} - Toast ID
 */
export const showLoading = (message = "Loading...") => {
  return toast.loading(message, {
    position: "top-right",
  });
};

/**
 * Update toast (useful for loading states)
 * @param {number|string} toastId - Toast ID from showLoading
 * @param {string} message - New message
 * @param {string} type - Toast type (success, error, warning, info)
 */
export const updateToast = (toastId, message, type = "success") => {
  toast.update(toastId, {
    render: message,
    type,
    isLoading: false,
    autoClose: TIMEOUTS.TOAST_SUCCESS,
  });
};

/**
 * Dismiss toast
 * @param {number|string} toastId - Toast ID
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};
