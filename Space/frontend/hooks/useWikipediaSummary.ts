import { useEffect, useState } from "react";
import { UNKNOWN_OBJECT_NAME } from "../constants";
import { fetchWikipediaSummary } from "../utils/wikipedia";

/**
 * Fetches (and cancels stale fetches for) a Wikipedia summary whenever
 * `objectName` changes. Pass `null` to clear the description, e.g. when
 * nothing is selected.
 */
export function useWikipediaSummary(objectName: string | null) {
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!objectName || objectName === UNKNOWN_OBJECT_NAME) {
      setDescription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setDescription(null);

    fetchWikipediaSummary(objectName).then((result) => {
      if (cancelled) return;
      setDescription(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [objectName]);

  return { description, loading };
}
