import React from "react";
import { CONTROL_BUTTONS } from "../constants";
import type { StelEngine } from "../types";
import { StelButton } from "./stel-button";

interface ControlsBarProps {
  stel: StelEngine;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({ stel }) => (
  <div
    className="fixed bottom-6 right-6 z-40 grid grid-cols-3 gap-4 rounded-3xl border border-slate-600/40 bg-slate-900/70 p-5 backdrop-blur-md shadow-xl"
    role="toolbar"
    aria-label="Sky layer controls"
  >
    {CONTROL_BUTTONS.map((button) => (
      <StelButton
        key={button.label}
        label={button.label}
        img={button.img}
        attr={button.attr}
        obj={button.getModule(stel.core)}
      />
    ))}
  </div>
);
