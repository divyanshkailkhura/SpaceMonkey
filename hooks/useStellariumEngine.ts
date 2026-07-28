import { useEffect, useRef, useState } from "react";
import {
  DATA_SOURCES,
  FONTS,
  STELLARIUM_SCRIPT_SRC,
  STELLARIUM_WASM_SRC,
} from "../constants";
import type { ObserverLocation, StelCore, StelEngine, StelObject } from "../types";

function applyInitialObserver(core: StelCore, location: ObserverLocation) {
  core.observer.latitude = location.latitude;
  core.observer.longitude = location.longitude;
  core.observer.altitude = location.altitude;
  core.observer.location_name = location.name;
}

function registerDataSources(core: StelCore) {
  DATA_SOURCES.forEach(({ subsystem, url, key }) => {
    const module = core[subsystem] as StelCore["dsos"] | undefined;
    module?.addDataSource?.(key ? { url, key } : { url });
  });
}

function applyFonts(engine: StelEngine) {
  FONTS.forEach(({ name, url, scale }) => engine.setFont(name, url, scale));
}

interface UseStellariumEngineArgs {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  initialLocation: ObserverLocation;
  onSelectionChange: (obj: StelObject | null) => void;
}

/**
 * Loads the Stellarium Web Engine script + WASM, initializes the observer,
 * data sources and fonts, and keeps `stel` in sync with the engine's own
 * "change" events (used both to trigger re-renders and to report new
 * object selections).
 *
 * `initialLocation` is only read once, at engine startup — later location
 * edits should flow through `useSyncObserverLocation` instead, so this
 * effect never needs to re-run just because the user typed a new latitude.
 */
export function useStellariumEngine({
  canvasRef,
  initialLocation,
  onSelectionChange,
}: UseStellariumEngineArgs) {
  const [stel, setStel] = useState<StelEngine | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialLocationRef = useRef(initialLocation);
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = STELLARIUM_SCRIPT_SRC;
    script.async = true;

    script.onload = () => {
      if (!window.StelWebEngine) {
        setError("Stellarium engine missing");
        return;
      }

      window.StelWebEngine({
        wasmFile: STELLARIUM_WASM_SRC,
        canvas: canvasRef.current,
        translateFn: (_domain: string, str: string) => str,
        onReady: (engine: StelEngine) => {
          try {
            applyInitialObserver(engine.core, initialLocationRef.current);
            registerDataSources(engine.core);
            applyFonts(engine);

            engine.change((_obj: any, attr: string) => {
              if (attr === "hovered") return;
              setStel({ ...engine });
              if (attr === "selection") {
                onSelectionChangeRef.current(engine.core.selection);
              }
            });

            setStel(engine);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearError = () => setError(null);

  return { stel, error, clearError };
}

/** Pushes user-edited location state into the live engine observer. */
export function useSyncObserverLocation(stel: StelEngine | null, location: ObserverLocation) {
  useEffect(() => {
    if (!stel?.core?.observer) return;
    const { observer } = stel.core;
    observer.latitude = location.latitude;
    observer.longitude = location.longitude;
    observer.altitude = location.altitude;
    observer.location_name = location.name;
  }, [stel, location]);
}