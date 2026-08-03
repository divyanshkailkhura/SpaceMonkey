import React from "react";

interface ErrorToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-800/80 px-4 py-3 text-sm text-red-100 backdrop-blur-md shadow-lg animate-in fade-in"
    >
      <span aria-hidden="true">⚠️</span>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="ml-2 text-red-200 transition-colors hover:text-white hover:cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
};
