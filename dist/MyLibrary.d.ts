export interface Foo {
    executeDependency: Function;
}
export declare class MyLibrary implements Foo {
    private camera;
    private scene;
    private renderer;
    private svgRender;
    private renderToSVG;
    private controls;
    private gui;
    private effectController;
    private pointsMaterial;
    executeDependency(): void;
    private matChanger;
    private initGui;
    private particlesUpdate;
    private render;
    animate: (time?: number) => void;
    private onWindowResize;
}
