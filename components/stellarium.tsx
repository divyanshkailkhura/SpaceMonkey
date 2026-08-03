"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ControlsBar } from "@/components/ControlsBar";
import { ErrorToast } from "@/components/ErrorToast";
import { LocationDrawer } from "@/components/LocationDrawer";
import { LocationToggleButton } from "@/components/LocationToggleButton";
import { ObjectInfoPanel } from "@/components/ObjectInfoPanel";
import { useObserverLocation } from "@/hooks/useObserverLocation";
import { useStellariumEngine, useSyncObserverLocation } from "@/hooks/useStellariumEngine";
import { useWikipediaSummary } from "@/hooks/useWikipediaSummary";
import type { StelObject } from "@/types";
import { getObjectDetails, getObjectName } from "@/utils/objectInfo";

export default function Stellarium() {
  const { data: session } = useSession();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedObject, setSelectedObject] = useState<StelObject | null>(null);
  const [favoriteToast, setFavoriteToast] = useState<string | null>(null);
  const [favoriting, setFavoriting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const {
    location,
    cityQuery,
    setCityQuery,
    citySearching,
    geolocating,
    error: locationError,
    clearError: clearLocationError,
    handleFieldChange,
    handleGeolocation,
    handleCitySearch,
  } = useObserverLocation();

  const {
    stel,
    error: engineError,
    clearError: clearEngineError,
    loading: engineLoading,
  } = useStellariumEngine({
    canvasRef,
    initialLocation: location,
    onSelectionChange: setSelectedObject,
  });

  useSyncObserverLocation(stel, location);

  const selectedObjectName = useMemo(() => getObjectName(selectedObject), [selectedObject]);
  const { description: wikipediaDescription, loading: loadingWikipedia } = useWikipediaSummary(
    selectedObject ? selectedObjectName : null
  );
  const objectDetails = useMemo(
    () => getObjectDetails(selectedObject, stel),
    [selectedObject, stel]
  );

  const errors = useMemo(() => {
    const errs: string[] = [];
    if (engineError) errs.push(engineError);
    if (locationError) errs.push(locationError);
    return errs;
  }, [engineError, locationError]);

  const handleDismissEngineError = useCallback(() => clearEngineError(), [clearEngineError]);
  const handleDismissLocationError = useCallback(() => clearLocationError(), [clearLocationError]);

  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  const handleAddToFavorites = useCallback(async (name: string, type: string) => {
    if (!session) {
      setFavoriteToast("Sign in to favorite");
      setTimeout(() => setFavoriteToast(null), 2000);
      return;
    }
    setFavoriting(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectName: name, objectType: type }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setFavoriteToast("Added to Favorites!");
      } else {
        setFavoriteToast("Removed from Favorites");
      }
    } catch {
      setFavoriteToast("Failed to save favorite");
    } finally {
      setFavoriting(false);
    }
    setTimeout(() => setFavoriteToast(null), 2000);
  }, [session]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Interactive star map"
        role="application"
      />

      <button
        onClick={handleToggleFullscreen}
        aria-label={fullscreen ? "Exit full screen" : "Enter full screen"}
        title={fullscreen ? "Exit full screen (Esc)" : "Enter full screen"}
        className="fixed top-24 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-600/40 bg-slate-800/70 backdrop-blur-md text-slate-300 transition-colors hover:text-white hover:border-slate-500/60 hover:cursor-pointer"
      >
        {fullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
        )}
      </button>

      {engineLoading && !stel && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-sm text-slate-400">Initializing star map...</p>
          </div>
        </div>
      )}

      {errors.map((msg, i) => (
        <ErrorToast
          key={`${msg}-${i}`}
          message={msg}
          onDismiss={i === 0 && engineError ? handleDismissEngineError : handleDismissLocationError}
        />
      ))}

      <LocationToggleButton
        open={drawerOpen}
        locationName={location.name}
        onToggle={() => setDrawerOpen((open) => !open)}
      />

      {drawerOpen && (
        <LocationDrawer
          location={location}
          cityQuery={cityQuery}
          citySearching={citySearching}
          geolocating={geolocating}
          onCityQueryChange={setCityQuery}
          onCitySearch={handleCitySearch}
          onFieldChange={handleFieldChange}
          onUseGeolocation={() => handleGeolocation()}
        />
      )}

      {selectedObject && (
        <ObjectInfoPanel
          name={selectedObjectName}
          details={objectDetails}
          wikipediaDescription={wikipediaDescription}
          loadingWikipedia={loadingWikipedia}
          onClose={() => setSelectedObject(null)}
          onAddToFavorites={handleAddToFavorites}
          favoriteToast={favoriteToast}
          favoriting={favoriting}
        />
      )}

      {stel && <ControlsBar stel={stel} />}
    </div>
  );
}
