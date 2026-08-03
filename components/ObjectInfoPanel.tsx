import React from "react";
import type { ObjectDetail } from "../types";

interface ObjectInfoPanelProps {
  name: string;
  details: ObjectDetail[];
  wikipediaDescription: string | null;
  loadingWikipedia: boolean;
  onClose: () => void;
  onAddToFavorites?: (name: string, type: string) => void;
  favoriteToast?: string | null;
  favoriting?: boolean;
}

export const ObjectInfoPanel: React.FC<ObjectInfoPanelProps> = ({
  name,
  details,
  wikipediaDescription,
  loadingWikipedia,
  onClose,
  onAddToFavorites,
  favoriteToast,
  favoriting,
}) => {
  const objectType = details.find((d) => d.key === "Type")?.value ?? "";

  return (
    <div
      className="fixed top-6 right-6 z-40 w-[90vw] sm:w-[420px] max-w-[90vw] rounded-2xl border border-slate-600/50 bg-slate-900/90 backdrop-blur-md shadow-xl animate-slide-in"
      role="dialog"
      aria-label={`Information about ${name}`}
    >
      <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
        <h3 className="text-xl font-bold text-slate-100">{name}</h3>
        <button
          onClick={onClose}
          aria-label="Close object information"
          className="text-slate-400 transition-colors hover:text-slate-200 hover:cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
        {(wikipediaDescription || loadingWikipedia) && (
          <div className="bg-slate-800/40 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">About</h4>
            {loadingWikipedia ? (
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Loading description...
              </div>
            ) : (
              <p className="text-sm text-slate-300 leading-relaxed">{wikipediaDescription}</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-200">Astronomical Data</h4>
          {details.map((detail) => (
            <div
              key={detail.key}
              className="flex justify-between items-start bg-slate-800/30 rounded-lg p-3"
            >
              <span className="text-sm font-medium text-slate-300 min-w-0 flex-1">
                {detail.key}
              </span>
              <span className="text-sm font-mono text-blue-300 text-right ml-3">
                {detail.value}
              </span>
            </div>
          ))}
        </div>

        {onAddToFavorites && (
          <button
            onClick={() => onAddToFavorites(name, objectType)}
            disabled={favoriting}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {favoriting ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
            ) : favoriteToast ? (
              favoriteToast
            ) : (
              "☆ Add to Favorites"
            )}
          </button>
        )}
      </div>
    </div>
  );
};
