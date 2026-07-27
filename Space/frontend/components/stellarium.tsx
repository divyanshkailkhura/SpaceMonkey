"use client";

import { useMemo, useRef, useState } from "react";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedObject, setSelectedObject] = useState<StelObject | null>(null);

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

  // Two independent error sources (engine load vs. location lookup) share
  // one toast; whichever fired gets shown, and dismissing clears that one.
  const error = engineError ?? locationError;
  const clearError = engineError ? clearEngineError : clearLocationError;

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
        />
      )}

      {stel && <ControlsBar stel={stel} />}
    </div>
  );
}
