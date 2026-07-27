import React from "react";

interface ErrorToastProps {
  message: string | null;
  onDismiss: () => void;
}

/**
 * The original toast had no way to dismiss it, so any error (including
 * recoverable ones like "city not found") stuck on screen for the rest
 * of the session. This adds a close button; nothing else changes.
 */
export const ErrorToast: React.FC<ErrorToastProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-800/80 px-4 py-3 text-sm text-red-100 backdrop-blur-md shadow-lg"
    >
      <span>⚠️ {message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="text-red-200 transition-colors hover:text-white hover:cursor-pointer"
      >
        ✕
      </button>
    </div>
  );
};
