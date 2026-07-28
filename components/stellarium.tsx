"use client";

import { useMemo, useRef, useState, useCallback } from "react";
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

  const {
    location,
    cityQuery,
    setCityQuery,
    citySearching,
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

  const error = engineError ?? locationError;
  const clearError = engineError ? clearEngineError : clearLocationError;

  const handleAddToFavorites = useCallback(async (name: string, type: string) => {
    if (!session) {
      setFavoriteToast("Sign in to favorite");
      setTimeout(() => setFavoriteToast(null), 2000);
      return;
    }
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectName: name, objectType: type }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setFavoriteToast("★ Added to Favorites!");
      } else {
        setFavoriteToast("☆ Removed from Favorites");
      }
    } catch {
      setFavoriteToast("Failed");
    }
    setTimeout(() => setFavoriteToast(null), 2000);
  }, [session]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <ErrorToast message={error} onDismiss={clearError} />

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
          onCityQueryChange={setCityQuery}
          onCitySearch={handleCitySearch}
          onFieldChange={handleFieldChange}
          onUseGeolocation={handleGeolocation}
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
        />
      )}

      {stel && <ControlsBar stel={stel} />}
    </div>
  );
}
