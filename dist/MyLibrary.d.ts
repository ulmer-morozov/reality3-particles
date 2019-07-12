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
    private cameraTarget;
    private gui;
    private effectController;
    private windowHalfX;
    private windowHalfY;
    private shaderSettings;
    private mouse;
    private raycaster;
    private distance;
    private target;
    private planes;
    private leaves;
    private materialDepth;
    private postprocessingscene;
    private postprocessingcamera;
    private postprocessingrtTextureDepth;
    private postprocessingrtTextureColor;
    private postprocessingbokeh_uniforms;
    private postprocessingmaterialBokeh;
    private postprocessingenabled;
    private postprocessingquad;
    private starsMaterial;
    executeDependency(): void;
    private matChanger;
    private initGui;
    private initPostProcessing;
    private particlesUpdate;
    private render;
    animate: (time?: number) => void;
    private shaderUpdate;
    private linearize;
    private smoothstep;
    private saturate;
    private onWindowResize;
    private onDocumentMouseMove;
}
export default MyLibrary;
