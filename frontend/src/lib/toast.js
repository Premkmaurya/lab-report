import { toast as sonnerToast } from "sonner";

/**
 * Centralized toast notification utility.
 * Wraps Sonner to allow easy replacement in the future.
 */
export const toast = {
  success: (msg, opts) => sonnerToast.success(msg, { duration: 3000, ...opts }),
  error: (msg, opts) => sonnerToast.error(msg, { duration: 6000, ...opts }),
  warning: (msg, opts) => sonnerToast.warning(msg, { duration: 5000, ...opts }),
  info: (msg, opts) => sonnerToast.info(msg, { duration: 4000, ...opts }),
  loading: (msg, opts) => sonnerToast.loading(msg, opts),
  promise: (promise, opts) => 
    sonnerToast.promise(promise, {
      success: { duration: 3000 },
      error: { duration: 6000 },
      ...opts
    }),
  dismiss: (id) => sonnerToast.dismiss(id),
};
