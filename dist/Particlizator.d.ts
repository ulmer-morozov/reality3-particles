export declare enum SourceFormat {
    NotSet = 0,
    OBJ = 1,
    PLY = 2,
    GLTF = 3,
    FBX = 4
}
export declare class Particlizator {
    private readonly canvas;
    private readonly scene;
    private readonly controls;
    private readonly renderer;
    private readonly camera;
    private readonly axis;
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
    private flipX;
    private flipY;
    private scale01X;
    private scale05X;
    private scale2X;
    private scale10X;
    private scaleGeometries;
    private rotateGeometryZ;
    private onWindowResize;
    private addPresetsToGui;
    private storeImage;
}
