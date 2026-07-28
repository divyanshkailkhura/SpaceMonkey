/**
 * The Stellarium Web Engine is a WASM module with no published TypeScript
 * types. Rather than passing `any` around the whole app, this models just
 * the surface area this integration actually touches.
 *
 * `StelModule` is deliberately loose (index signature + optional members)
 * because engine sub-objects are hybrid: e.g. `core.dsos` is both a
 * visibility toggle (`.visible`) and a data-source host (`.addDataSource`).
 */

export interface StelObserver {
  latitude: number;
  longitude: number;
  altitude: number;
  location_name: string;
}

export interface StelModule {
  visible?: boolean;
  addDataSource?: (opts: { url: string; key?: string }) => void;
  [key: string]: any;
}

export interface StelObject {
  designations?: () => string[];
  getEnglishName?: () => string;
  getNameI18n?: () => string;
  getType?: () => string;
  getObjectType?: () => string;
  getInfo?: (key: string) => any;
  getVMagnitude?: (core: StelCore) => number;
}

export interface StelCore {
  observer: StelObserver;
  selection: StelObject | null;
  constellations: StelModule;
  atmosphere: StelModule;
  landscapes: StelModule;
  dsos: StelModule;
  stars: StelModule;
  skycultures: StelModule;
  milkyway: StelModule;
  minor_planets: StelModule;
  planets: StelModule;
  comets: StelModule;
  satellites: StelModule;
  lines?: {
    azimuthal?: StelModule;
    equatorial?: StelModule;
  };
}

export interface StelEngine {
  core: StelCore;
  setFont: (name: string, url: string, scale: number) => void;
  change: (cb: (obj: any, attr: string) => void) => void;
  convertFrame: (observer: StelObserver, from: string, to: string, v: any) => any;
  c2s: (v: any) => [number, number, number];
  anp: (v: number) => number;
  anpm: (v: number) => number;
}

export interface ObserverLocation {
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface ObjectDetail {
  key: string;
  value: string;
}

declare global {
  interface Window {
    StelWebEngine?: (opts: {
      wasmFile: string;
      canvas: HTMLCanvasElement | null;
      translateFn: (domain: string, str: string) => string;
      onReady: (stel: StelEngine) => void;
    }) => void;
  }
}
