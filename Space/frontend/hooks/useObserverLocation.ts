import { useState } from "react";
import { DEFAULT_LOCATION } from "../constants";
import type { ObserverLocation } from "../types";

/**
 * Owns the "where is the observer standing" state: manual lat/lon/name
 * fields, browser geolocation + reverse geocoding, and city-name search.
 * Deliberately knows nothing about the Stellarium engine — pushing this
 * state into the engine is `useSyncObserverLocation`'s job, so this hook
 * stays testable without a WASM engine in the loop.
 */
export function useObserverLocation() {
  const [location, setLocation] = useState<ObserverLocation>(DEFAULT_LOCATION);
  const [cityQuery, setCityQuery] = useState("");
  const [citySearching, setCitySearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocation((prev) => ({ ...prev, [name]: name === "name" ? value : Number(value) }));
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported on this device");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`
          );
          const data = await res.json();
          const nice =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.hamlet ||
            "Unnamed place";
          setLocation({ name: nice, latitude: coords.latitude, longitude: coords.longitude, altitude: 10 });
        } catch {
          setLocation({ name: "My Location", latitude: coords.latitude, longitude: coords.longitude, altitude: 10 });
        }
      },
      () => setError("Location access denied")
    );
  };

  const handleCitySearch = async () => {
    if (!cityQuery.trim()) return;
    setCitySearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(cityQuery)}`
      );
      const [match] = await res.json();
      if (!match) {
        setError("City not found");
        return;
      }
      setLocation({
        name: match.display_name,
        latitude: parseFloat(match.lat),
        longitude: parseFloat(match.lon),
        altitude: 10,
      });
      setCityQuery("");
    } catch {
      setError("Failed to fetch city");
    } finally {
      setCitySearching(false);
    }
  };

  const clearError = () => setError(null);

  return {
    location,
    cityQuery,
    setCityQuery,
    citySearching,
    error,
    clearError,
    handleFieldChange,
    handleGeolocation,
    handleCitySearch,
  };
}
