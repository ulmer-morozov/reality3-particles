import { ISettings } from "./ISettings";
export declare const saveSvg: (svgEl: SVGElement, name: string) => void;
export declare const saveImage: (canvas: HTMLCanvasElement, name: string) => void;
export declare function nameof<T>(propertyFunction: (x: T) => any): string;
export declare const settingsName: (func: (s: ISettings) => any) => string;
