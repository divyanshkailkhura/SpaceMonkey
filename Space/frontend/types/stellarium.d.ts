interface StelCore {
  stars: { addDataSource: (config: { url: string }) => void };
  skycultures: { addDataSource: (config: { url: string; key: string }) => void };
  dsos: { addDataSource: (config: { url: string }) => void };
  landscapes: { addDataSource: (config: { url: string; key: string }) => void };
  milkyway: { addDataSource: (config: { url: string }) => void };
  minor_planets: { addDataSource: (config: { url: string; key: string }) => void };
  planets: { addDataSource: (config: { url: string; key: string }) => void };
  comets: { addDataSource: (config: { url: string; key: string }) => void };
  satellites: { addDataSource: (config: { url: string; key: string }) => void };
  progressbars: Array<{ label: string; value: number; total: number }>;
  constellations: { lines_visible: boolean };
  atmosphere: { visible: boolean };
  lines: { azimuthal: { visible: boolean }; equatorial: { visible: boolean } };
  dsos: { visible: boolean };
  dss: { visible: boolean };
  selection: {
    designations: () => string[];
    getInfo: (key: string) => number | number[] | undefined;
  } | null;
  observer: any;
}

interface StelInstance {
  core: StelCore;
  setFont: (type: string, url: string, size: number) => void;
  change: (callback: (obj: any, attr: string) => void) => void;
  a2tf: (angle: number, precision: number) => { hours: number; minutes: number; seconds: number; fraction: number };
  a2af: (angle: number, precision: number) => { sign: string; degrees: number; arcminutes: number; arcseconds: number; fraction: number };
  convertFrame: (observer: any, from: string, to: string, coords: number[]) => number[];
  c2s: (coords: number[]) => number[];
  anp: (angle: number) => number;
  anpm: (angle: number) => number;
}

interface StelWebEngine {
  (config: {
    wasmFile: string;
    canvas: HTMLCanvasElement | null;
    translateFn: (domain: string, str: string) => string;
    onReady: (stel: StelInstance) => void;
  }): void;
}

declare global {
  interface Window {
    StelWebEngine: (config: StelWebEngine) => void;
  }
}