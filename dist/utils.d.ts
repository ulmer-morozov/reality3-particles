import { ISettings } from "./ISettings";
export declare const saveImage: (canvas: HTMLCanvasElement, name: string) => Promise<void>;
export declare function nameof<T>(propertyFunction: (x: T) => any): string;
export declare const settingsName: (func: (s: ISettings) => any) => string;
