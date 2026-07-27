import type { ObserverLocation, StelCore } from "./types";

export const STELLARIUM_SCRIPT_SRC =
  "/stellarium-web-engine/build/stellarium-web-engine.js";
export const STELLARIUM_WASM_SRC =
  "/stellarium-web-engine/build/stellarium-web-engine.wasm";

const SKY_DATA_BASE_URL = "/test-skydata/";

export const DEFAULT_LOCATION: ObserverLocation = {
  name: "New York",
  latitude: 40.7128,
  longitude: -74.006,
  altitude: 10,
};

export const FONTS = [
  { name: "regular", url: "/static/fonts/Roboto-Regular.ttf", scale: 1.38 },
  { name: "bold", url: "/static/fonts/Roboto-Bold.ttf", scale: 1.38 },
] as const;

/**
 * Every catalog/survey the engine loads on startup. Adding a new data
 * source is a one-line addition here instead of a new block of
 * `core.<module>.addDataSource(...)` buried in the init effect.
 */
export const DATA_SOURCES: Array<{
  subsystem: keyof StelCore;
  url: string;
  key?: string;
}> = [
  { subsystem: "stars", url: `${SKY_DATA_BASE_URL}stars` },
  {
    subsystem: "skycultures",
    url: `${SKY_DATA_BASE_URL}skycultures/western`,
    key: "western",
  },
  { subsystem: "dsos", url: `${SKY_DATA_BASE_URL}dso` },
  {
    subsystem: "landscapes",
    url: `${SKY_DATA_BASE_URL}landscapes/guereins`,
    key: "guereins",
  },
  { subsystem: "milkyway", url: `${SKY_DATA_BASE_URL}surveys/milkyway` },
  {
    subsystem: "minor_planets",
    url: `${SKY_DATA_BASE_URL}mpcorb.dat`,
    key: "mpc_asteroids",
  },
  {
    subsystem: "planets",
    url: `${SKY_DATA_BASE_URL}surveys/sso/moon`,
    key: "moon",
  },
  {
    subsystem: "planets",
    url: `${SKY_DATA_BASE_URL}surveys/sso/sun`,
    key: "sun",
  },
  {
    subsystem: "comets",
    url: `${SKY_DATA_BASE_URL}CometEls.txt`,
    key: "mpc_comets",
  },
  {
    subsystem: "satellites",
    url: `${SKY_DATA_BASE_URL}tle_satellite.jsonl.gz`,
    key: "jsonl/sat",
  },
];

/**
 * Bottom-right toggle bar. Data-driven so adding/removing/reordering a
 * layer toggle never touches JSX — just this list.
 */
export const CONTROL_BUTTONS: Array<{
  label: string;
  img: string;
  attr: string;
  getModule: (core: StelCore) => StelCore["dsos"] | undefined;
}> = [
  {
    label: "Constellations",
    img: "/static/imgs/symbols/btn-cst-lines.svg",
    attr: "visible",
    getModule: (core) => core.constellations,
  },
  {
    label: "Atmosphere",
    img: "/static/imgs/symbols/btn-atmosphere.svg",
    attr: "visible",
    getModule: (core) => core.atmosphere,
  },
  {
    label: "Landscape",
    img: "/static/imgs/symbols/btn-landscape.svg",
    attr: "visible",
    getModule: (core) => core.landscapes,
  },
  {
    label: "Azimuth grid",
    img: "/static/imgs/symbols/btn-azimuthal-grid.svg",
    attr: "visible",
    getModule: (core) => core.lines?.azimuthal,
  },
  {
    label: "Equator grid",
    img: "/static/imgs/symbols/btn-equatorial-grid.svg",
    attr: "visible",
    getModule: (core) => core.lines?.equatorial,
  },
  {
    label: "Deep-sky",
    img: "/static/imgs/symbols/btn-nebulae.svg",
    attr: "visible",
    getModule: (core) => core.dsos,
  },
];

export const UNKNOWN_OBJECT_NAME = "Unknown Object";
