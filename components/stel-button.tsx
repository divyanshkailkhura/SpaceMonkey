/* eslint-disable @next/next/no-img-element */
import React from "react";
import type { StelModule } from "../types";

interface StelButtonProps {
  label: string;
  img: string;
  obj: StelModule | undefined;
  attr: string;
}

export const StelButton: React.FC<StelButtonProps> = ({ label, img, obj, attr }) => {
  const active = Boolean(obj?.[attr]);

  const handleClick = () => {
    if (!obj) return;
    obj[attr] = !active;
  };

  return (
    <button
      aria-label={`Toggle ${label || "option"}`}
      title={`${label}${active ? " (active)" : " (inactive)"}`}
      aria-pressed={active}
      onClick={handleClick}
      className={`group flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300 hover:shadow-lg hover:cursor-pointer
        ${
          active
            ? "border-indigo-400/70 bg-indigo-600/30"
            : "border-slate-600/60 bg-slate-800/50 hover:border-indigo-400/40"
        } backdrop-blur-md`}
    >
      <img
        src={img}
        alt={label}
        loading="lazy"
        decoding="async"
        className={`h-6 w-6 object-contain transition-opacity duration-200 ${
          active ? "opacity-100" : "opacity-60 group-hover:opacity-90"
        }`}
      />
    </button>
  );
};
