import { useEffect, useState, useRef } from "react";
import { UNKNOWN_OBJECT_NAME } from "../constants";
import { fetchWikipediaSummary } from "../utils/wikipedia";

export function useWikipediaSummary(objectName: string | null) {
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    if (!objectName || objectName === UNKNOWN_OBJECT_NAME) {
      setDescription(null);
      setLoading(false);
      setError(null);
      return;
    }

    const abortController = new AbortController();
    abortRef.current = abortController;

    setLoading(true);
    setError(null);
    setDescription(null);

    fetchWikipediaSummary(objectName, abortController.signal)
      .then((result) => {
        if (abortController.signal.aborted) return;
        if (result) {
          setDescription(result);
        } else {
          setError("No Wikipedia article found");
        }
      })
      .catch(() => {
        if (abortController.signal.aborted) return;
        setError("Failed to load description");
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [objectName]);

  return { description, loading, error };
}
