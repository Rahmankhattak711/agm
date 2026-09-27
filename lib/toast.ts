import { toast as rtToast, ToastOptions } from "react-toastify";

const DEFAULT_OPTIONS: ToastOptions = {
  position: "top-right",
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return rtToast.success(message, { ...DEFAULT_OPTIONS, ...options });
  },
  error: (message: string, options?: ToastOptions) => {
    return rtToast.error(message, { ...DEFAULT_OPTIONS, ...options });
  },
  info: (message: string, options?: ToastOptions) => {
    return rtToast.info(message, { ...DEFAULT_OPTIONS, ...options });
  },
  warning: (message: string, options?: ToastOptions) => {
    return rtToast.warning(message, { ...DEFAULT_OPTIONS, ...options });
  },
  promise: rtToast.promise,
  dismiss: rtToast.dismiss,
};

export default toast;
