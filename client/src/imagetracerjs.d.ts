declare module "imagetracerjs" {
  export interface ImageTracerOptions {
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    colorsampling?: number; // 0: disabled, 1: random, 2: deterministic
    numberofcolors?: number;
    mincolorratio?: number;
    colorquantcycles?: number;
    scale?: number;
    simplifytolerance?: number;
    roundcoords?: number; // 0: disable, 1: enable
    lcpr?: number;
    qcpr?: number;
    desc?: boolean;
    viewbox?: boolean;
    blurradius?: number;
    blurdelta?: number;
    strokewidth?: number;
  }

  export function imageToSVG(
    source: string,
    callback: (svgstr: string) => void,
    options?: ImageTracerOptions,
  ): void;

  export function imagedataToSVG(
    imageData: ImageData,
    options?: ImageTracerOptions,
  ): string;
}
