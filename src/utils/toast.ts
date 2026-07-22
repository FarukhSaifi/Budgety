import { TIMEOUTS, UI_TEXT } from "@constants";
import { toast, type Id, type ToastOptions, type TypeOptions } from "react-toastify";

/**
 * Toast notification utility functions
 * Provides consistent toast notifications throughout the app
 */

export const showSuccess = (message: string, options: ToastOptions = {}) => {
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

export const showError = (message: string, options: ToastOptions = {}) => {
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

export const showWarning = (message: string, options: ToastOptions = {}) => {
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

export const showInfo = (message: string, options: ToastOptions = {}) => {
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

export const showLoading = (message: string = UI_TEXT.LOADING): Id => {
  return toast.loading(message, {
    position: "top-right",
  });
};

export const updateToast = (
  toastId: Id,
  message: string,
  type: TypeOptions = "success",
) => {
  toast.update(toastId, {
    render: message,
    type,
    isLoading: false,
    autoClose: TIMEOUTS.TOAST_SUCCESS,
  });
};

export const dismissToast = (toastId?: Id) => {
  toast.dismiss(toastId);
};
