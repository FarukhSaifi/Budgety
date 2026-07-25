import { toast, type Id, type ToastOptions, type TypeOptions } from "react-toastify";

import { TIMEOUTS, UI_TEXT } from "@constants";

/**
 * Toast notification utility functions
 * Provides consistent toast notifications throughout the app
 */

function resolveToastMessage(message: unknown, fallback: string): string {
  if (typeof message === "string") {
    const trimmed = message.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (message == null) return fallback;
  const asString = String(message).trim();
  return asString.length > 0 ? asString : fallback;
}

export const showSuccess = (message: string, options: ToastOptions = {}) => {
  toast.success(resolveToastMessage(message, UI_TEXT.TOAST_FALLBACK_SUCCESS), {
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
  toast.error(resolveToastMessage(message, UI_TEXT.TOAST_FALLBACK_ERROR), {
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
  toast.warning(resolveToastMessage(message, UI_TEXT.TOAST_FALLBACK_WARNING), {
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
  toast.info(resolveToastMessage(message, UI_TEXT.TOAST_FALLBACK_INFO), {
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
  return toast.loading(resolveToastMessage(message, UI_TEXT.LOADING), {
    position: "top-right",
  });
};

export const updateToast = (
  toastId: Id,
  message: string,
  type: TypeOptions = "success",
) => {
  toast.update(toastId, {
    render: resolveToastMessage(message, UI_TEXT.TOAST_FALLBACK_SUCCESS),
    type,
    isLoading: false,
    autoClose: TIMEOUTS.TOAST_SUCCESS,
  });
};

export const dismissToast = (toastId?: Id) => {
  toast.dismiss(toastId);
};
