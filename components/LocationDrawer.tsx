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
  geolocating?: boolean;
}

function clampLat(val: number) {
  if (val > 90) return 90;
  if (val < -90) return -90;
  return val;
}

function clampLng(val: number) {
  if (val > 180) return 180;
  if (val < -180) return -180;
  return val;
}

export const LocationDrawer: React.FC<LocationDrawerProps> = ({
  location,
  cityQuery,
  citySearching,
  onCityQueryChange,
  onCitySearch,
  onFieldChange,
  onUseGeolocation,
  geolocating,
}) => {
  const handleLatBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onFieldChange({
        target: { name: "latitude", value: String(clampLat(val)) },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleLngBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onFieldChange({
        target: { name: "longitude", value: String(clampLng(val)) },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <aside
      id="location-drawer"
      className="fixed top-36 left-6 z-40 w-[90vw] sm:w-[340px] max-w-[90vw] space-y-6 rounded-2xl border border-slate-600/50 bg-slate-900/85 px-6 py-7 backdrop-blur-md shadow-xl"
    >
      <header className="text-lg font-semibold text-slate-100 truncate">
        Observer – {location.name}
      </header>

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
          placeholder="Type city name..."
          aria-label="City name"
          autoComplete="city"
          className="ui-input flex-1"
        />
        <button
          type="submit"
          disabled={citySearching}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {citySearching ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            "Go"
          )}
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
            min={-90}
            max={90}
            name="latitude"
            value={location.latitude}
            onChange={onFieldChange}
            onBlur={handleLatBlur}
            className="ui-input"
            placeholder="-90 to 90"
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
            min={-180}
            max={180}
            name="longitude"
            value={location.longitude}
            onChange={onFieldChange}
            onBlur={handleLngBlur}
            className="ui-input"
            placeholder="-180 to 180"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-300" htmlFor="location-altitude">
          Altitude (m)
        </label>
        <input
          id="location-altitude"
          type="number"
          step="1"
          min={-500}
          max={10000}
          name="altitude"
          value={location.altitude}
          onChange={onFieldChange}
          className="ui-input"
          placeholder="10"
        />
      </div>

      <button
        onClick={onUseGeolocation}
        disabled={geolocating}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600/80 py-2 text-sm font-medium text-slate-100 transition hover:bg-indigo-600 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden="true">📡</span>
        {geolocating ? "Detecting position..." : "Use Current Position"}
      </button>
    </aside>
  );
};
