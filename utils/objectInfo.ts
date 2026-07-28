import { UNKNOWN_OBJECT_NAME } from "../constants";
import type { ObjectDetail, StelEngine, StelObject } from "../types";

export function getObjectName(obj: StelObject | null | undefined): string {
  if (!obj) return UNKNOWN_OBJECT_NAME;
  try {
    const designations = obj.designations?.();
    if (designations && designations.length > 0) {
      return designations[0].replace(/^NAME /, "");
    }
    return obj.getEnglishName?.() || obj.getNameI18n?.() || UNKNOWN_OBJECT_NAME;
  } catch {
    return UNKNOWN_OBJECT_NAME;
  }
}

function getTypeDetail(obj: StelObject): ObjectDetail {
  return { key: "Type", value: obj.getType?.() || obj.getObjectType?.() || "Unknown" };
}

function getMagnitudeDetail(obj: StelObject, stel: StelEngine): ObjectDetail | null {
  const magnitude = obj.getInfo?.("vmag") ?? obj.getVMagnitude?.(stel.core);
  if (magnitude === undefined || magnitude === null) return null;
  return { key: "Magnitude", value: magnitude.toFixed(2) };
}

/** Converts ICRF radec into apparent RA/Dec strings for the current observer. */
function getCoordinateDetails(obj: StelObject, stel: StelEngine): ObjectDetail[] {
  const radec = obj.getInfo?.("radec");
  if (!radec || !stel.c2s || !stel.convertFrame) return [];

  try {
    const converted = stel.convertFrame(stel.core.observer, "ICRF", "CIRS", radec);
    const spherical = stel.c2s(converted);
    const ra = stel.anp(spherical[0]);
    const dec = stel.anpm(spherical[1]);

    const raHours = Math.floor(ra);
    const raMinutes = Math.floor((ra % 1) * 60);
    const decDegrees = Math.floor(Math.abs(dec));
    const decMinutes = Math.floor((Math.abs(dec) % 1) * 60);
    const decSign = dec >= 0 ? "+" : "-";

    return [
      {
        key: "Right Ascension",
        value: `${String(raHours).padStart(2, "0")}h ${String(raMinutes).padStart(2, "0")}m`,
      },
      {
        key: "Declination",
        value: `${decSign}${String(decDegrees).padStart(2, "0")}° ${String(decMinutes).padStart(2, "0")}'`,
      },
    ];
  } catch (e) {
    console.warn("Could not calculate coordinates:", e);
    return [];
  }
}

function getDistanceDetail(obj: StelObject): ObjectDetail | null {
  const distance = obj.getInfo?.("distance");
  if (distance === undefined || distance === null) return null;
  if (distance > 1000) return { key: "Distance", value: `${(distance / 1000).toFixed(1)} kpc` };
  if (distance > 1) return { key: "Distance", value: `${distance.toFixed(1)} pc` };
  return { key: "Distance", value: `${(distance * 206265).toFixed(0)} AU` };
}

function getConstellationDetail(obj: StelObject): ObjectDetail | null {
  const constellation = obj.getInfo?.("constellation");
  return constellation ? { key: "Constellation", value: constellation } : null;
}

function getAlternateNamesDetail(obj: StelObject): ObjectDetail | null {
  const designations = obj.designations?.();
  if (!designations || designations.length <= 1) return null;
  const altNames = designations
    .slice(1, 3)
    .map((d) => d.replace(/^NAME /, ""))
    .join(", ");
  return altNames ? { key: "Also Known As", value: altNames } : null;
}

/**
 * Builds the astronomical-data rows shown in the object info panel.
 * Each fact is its own small, independently testable function; add a new
 * fact by writing one function and adding it to the list below.
 */
export function getObjectDetails(
  obj: StelObject | null | undefined,
  stel: StelEngine | null
): ObjectDetail[] {
  if (!obj || !stel) return [];

  try {
    const details: Array<ObjectDetail | null> = [
      getTypeDetail(obj),
      getMagnitudeDetail(obj, stel),
      ...getCoordinateDetails(obj, stel),
      getDistanceDetail(obj),
      getConstellationDetail(obj),
      getAlternateNamesDetail(obj),
    ];
    return details.filter((d): d is ObjectDetail => d !== null);
  } catch (e) {
    console.warn("Error getting object info:", e);
    return [{ key: "Error", value: "Could not retrieve object information" }];
  }
}
