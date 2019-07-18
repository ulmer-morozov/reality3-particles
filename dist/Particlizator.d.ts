export declare enum SourceFormat {
    OBJ = 1,
    PLY = 2
}
export declare class Particlizator {
    private readonly canvas;
    private readonly scene;
    private readonly controls;
    private readonly renderer;
    private readonly camera;
    private readonly gui;
    private readonly settings;
    private readonly geometries;
    private readonly presets;
    private animationId;
    private pointsMaterial;
    constructor(canvas: HTMLCanvasElement);
    loadModel: (url: string, format: SourceFormat) => void;
    private initGui;
    private spriteUpdate;
    private particlesUpdate;
    private fogUpdate;
    private render;
    animate: (time?: number) => void;
    private scale01X;
    private scale05X;
    private scale2X;
    private scale10X;
    private scaleGeometries;
    private onWindowResize;
    private addPresetsToGui;
    private storeImage;
}
