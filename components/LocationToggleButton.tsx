import React from "react";

interface LocationToggleButtonProps {
  open: boolean;
  locationName: string;
  onToggle: () => void;
}

export const LocationToggleButton: React.FC<LocationToggleButtonProps> = ({
  open,
  locationName,
  onToggle,
}) => (
  <button
    onClick={onToggle}
    aria-expanded={open}
    aria-controls="location-drawer"
    aria-label="Toggle location panel"
    className="fixed top-24 left-6 z-50 flex items-center gap-2 rounded-full bg-indigo-600/90 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-indigo-700 hover:cursor-pointer backdrop-blur-md"
  >
    {open ? "Hide" : "Location"} •{" "}
    <span className="truncate max-w-[120px]">{locationName}</span>
  </button>
);
