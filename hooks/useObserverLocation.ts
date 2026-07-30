import { useState, useEffect } from "react";
import { DEFAULT_LOCATION } from "../constants";
import type { ObserverLocation } from "../types";

const STORAGE_KEY = "spacemonkey-location";

function loadCachedLocation(): ObserverLocation {
  if (typeof window === "undefined") return DEFAULT_LOCATION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed.latitude === "number" &&
        typeof parsed.longitude === "number" &&
        typeof parsed.name === "string"
      ) {
        return { ...parsed, altitude: parsed.altitude ?? 10 };
      }
    }
  } catch {}
  return DEFAULT_LOCATION;
}

function saveLocation(loc: ObserverLocation) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {}
}

export function useObserverLocation() {
  const [location, setLocation] = useState<ObserverLocation>(loadCachedLocation);
  const [cityQuery, setCityQuery] = useState("");
  const [citySearching, setCitySearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocation((prev) => ({ ...prev, [name]: name === "name" ? value : Number(value) }));
  };

  const handleGeolocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) setError("Geolocation not supported on this device");
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
          const loc: ObserverLocation = { name: nice, latitude: coords.latitude, longitude: coords.longitude, altitude: 10 };
          setLocation(loc);
          saveLocation(loc);
        } catch {
          const loc: ObserverLocation = { name: "My Location", latitude: coords.latitude, longitude: coords.longitude, altitude: 10 };
          setLocation(loc);
          saveLocation(loc);
        }
      },
      () => {
        if (!silent) setError("Location access denied");
      }
    );
  };

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      handleGeolocation(true);
    }
  }, []);

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
      const loc: ObserverLocation = {
        name: match.display_name,
        latitude: parseFloat(match.lat),
        longitude: parseFloat(match.lon),
        altitude: 10,
      };
      setLocation(loc);
      saveLocation(loc);
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
