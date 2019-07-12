export declare class Particlizator {
    private camera;
    private scene;
    private renderer;
    private svgRender;
    private renderToSVG;
    private controls;
    private gui;
    private presets;
    private settings;
    private pointsMaterial;
    executeDependency(): void;
    private matChanger;
    private initGui;
    private spriteUpdate;
    private particlesUpdate;
    private fogUpdate;
    private render;
    animate: (time?: number) => void;
    private onWindowResize;
    private addPresetsToGui;
}
