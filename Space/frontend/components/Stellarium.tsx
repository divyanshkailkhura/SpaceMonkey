/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";

/* ───────────────────────── SMALL ICON BUTTON ───────────────────────── */
interface StelButtonProps {
  label: string;
  img: string;
  obj: any;
  attr: string;
}

const StelButton: React.FC<StelButtonProps> = ({ label, img, obj, attr }) => {
  const active = obj?.[attr];

  return (
    <button
      aria-label={`Toggle ${label || "option"}`}
      onClick={() => obj && (obj[attr] = !active)}
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
        className={`h-6 w-6 object-contain transition-opacity duration-200 ${
          active ? "opacity-100" : "opacity-60 group-hover:opacity-90"
        }`}
      />
    </button>
  );
};

/* ──────────────────────── MAIN COMPONENT ─────────────────────── */
export default function Stellarium() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ---------- Stellarium Web Engine state ---------- */
  const [stel, setStel] = useState<any>(null);

  /* ---------- UI state ---------- */
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [cityQuery, setCityQuery] = useState("");
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [wikipediaDescription, setWikipediaDescription] = useState<string | null>(null);
  const [loadingWikipedia, setLoadingWikipedia] = useState(false);

  /* ---------- Observer location ---------- */
  const [location, setLocation] = useState({
    name: "New York",
    latitude: 40.7128,
    longitude: -74.006,
    altitude: 10,
  });

  /* ─────────────────── WIKIPEDIA API HELPER ─────────────────── */
  const fetchWikipediaDescription = async (objectName: string) => {
    if (!objectName || objectName === "Unknown Object") return null;
    
    setLoadingWikipedia(true);
    
    // Clean object name for better Wikipedia matching
    const cleanName = objectName
      .replace(/^(HD|HR|HIP|NGC|M|IC)\s+/, '') // Remove catalog prefixes
      .replace(/\s+\([^)]+\)$/, '') // Remove parenthetical info
      .trim();

    const searchTerms = [objectName, cleanName]; // Try both original and cleaned names
    
    for (const term of searchTerms) {
      try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(term)}&prop=extracts&exintro&explaintext&exsentences=3&redirects=1`;
        
        const response = await fetch(url);
        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        if (pageId !== '-1' && pages[pageId].extract) {
          setLoadingWikipedia(false);
          return pages[pageId].extract;
        }
      } catch (error) {
        console.warn(`Wikipedia fetch failed for "${term}":`, error);
      }
    }
    
    setLoadingWikipedia(false);
    return null;
  };

  /* ─────────────────── ENGINE LOADER ─────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = "/stellarium-web-engine/build/stellarium-web-engine.js";
    script.async = true;

    script.onload = () => {
      if (!window.StelWebEngine) return setError("Stellarium engine missing");

      const baseUrl = "/test-skydata/";
      window.StelWebEngine({
        wasmFile: "/stellarium-web-engine/build/stellarium-web-engine.wasm",
        canvas: canvasRef.current,
        translateFn: (_d: string, s: string) => s,
        onReady: (s: any) => {
          try {
            const c = s.core;
            c.observer.latitude = location.latitude;
            c.observer.longitude = location.longitude;
            c.observer.altitude = location.altitude;
            c.observer.location_name = location.name;

            /* data sources (unchanged) */
            c.stars.addDataSource({ url: `${baseUrl}stars` });
            c.skycultures.addDataSource({
              url: `${baseUrl}skycultures/western`,
              key: "western",
            });
            c.dsos.addDataSource({ url: `${baseUrl}dso` });
            c.landscapes.addDataSource({
              url: `${baseUrl}landscapes/guereins`,
              key: "guereins",
            });
            c.milkyway.addDataSource({ url: `${baseUrl}surveys/milkyway` });
            c.minor_planets.addDataSource({
              url: `${baseUrl}mpcorb.dat`,
              key: "mpc_asteroids",
            });
            c.planets.addDataSource({
              url: `${baseUrl}surveys/sso/moon`,
              key: "moon",
            });
            c.planets.addDataSource({
              url: `${baseUrl}surveys/sso/sun`,
              key: "sun",
            });
            c.comets.addDataSource({
              url: `${baseUrl}CometEls.txt`,
              key: "mpc_comets",
            });
            c.satellites.addDataSource({
              url: `${baseUrl}tle_satellite.jsonl.gz`,
              key: "jsonl/sat",
            });

            s.setFont("regular", "/static/fonts/Roboto-Regular.ttf", 1.38);
            s.setFont("bold", "/static/fonts/Roboto-Bold.ttf", 1.38);

            s.change((obj: any, attr: string) => {
              if (attr !== "hovered") {
                setStel({ ...s });
                if (attr === "selection") {
                  setSelectedObject(s.core.selection);
                  setWikipediaDescription(null); // Reset Wikipedia content
                }
              }
            });

            setStel(s);
          } catch (e) {
            console.error(e);
            setError("Failed to initialise Stellarium data");
          }
        },
      });
    };

    script.onerror = () => setError("Failed to load Stellarium script");
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  /* ─────────────── FETCH WIKIPEDIA ON OBJECT SELECTION ─────────────── */
  useEffect(() => {
    if (selectedObject) {
      const objectName = getObjectName(selectedObject);
      fetchWikipediaDescription(objectName).then(setWikipediaDescription);
    }
  }, [selectedObject]);

  /* ─────────────────── LOCATION HELPERS ─────────────────── */
  const handleLocField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocation((p) => ({ ...p, [name]: name === "name" ? value : +value }));
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation)
      return setError("Geolocation not supported on this device");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
          );
          const data = await res.json();
          const nice =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.hamlet ||
            "Unnamed place";
          setLocation({
            name: nice,
            latitude: coords.latitude,
            longitude: coords.longitude,
            altitude: 10,
          });
        } catch {
          setLocation({
            name: "My Location",
            latitude: coords.latitude,
            longitude: coords.longitude,
            altitude: 10,
          });
        }
      },
      () => setError("Location access denied")
    );
  };

  const handleCitySearch = async () => {
    if (!cityQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          cityQuery
        )}`
      );
      const [match] = await res.json();
      if (!match) return setError("City not found");
      setLocation({
        name: match.display_name,
        latitude: parseFloat(match.lat),
        longitude: parseFloat(match.lon),
        altitude: 10,
      });
      setCityQuery("");
    } catch {
      setError("Failed to fetch city");
    }
  };

  /* ─────────────────── OBJECT INFO HELPERS ─────────────────── */
  const getObjectName = (obj: any) => {
    if (!obj) return "Unknown Object";
    try {
      const designations = obj.designations?.();
      if (designations && designations.length > 0) {
        return designations[0].replace(/^NAME /, "");
      }
      return obj.getEnglishName?.() || obj.getNameI18n?.() || "Unknown Object";
    } catch {
      return "Unknown Object";
    }
  };

  const getObjectDetails = (obj: any) => {
    if (!obj || !stel) return [];
    
    const details = [];
    
    try {
      const objectType = obj.getType?.() || obj.getObjectType?.() || "Unknown";
      details.push({ key: "Type", value: objectType });

      const magnitude = obj.getInfo?.("vmag") || obj.getVMagnitude?.(stel.core);
      if (magnitude !== undefined && magnitude !== null) {
        details.push({ key: "Magnitude", value: magnitude.toFixed(2) });
      }

      const radec = obj.getInfo?.("radec");
      if (radec && stel.c2s && stel.convertFrame) {
        try {
          const converted = stel.convertFrame(stel.core.observer, 'ICRF', 'CIRS', radec);
          const spherical = stel.c2s(converted);
          const ra = stel.anp(spherical[0]);
          const dec = stel.anpm(spherical[1]);
          
          const raHours = Math.floor(ra);
          const raMinutes = Math.floor((ra % 1) * 60);
          const decDegrees = Math.floor(Math.abs(dec));
          const decMinutes = Math.floor((Math.abs(dec) % 1) * 60);
          const decSign = dec >= 0 ? "+" : "-";
          
          details.push({ 
            key: "Right Ascension", 
            value: `${String(raHours).padStart(2, '0')}h ${String(raMinutes).padStart(2, '0')}m` 
          });
          details.push({ 
            key: "Declination", 
            value: `${decSign}${String(decDegrees).padStart(2, '0')}° ${String(decMinutes).padStart(2, '0')}'` 
          });
        } catch (e) {
          console.warn("Could not calculate coordinates:", e);
        }
      }

      const distance = obj.getInfo?.("distance");
      if (distance !== undefined && distance !== null) {
        if (distance > 1000) {
          details.push({ key: "Distance", value: `${(distance / 1000).toFixed(1)} kpc` });
        } else if (distance > 1) {
          details.push({ key: "Distance", value: `${distance.toFixed(1)} pc` });
        } else {
          details.push({ key: "Distance", value: `${(distance * 206265).toFixed(0)} AU` });
        }
      }

      const constellation = obj.getInfo?.("constellation");
      if (constellation) {
        details.push({ key: "Constellation", value: constellation });
      }

      const designations = obj.designations?.();
      if (designations && designations.length > 1) {
        const altNames = designations.slice(1, 3).map(d => d.replace(/^NAME /, "")).join(", ");
        if (altNames) {
          details.push({ key: "Also Known As", value: altNames });
        }
      }

    } catch (e) {
      console.warn("Error getting object info:", e);
      details.push({ key: "Error", value: "Could not retrieve object information" });
    }

    return details;
  };

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* SKY CANVAS */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* ERROR TOAST */}
      {error && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-800/80 px-4 py-3 text-sm text-red-100 backdrop-blur-md shadow-lg">
          ⚠️ {error}
        </div>
      )}

      {/* LOCATION TOGGLE */}
      <button
        onClick={() => setDrawerOpen((o) => !o)}
        className="fixed top-24 left-6 z-50 flex items-center gap-2 rounded-full bg-indigo-600/90 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-indigo-700 hover:cursor-pointer backdrop-blur-md"
        aria-label="Toggle location panel"
      >
        {drawerOpen ? "Hide" : "Location"} •{" "}
        <span className="truncate max-w-[120px]">{location.name}</span>
      </button>

      {/* LOCATION DRAWER */}
      {drawerOpen && (
        <aside className="fixed top-36 left-6 z-40 w-[340px] max-w-[90vw] space-y-6 rounded-2xl border border-slate-600/50 bg-slate-900/85 px-6 py-7 backdrop-blur-md shadow-xl">
          <header className="text-lg font-semibold text-slate-100">
            Observer – {location.name}
          </header>

          <div className="flex gap-2">
            <input
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Type city name…"
              className="ui-input flex-1"
            />
            <button
              onClick={handleCitySearch}
              className="rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition hover:bg-indigo-700 hover:cursor-pointer"
            >
              Go
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Custom label</label>
            <input
              name="name"
              value={location.name}
              onChange={handleLocField}
              className="ui-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Latitude</label>
              <input
                type="number"
                step="0.0001"
                name="latitude"
                value={location.latitude}
                onChange={handleLocField}
                className="ui-input"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Longitude</label>
              <input
                type="number"
                step="0.0001"
                name="longitude"
                value={location.longitude}
                onChange={handleLocField}
                className="ui-input"
              />
            </div>
          </div>

          <button
            onClick={handleGeolocation}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600/80 py-2 text-sm font-medium text-slate-100 transition hover:bg-indigo-600 hover:cursor-pointer"
          >
            📍 Use Current Position
          </button>
        </aside>
      )}

      {/* OBJECT INFORMATION PANEL WITH WIKIPEDIA */}
      {selectedObject && (
        <div className="fixed top-6 right-6 z-40 w-[420px] max-w-[90vw] rounded-2xl border border-slate-600/50 bg-slate-900/90 backdrop-blur-md shadow-xl animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <h3 className="text-xl font-bold text-slate-100">
              {getObjectName(selectedObject)}
            </h3>
            <button
              onClick={() => setSelectedObject(null)}
              className="text-slate-400 hover:text-slate-200 transition-colors hover:cursor-pointer"
              aria-label="Close object information"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
            {/* Wikipedia Description */}
            {(wikipediaDescription || loadingWikipedia) && (
              <div className="bg-slate-800/40 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-200 mb-2">About</h4>
                {loadingWikipedia ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                    Loading description...
                  </div>
                ) : wikipediaDescription ? (
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {wikipediaDescription}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No description available
                  </p>
                )}
              </div>
            )}

            {/* Astronomical Data */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-200">Astronomical Data</h4>
              {getObjectDetails(selectedObject).map((detail, index) => (
                <div key={index} className="flex justify-between items-start bg-slate-800/30 rounded-lg p-3">
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
      )}

      {/* BOTTOM-RIGHT CONTROLS */}
      {stel && (
        <div className="fixed bottom-6 right-6 z-40 grid grid-cols-3 gap-4 rounded-3xl border border-slate-600/40 bg-slate-900/70 p-5 backdrop-blur-md shadow-xl">
          <StelButton
            label="Constellations"
            img="/static/imgs/symbols/btn-cst-lines.svg"
            obj={stel.core.constellations}
            attr="visible"
          />
          <StelButton
            label="Atmosphere"
            img="/static/imgs/symbols/btn-atmosphere.svg"
            obj={stel.core.atmosphere}
            attr="visible"
          />
          <StelButton
            label="Landscape"
            img="/static/imgs/symbols/btn-landscape.svg"
            obj={stel.core.landscapes}
            attr="visible"
          />
          <StelButton
            label="Azimuth grid"
            img="/static/imgs/symbols/btn-azimuthal-grid.svg"
            obj={stel.core.lines?.azimuthal}
            attr="visible"
          />
          <StelButton
            label="Equator grid"
            img="/static/imgs/symbols/btn-equatorial-grid.svg"
            obj={stel.core.lines?.equatorial}
            attr="visible"
          />
          <StelButton
            label="Deep-sky"
            img="/static/imgs/symbols/btn-nebulae.svg"
            obj={stel.core.dsos}
            attr="visible"
          />
        </div>
      )}
    </div>
  );
}
