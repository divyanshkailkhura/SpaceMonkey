import React from "react";
import type { ObjectDetail } from "../types";

interface ObjectInfoPanelProps {
  name: string;
  details: ObjectDetail[];
  wikipediaDescription: string | null;
  loadingWikipedia: boolean;
  onClose: () => void;
}

export const ObjectInfoPanel: React.FC<ObjectInfoPanelProps> = ({
  name,
  details,
  wikipediaDescription,
  loadingWikipedia,
  onClose,
}) => (
  <div className="fixed top-6 right-6 z-40 w-[420px] max-w-[90vw] rounded-2xl border border-slate-600/50 bg-slate-900/90 backdrop-blur-md shadow-xl animate-slide-in">
    <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
      <h3 className="text-xl font-bold text-slate-100">{name}</h3>
      <button
        onClick={onClose}
        aria-label="Close object information"
        className="text-slate-400 transition-colors hover:text-slate-200 hover:cursor-pointer"
      >
        ✕
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
          ) : wikipediaDescription ? (
            <p className="text-sm text-slate-300 leading-relaxed">{wikipediaDescription}</p>
          ) : (
            <p className="text-sm text-slate-500 italic">No description available</p>
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
    </div>
  </div>
);
