export declare class Particlizator {
    private readonly canvas;
    private readonly scene;
    private readonly controls;
    private readonly renderer;
    private readonly camera;
    private readonly gui;
    private readonly settings;
    private readonly presets;
    private animationId;
    private pointsMaterial;
    constructor(canvas: HTMLCanvasElement);
    loadModel: (url: string) => void;
    private initGui;
    private spriteUpdate;
    private particlesUpdate;
    private fogUpdate;
    private render;
    animate: (time?: number) => void;
    private onWindowResize;
    private addPresetsToGui;
    private storeImage;
}
