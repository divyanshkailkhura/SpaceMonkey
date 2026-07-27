import React from "react";
import type { ObserverLocation } from "../types";

interface LocationDrawerProps {
  location: ObserverLocation;
  cityQuery: string;
  citySearching: boolean;
  onCityQueryChange: (value: string) => void;
  onCitySearch: () => void;
  onFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUseGeolocation: () => void;
}

export const LocationDrawer: React.FC<LocationDrawerProps> = ({
  location,
  cityQuery,
  citySearching,
  onCityQueryChange,
  onCitySearch,
  onFieldChange,
  onUseGeolocation,
}) => (
  <aside
    id="location-drawer"
    className="fixed top-36 left-6 z-40 w-[340px] max-w-[90vw] space-y-6 rounded-2xl border border-slate-600/50 bg-slate-900/85 px-6 py-7 backdrop-blur-md shadow-xl"
  >
    <header className="text-lg font-semibold text-slate-100">
      Observer – {location.name}
    </header>

    {/*
      Wrapped in a <form> so pressing Enter in the city field submits —
      in the original, Enter did nothing because the input and button
      were plain siblings with no submit handler.
    */}
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onCitySearch();
      }}
    >
      <input
        value={cityQuery}
        onChange={(e) => onCityQueryChange(e.target.value)}
        placeholder="Type city name…"
        aria-label="City name"
        className="ui-input flex-1"
      />
      <button
        type="submit"
        disabled={citySearching}
        className="rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        {citySearching ? "…" : "Go"}
      </button>
    </form>

    <div className="space-y-1">
      <label className="text-xs text-slate-300" htmlFor="location-name">
        Custom label
      </label>
      <input
        id="location-name"
        name="name"
        value={location.name}
        onChange={onFieldChange}
        className="ui-input"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-xs text-slate-300" htmlFor="location-latitude">
          Latitude
        </label>
        <input
          id="location-latitude"
          type="number"
          step="0.0001"
          name="latitude"
          value={location.latitude}
          onChange={onFieldChange}
          className="ui-input"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-300" htmlFor="location-longitude">
          Longitude
        </label>
        <input
          id="location-longitude"
          type="number"
          step="0.0001"
          name="longitude"
          value={location.longitude}
          onChange={onFieldChange}
          className="ui-input"
        />
      </div>
    </div>

    <button
      onClick={onUseGeolocation}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600/80 py-2 text-sm font-medium text-slate-100 transition hover:bg-indigo-600 hover:cursor-pointer"
    >
      📍 Use Current Position
    </button>
  </aside>
);
